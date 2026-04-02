// backend/routes/mockInterview.js
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { auth } = require('../middleware/auth');
const StudentProfile = require('../models/StudentProfile');

// ─── Init Gemini ───────────────────────────────────────────────────────────────
const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
let genAI = null;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
} else {
  console.warn('[MockInterview] WARNING: No Gemini API key found. AI mode will be limited.');
}

// ─── Helper: fetch & format student profile ────────────────────────────────────
async function getProfileContext(userId) {
  try {
    const profile = await StudentProfile.findOne({ userId });
    if (!profile) return null;

    const techSkills = profile.skills?.technical?.join(', ') || null;
    const softSkills = profile.skills?.soft?.join(', ') || null;
    const tools = profile.skills?.tools?.join(', ') || null;
    const projects = profile.projects?.length
      ? profile.projects
          .slice(0, 3) // top 3 projects
          .map(p => `"${p.title}" — ${p.description} (Stack: ${p.technologies?.join(', ') || 'N/A'})`)
          .join('\n  • ')
      : null;
    const experience = profile.workExperience?.length
      ? profile.workExperience
          .map(w => `${w.jobTitle} at ${w.company} (${w.duration}): ${w.description}`)
          .join('\n  • ')
      : null;
    const education = profile.education
      ? `${profile.education.degree} in ${profile.education.field} from ${profile.education.institution}`
      : null;
    const targetRoles = profile.careerPreferences?.preferredRoles?.join(', ') || null;

    return {
      education,
      techSkills,
      softSkills,
      tools,
      projects,
      experience,
      targetRoles,
    };
  } catch (err) {
    console.warn('[MockInterview] Failed to fetch student profile:', err.message);
    return null;
  }
}

// ─── Helper: build profile context string ─────────────────────────────────────
function formatProfileContext(p) {
  if (!p) return '(No specific candidate profile available — ask general role questions.)';

  let ctx = '--- CANDIDATE PROFILE ---\n';
  if (p.education) ctx += `Education: ${p.education}\n`;
  if (p.techSkills) ctx += `Technical Skills: ${p.techSkills}\n`;
  if (p.tools) ctx += `Tools & Frameworks: ${p.tools}\n`;
  if (p.projects) ctx += `Key Projects:\n  • ${p.projects}\n`;
  if (p.experience) ctx += `Work Experience:\n  • ${p.experience}\n`;
  if (p.targetRoles) ctx += `Targeted Roles: ${p.targetRoles}\n`;
  ctx += '---';
  return ctx;
}

// ─── Helper: build system instruction ─────────────────────────────────────────
function buildSystemInstruction(role, level, type, profileCtx) {
  return `You are "Aurelian", an elite technical interviewer at a top-tier tech company.
You are conducting a REAL ${type} interview for the position of ${level} ${role}.

${profileCtx}

=== YOUR INTERVIEW PROTOCOL ===
1. ROLE: Act as a demanding but fair professional interviewer. Stay in character at ALL times.
2. QUESTIONS: Ask ONE concise, targeted question per turn. No multiple questions.
3. PERSONALIZATION: Reference the candidate's actual projects, tech stack, and experience above.
   - From Q1-Q3: Ask specific questions about their listed projects or skills.
   - From Q4-Q6: Probe implementation details, tradeoffs, design decisions.
   - From Q7+: Ask advanced scenario-based or system design questions.
4. FOLLOW-UP STRATEGY: 80% of follow-up questions must directly build on the candidate's LAST answer.
   - If they mention a technology → ask a depth question about that technology.
   - If they describe a problem → ask how they solved it.
   - If they claim expertise → test it with a specific hard question.
5. TONE: Professional, crisp, and direct. No praise unless truly deserved (e.g., "Good point.").
6. FORBIDDEN: Never ask "Tell me about yourself", "What are your strengths/weaknesses", "Where do you see yourself in 5 years".
7. FORMAT: Plain text only. No markdown, no bullet points, no bold. Speak naturally.
8. LENGTH: Max 2-3 sentences per response. Keep it conversational.
9. CLOSING: When concluding the interview (final question or INTERVIEW_COMPLETE signal), say "Thank you for your time. The interview is now complete." and nothing else.`;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  POST /api/mock-interview/chat
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/chat', auth, async (req, res) => {
  try {
    if (!genAI) throw new Error('Gemini AI not configured');

    const {
      jobRole,
      interviewType,
      experienceLevel,
      conversationHistory = [],
      questionNumber = 0,
      maxQuestions = 8,
    } = req.body;

    const role = jobRole || 'Software Engineer';
    const type = interviewType || 'Technical';
    const level = experienceLevel || 'Entry-Level';

    // Fetch student profile
    const profile = await getProfileContext(req.user?.id || req.userId);
    const profileCtx = formatProfileContext(profile);

    const systemInstruction = buildSystemInstruction(role, level, type, profileCtx);

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction,
    });

    // Build conversation prompt
    let prompt;

    if (conversationHistory.length === 0) {
      // ── OPENING ─────────────────────────────────────────────────────────
      const hasProfile = profile && (profile.projects || profile.techSkills);

      if (hasProfile) {
        prompt = `This is the FIRST question of the interview. 
        
ACTION: Welcome the candidate with one brief professional sentence, then immediately ask a sharp, specific question about one of their ACTUAL listed projects or technical skills. Do NOT ask for a self-introduction.

Example pattern (adapt to their real background):
"Welcome. I see you worked on [specific project] — walk me through the most technically challenging component you built in that project."

Now generate the opening using the candidate's actual background above.`;
      } else {
        prompt = `This is the FIRST question of the interview.

ACTION: Welcome the candidate briefly, then immediately ask a strong scenario-based ${type} question relevant to a ${level} ${role} position. Make it specific and technical.`;
      }
    } else {
      // ── FOLLOW-UP ───────────────────────────────────────────────────────
      // Build transcript
      const transcript = conversationHistory
        .map(msg => `${msg.role === 'user' ? 'Candidate' : 'Aurelian'}: ${msg.content}`)
        .join('\n\n');

      const qNum = questionNumber || Math.ceil(conversationHistory.length / 2);
      const isNearEnd = qNum >= maxQuestions - 1;
      const isLastQ = qNum >= maxQuestions;

      if (isLastQ) {
        prompt = `FINAL EXCHANGE. You have covered enough ground.

TRANSCRIPT:
${transcript}

INSTRUCTION: Give very brief closing remarks (one sentence max acknowledging the interview) and then say exactly: "Thank you for your time. The interview is now complete."`;
      } else {
        prompt = `INTERVIEW TRANSCRIPT (Question ${qNum} of ${maxQuestions}):
${transcript}

INSTRUCTION:
- Carefully read the Candidate's most recent answer.
- Identify the single most interesting technical claim, gap, or statement they made.
- Ask ONE precise follow-up question that probes that specific point deeper.
${isNearEnd
  ? '- This is nearly the end of the interview. Make this question count — ask something advanced that differentiates strong candidates.'
  : '- Push them on implementation details, tradeoffs, or edge cases they skipped.'}
- Do NOT repeat themes from earlier in the transcript.
- Do NOT ask multiple questions.

YOUR RESPONSE (the next question only):`;
      }
    }

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    return res.json({ success: true, response: responseText });

  } catch (error) {
    console.error('[MockInterview] Chat Error:', error.message);

    // ── Graceful fallback ──────────────────────────────────────────────────
    const fallbacks = [
      'Welcome! Let\'s start with a focused question: Can you describe a recent project where you faced a significant technical challenge and how you resolved it?',
      'Interesting. What specific data structures or algorithms did you rely on most in that project, and why did you choose them?',
      'Good. Walk me through how you would design a scalable REST API for a high-traffic e-commerce platform from scratch.',
      'Can you explain how you ensure code quality in a team? What tools and processes have you actually used?',
      'Describe a situation where you had to make a tradeoff between performance and maintainability. What did you choose and why?',
      'How would you debug a memory leak in a production Node.js application?',
      'If you were to redo one of your past projects with your current knowledge, what would you change architecturally?',
      'Thank you for your time. The interview is now complete.',
    ];

    const history = req.body.conversationHistory || [];
    const idx = Math.min(Math.ceil(history.length / 2), fallbacks.length - 1);

    return res.json({
      success: true,
      response: fallbacks[idx],
      fallback: true,
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  POST /api/mock-interview/evaluate
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/evaluate', auth, async (req, res) => {
  if (!genAI) {
    return res.status(500).json({ success: false, error: 'Gemini AI not configured.' });
  }

  try {
    const { jobRole, interviewType, experienceLevel, conversationHistory } = req.body;

    if (!conversationHistory || conversationHistory.length < 4) {
      return res.status(400).json({ success: false, error: 'Interview too short to evaluate.' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const transcript = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`)
      .join('\n\n');

    const evaluationPrompt = `You are a senior technical hiring manager evaluating a candidate interview for the role of ${experienceLevel} ${jobRole} (${interviewType} focus).

TRANSCRIPT:
${transcript}

---
Evaluate this candidate thoroughly and fairly. Return ONLY a valid JSON object (no markdown, no code blocks):

{
  "overallScore": <integer 0-100>,
  "communicationScore": <integer 0-100>,
  "technicalScore": <integer 0-100>,
  "strengths": [
    "<specific strength 1 based on actual answer content>",
    "<specific strength 2>",
    "<specific strength 3>"
  ],
  "weaknesses": [
    "<specific area to improve 1>",
    "<specific area to improve 2>",
    "<specific area to improve 3>"
  ],
  "feedback": "<2-3 sentence paragraph summarizing their overall performance, citing specific moments from the interview, and giving a hiring recommendation>"
}

Scoring criteria:
- Technical accuracy and depth: 40%
- Communication clarity and structure: 30% 
- Problem-solving approach: 20%
- Enthusiasm and professionalism: 10%

Be honest. Do not sugarcoat weak performances.`;

    const result = await model.generateContent(evaluationPrompt);
    let text = result.response.text();

    // Strip markdown fences if present
    text = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid JSON from AI evaluator');

    const evaluation = JSON.parse(jsonMatch[0]);

    // Validate required fields
    const required = ['overallScore', 'communicationScore', 'technicalScore', 'strengths', 'weaknesses', 'feedback'];
    for (const field of required) {
      if (evaluation[field] === undefined) throw new Error(`Missing field: ${field}`);
    }

    return res.json({ success: true, evaluation });

  } catch (error) {
    console.error('[MockInterview] Evaluation Error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to generate evaluation report.' });
  }
});

module.exports = router;
