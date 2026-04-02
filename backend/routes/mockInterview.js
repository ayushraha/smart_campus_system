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
    const tools      = profile.skills?.tools?.join(', ')      || null;
    const projects   = profile.projects?.length
      ? profile.projects
          .slice(0, 3)
          .map(p => `"${p.title}" — ${p.description} (Stack: ${p.technologies?.join(', ') || 'N/A'})`)
          .join('\n  • ')
      : null;
    const experience = profile.workExperience?.length
      ? profile.workExperience
          .map(w => `${w.jobTitle} at ${w.company} (${w.duration}): ${w.description}`)
          .join('\n  • ')
      : null;
    const education  = profile.education
      ? `${profile.education.degree} in ${profile.education.field} from ${profile.education.institution}`
      : null;
    const targetRoles = profile.careerPreferences?.preferredRoles?.join(', ') || null;

    return { education, techSkills, tools, projects, experience, targetRoles };
  } catch (err) {
    console.warn('[MockInterview] Failed to fetch student profile:', err.message);
    return null;
  }
}

function formatProfileContext(p) {
  if (!p) return '(No specific candidate profile available — ask general role questions.)';
  let ctx = '--- CANDIDATE PROFILE ---\n';
  if (p.education)   ctx += `Education: ${p.education}\n`;
  if (p.techSkills)  ctx += `Technical Skills: ${p.techSkills}\n`;
  if (p.tools)       ctx += `Tools & Frameworks: ${p.tools}\n`;
  if (p.projects)    ctx += `Key Projects:\n  • ${p.projects}\n`;
  if (p.experience)  ctx += `Work Experience:\n  • ${p.experience}\n`;
  if (p.targetRoles) ctx += `Targeted Roles: ${p.targetRoles}\n`;
  ctx += '---';
  return ctx;
}

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
9. CLOSING: When concluding the interview, say "Thank you for your time. The interview is now complete." and nothing else.`;
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

    const role  = jobRole        || 'Software Engineer';
    const type  = interviewType  || 'Technical';
    const level = experienceLevel|| 'Entry-Level';

    const profile    = await getProfileContext(req.user?.id || req.userId);
    const profileCtx = formatProfileContext(profile);
    const sysInstr   = buildSystemInstruction(role, level, type, profileCtx);

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: sysInstr,
    });

    let prompt;

    if (conversationHistory.length === 0) {
      const hasProfile = profile && (profile.projects || profile.techSkills);
      if (hasProfile) {
        prompt = `This is the FIRST question of the interview.
ACTION: Welcome the candidate with one brief professional sentence, then immediately ask a sharp, specific question about one of their ACTUAL listed projects or technical skills. Do NOT ask for a self-introduction.
Example pattern: "Welcome. I see you worked on [specific project] — walk me through the most technically challenging component you built in that project."
Now generate the opening using the candidate's actual background above.`;
      } else {
        prompt = `This is the FIRST question of the interview.
ACTION: Welcome the candidate briefly, then immediately ask a strong scenario-based ${type} question relevant to a ${level} ${role} position. Make it specific and technical.`;
      }
    } else {
      const transcript = conversationHistory
        .map(msg => `${msg.role === 'user' ? 'Candidate' : 'Aurelian'}: ${msg.content}`)
        .join('\n\n');

      const qNum      = questionNumber || Math.ceil(conversationHistory.length / 2);
      const isNearEnd = qNum >= maxQuestions - 1;
      const isLastQ   = qNum >= maxQuestions;

      if (isLastQ) {
        prompt = `FINAL EXCHANGE. You have covered enough ground.
TRANSCRIPT:
${transcript}
INSTRUCTION: Give very brief closing remarks (one sentence max) and then say exactly: "Thank you for your time. The interview is now complete."`;
      } else {
        prompt = `INTERVIEW TRANSCRIPT (Question ${qNum} of ${maxQuestions}):
${transcript}

INSTRUCTION:
- Carefully read the Candidate's most recent answer.
- Identify the single most interesting technical claim, gap, or statement they made.
- Ask ONE precise follow-up question that probes that specific point deeper.
${isNearEnd
  ? '- This is nearly the end. Ask something advanced that differentiates strong candidates.'
  : '- Push them on implementation details, tradeoffs, or edge cases they skipped.'}
- Do NOT repeat themes from earlier in the transcript.
- Do NOT ask multiple questions.

YOUR RESPONSE (the next question only):`;
      }
    }

    const result       = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    return res.json({ success: true, response: responseText });

  } catch (error) {
    console.error('[MockInterview] Chat Error:', error.message);

    const fallbacks = [
      "Welcome! Let's start — can you describe a recent project where you faced a significant technical challenge and how you resolved it?",
      "Interesting. What specific data structures or algorithms did you rely on most in that project, and why did you choose them?",
      "Good. Walk me through how you would design a scalable REST API for a high-traffic platform from scratch.",
      "Can you explain how you ensure code quality in a team? What tools and processes have you actually used?",
      "Describe a situation where you had to make a tradeoff between performance and maintainability. What did you choose and why?",
      "How would you debug a memory leak in a production Node.js application?",
      "If you were to redo one of your past projects with your current knowledge, what would you change architecturally?",
      "Thank you for your time. The interview is now complete.",
    ];

    const history = req.body.conversationHistory || [];
    const idx     = Math.min(Math.ceil(history.length / 2), fallbacks.length - 1);

    return res.json({ success: true, response: fallbacks[idx], fallback: true });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  POST /api/mock-interview/evaluate
//  Bulletproof: always returns 200 with an evaluation object — never 500
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/evaluate', auth, async (req, res) => {

  // ── Helpers ────────────────────────────────────────────────────────────────
  const clamp = (v, min = 0, max = 100) =>
    Math.min(max, Math.max(min, Math.round(Number(v) || 50)));

  const defaultEval = (history = [], role = 'the role', type = 'interview') => {
    const userMsgs    = history.filter(m => m.role === 'user');
    const avgWords    = userMsgs.reduce((s, m) => s + (m.content || '').split(/\s+/).length, 0)
                        / Math.max(userMsgs.length, 1);
    const base        = clamp(Math.round((Math.min(avgWords * 1.5, 100) + (userMsgs.length / 8) * 100) / 2));

    return {
      overallScore:       base,
      communicationScore: clamp(base + 5),
      technicalScore:     clamp(base - 5),
      strengths: [
        'Completed the interview session',
        'Engaged consistently with technical questions',
        'Demonstrated willingness to problem-solve under pressure',
      ],
      weaknesses: [
        'Consider providing more concrete implementation examples',
        'Add more depth when discussing technical tradeoffs',
        'Expand on system-level thinking in answers',
      ],
      feedback: `You completed ${userMsgs.length} question(s) in this ${type} interview. A full AI-generated evaluation was not available at this time. The scores above are estimated from your response patterns. Retake the interview for a complete analysis.`,
    };
  };

  // ── Main logic ─────────────────────────────────────────────────────────────
  try {
    const { jobRole, interviewType, experienceLevel, conversationHistory } = req.body;

    const role    = jobRole         || 'Software Engineer';
    const type    = interviewType   || 'Technical';
    const level   = experienceLevel || 'Entry-Level';
    const history = Array.isArray(conversationHistory) ? conversationHistory : [];

    // Require at least 1 user answer
    const userAnswers = history.filter(m => m.role === 'user');
    if (userAnswers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Please answer at least one question before requesting an evaluation.',
      });
    }

    // ── Attempt Gemini evaluation ──────────────────────────────────────────
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const transcript = history
          .map(m => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`)
          .join('\n\n');

        const prompt = `You are a senior technical hiring manager.
Evaluate this ${type} interview for the role of ${level} ${role}.

TRANSCRIPT:
${transcript}

Return ONLY a raw JSON object. No markdown fences, no prose before or after — just the JSON.

{"overallScore":75,"communicationScore":70,"technicalScore":80,"strengths":["Strength based on actual answer","Second strength","Third strength"],"weaknesses":["Area to improve based on actual answer","Second area","Third area"],"feedback":"2-3 sentence summary citing specific moments from the transcript and a hiring recommendation."}

Scoring rules (integers 0-100, be honest):
- overallScore: weighted result
- communicationScore: clarity, structure, conciseness
- technicalScore: accuracy, depth, correct terminology
Do NOT be generous. Score accurately.`;

        const result = await model.generateContent(prompt);
        let text = (result.response.text() || '').trim();

        // ── Multi-pass JSON extraction ──────────────────────────────────
        // Strip markdown fences
        text = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();

        // Find outermost JSON object
        const start = text.indexOf('{');
        const end   = text.lastIndexOf('}');
        if (start === -1 || end === -1) throw new Error('No JSON object found in AI response');

        let jsonStr = text.slice(start, end + 1);

        // Fix common Gemini quirks
        jsonStr = jsonStr
          .replace(/,\s*([}\]])/g, '$1')       // trailing commas
          .replace(/[\u2018\u2019]/g, "'")       // smart single quotes
          .replace(/[\u201C\u201D]/g, '"');       // smart double quotes

        const evaluation = JSON.parse(jsonStr);

        // Normalise types
        evaluation.overallScore       = clamp(evaluation.overallScore);
        evaluation.communicationScore = clamp(evaluation.communicationScore);
        evaluation.technicalScore     = clamp(evaluation.technicalScore);

        if (!Array.isArray(evaluation.strengths) || !evaluation.strengths.length) {
          evaluation.strengths = defaultEval(history, role, type).strengths;
        }
        if (!Array.isArray(evaluation.weaknesses) || !evaluation.weaknesses.length) {
          evaluation.weaknesses = defaultEval(history, role, type).weaknesses;
        }
        if (!evaluation.feedback || typeof evaluation.feedback !== 'string') {
          evaluation.feedback = defaultEval(history, role, type).feedback;
        }

        console.log('[MockInterview] Evaluation generated successfully.');
        return res.json({ success: true, evaluation });

      } catch (aiErr) {
        console.error('[MockInterview] AI evaluation failed, using synthetic fallback:', aiErr.message);
        // Fall through to synthetic evaluation
      }
    }

    // ── Synthetic fallback ─────────────────────────────────────────────────
    console.warn('[MockInterview] Returning synthetic evaluation.');
    return res.json({
      success: true,
      evaluation: defaultEval(history, role, type),
      synthetic: true,
    });

  } catch (fatalErr) {
    // Absolute last resort — never let the client see a raw 500
    console.error('[MockInterview] Evaluate fatal error:', fatalErr.message);
    return res.json({
      success: true,
      evaluation: {
        overallScore: 50,
        communicationScore: 50,
        technicalScore: 50,
        strengths: ['Participated in the interview', 'Responded to questions', 'Completed the session'],
        weaknesses: ['Detailed evaluation unavailable — please retake', 'Ensure stable internet connection', 'Try again in a few minutes'],
        feedback: 'An unexpected error occurred while generating your evaluation. Your scores above are placeholders. Please retake the interview to receive a full AI-generated performance report.',
      },
      synthetic: true,
    });
  }
});

module.exports = router;
