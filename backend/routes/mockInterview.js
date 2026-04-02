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
  console.warn('[MockInterview] WARNING: No Gemini API key found.');
}

// ─── Helper: fetch student profile ────────────────────────────────────────────
async function getProfileContext(userId) {
  try {
    const profile = await StudentProfile.findOne({ userId });
    if (!profile) return null;
    const techSkills  = profile.skills?.technical?.join(', ') || null;
    const tools       = profile.skills?.tools?.join(', ')     || null;
    const projects    = profile.projects?.length
      ? profile.projects.slice(0, 3)
          .map(p => `"${p.title}" — ${p.description} (Stack: ${p.technologies?.join(', ') || 'N/A'})`)
          .join('\n  • ')
      : null;
    const experience  = profile.workExperience?.length
      ? profile.workExperience
          .map(w => `${w.jobTitle} at ${w.company} (${w.duration}): ${w.description}`)
          .join('\n  • ')
      : null;
    const education   = profile.education
      ? `${profile.education.degree} in ${profile.education.field} from ${profile.education.institution}`
      : null;
    const targetRoles = profile.careerPreferences?.preferredRoles?.join(', ') || null;
    const projectNames = profile.projects?.map(p => p.title).join(', ') || null;
    return { education, techSkills, tools, projects, experience, targetRoles, projectNames };
  } catch (err) {
    console.warn('[MockInterview] Profile fetch failed:', err.message);
    return null;
  }
}

function formatProfileContext(p) {
  if (!p) return '(No candidate profile — ask general role questions.)';
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

=== INTERVIEW PROTOCOL ===
1. Stay fully in character as a seasoned interviewer at all times.
2. Ask ONE concise, targeted question per turn.
3. PERSONALIZATION: Reference the candidate's actual projects and tech stack listed above.
   - Q1-Q3: Dive into specific listed projects or skills directly.
   - Q4-Q6: Probe implementation details, tradeoffs, and design decisions.
   - Q7+: Advanced scenario-based or system design questions.
4. FOLLOW-UP: 80% of questions must build directly on the candidate's last answer.
5. TONE: Professional, crisp, and demanding.
6. NEVER ASK: "Tell me about yourself", "What are your strengths/weaknesses", "Where do you see yourself in 5 years".
7. FORMAT: Plain text only. No markdown, no bullet points. Speak naturally.
8. LENGTH: Max 2-3 sentences per response.
9. CLOSING: End with exactly "Thank you for your time. The interview is now complete."`;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  POST /api/mock-interview/chat
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/chat', auth, async (req, res) => {
  try {
    if (!genAI) throw new Error('Gemini AI not configured');
    const {
      jobRole, interviewType, experienceLevel,
      conversationHistory = [], questionNumber = 0, maxQuestions = 8,
    } = req.body;

    const role  = jobRole         || 'Software Engineer';
    const type  = interviewType   || 'Technical';
    const level = experienceLevel || 'Entry-Level';

    const profile    = await getProfileContext(req.user?.id || req.userId);
    const profileCtx = formatProfileContext(profile);
    const model      = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: buildSystemInstruction(role, level, type, profileCtx),
    });

    let prompt;
    if (conversationHistory.length === 0) {
      const hasProfile = profile && (profile.projects || profile.techSkills);
      prompt = hasProfile
        ? `FIRST QUESTION. Welcome the candidate in one brief sentence, then immediately ask a sharp specific question about one of their ACTUAL listed projects or skills. Do NOT ask for a self-introduction. Example: "Welcome. I see you built [project] — walk me through the most technically challenging component." Generate now using their real background.`
        : `FIRST QUESTION. Welcome briefly, then ask a strong scenario-based ${type} question for a ${level} ${role}. Be specific and technical.`;
    } else {
      const transcript = conversationHistory
        .map(m => `${m.role === 'user' ? 'Candidate' : 'Aurelian'}: ${m.content}`)
        .join('\n\n');
      const qNum      = questionNumber || Math.ceil(conversationHistory.length / 2);
      const isLastQ   = qNum >= maxQuestions;
      const isNearEnd = qNum >= maxQuestions - 1;

      if (isLastQ) {
        prompt = `FINAL EXCHANGE.\nTRANSCRIPT:\n${transcript}\nGive one brief closing remark, then say exactly: "Thank you for your time. The interview is now complete."`;
      } else {
        prompt = `TRANSCRIPT (Q${qNum}/${maxQuestions}):\n${transcript}\n\nINSTRUCTION: Read the Candidate's last answer. Ask ONE precise follow-up probing the most interesting technical claim or gap they left open.${isNearEnd ? ' Make this question advanced — differentiate strong from weak candidates.' : ' Push on implementation details, tradeoffs, or edge cases.'} Do NOT repeat earlier themes. Do NOT ask multiple questions.\n\nYOUR NEXT QUESTION:`;
      }
    }

    const result = await model.generateContent(prompt);
    return res.json({ success: true, response: result.response.text().trim() });

  } catch (error) {
    console.error('[MockInterview] Chat Error:', error.message);
    const fallbacks = [
      "Welcome! Let's dive in — can you describe a recent project where you faced a significant technical challenge and how you resolved it?",
      "What specific design decisions did you make in that project and what tradeoffs did those involve?",
      "Walk me through how you would design a scalable REST API for a high-traffic platform from scratch.",
      "How do you ensure code quality and maintainability in a production codebase? What tools do you use?",
      "Describe a time you had to make a performance vs. maintainability tradeoff. What did you choose, and why?",
      "How would you approach debugging a race condition in a distributed system?",
      "If you could redesign one of your past projects from scratch, what architecture would you choose now and why?",
      "Thank you for your time. The interview is now complete.",
    ];
    const history = req.body.conversationHistory || [];
    const idx     = Math.min(Math.ceil(history.length / 2), fallbacks.length - 1);
    return res.json({ success: true, response: fallbacks[idx], fallback: true });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  POST /api/mock-interview/evaluate  — Rich Performance Report
// ═══════════════════════════════════════════════════════════════════════════════
router.post('/evaluate', auth, async (req, res) => {

  const clamp = (v, min = 0, max = 100) =>
    Math.min(max, Math.max(min, Math.round(Number(v) || 50)));

  const buildSyntheticEval = (history, role, type) => {
    const userMsgs  = history.filter(m => m.role === 'user');
    const avgWords  = userMsgs.reduce((s, m) => s + (m.content || '').split(/\s+/).length, 0)
                      / Math.max(userMsgs.length, 1);
    const base      = clamp(Math.round((Math.min(avgWords * 1.5, 100) + (userMsgs.length / 8) * 100) / 2));
    return {
      overallScore:        base,
      communicationScore:  clamp(base + 5),
      technicalScore:      clamp(base - 5),
      problemSolvingScore: clamp(base),
      confidenceScore:     clamp(base + 2),
      hiringVerdict:       base >= 75 ? 'Strong Hire' : base >= 60 ? 'Hire' : base >= 45 ? 'No Hire' : 'Strong No Hire',
      industryPercentile:  Math.max(10, Math.min(90, base - 5)),
      strengths: [
        'Completed the full interview session',
        'Engaged with all technical questions',
        'Maintained composure throughout',
      ],
      weaknesses: [
        'Provide more concrete implementation details',
        'Expand on technical tradeoffs in answers',
        'Include specific metrics and outcomes',
      ],
      projectInsights: [
        {
          title: 'General Project Work',
          rating: base,
          observation: 'The candidate referenced project experience in their answers.',
          suggestion: 'Be specific about your technical contributions, challenges overcome, and measurable outcomes.',
        }
      ],
      keyMoments: [
        {
          type: 'positive',
          quote: 'Candidate demonstrated engagement throughout.',
          insight: 'Consistent participation is valued by interviewers.',
        }
      ],
      skillGaps: [
        { skill: 'System Design', priority: 'High',  resource: 'Grokking the System Design Interview' },
        { skill: 'DSA',           priority: 'Medium', resource: 'LeetCode Top 150' },
        { skill: 'Communication', priority: 'Medium', resource: 'STAR Method Practice' },
      ],
      nextSteps: [
        'Practice explaining technical decisions out loud using the STAR method',
        'Review system design fundamentals — scalability, caching, load balancing',
        'Complete 2-3 mock interviews per week to build confidence',
        'Learn to quantify results: response times, user counts, performance gains',
      ],
      feedback: `You completed ${userMsgs.length} question(s) in this ${type} interview for the ${role} role. A real-time AI evaluation could not be generated — scores are estimated from your response patterns. Retake for a full AI analysis.`,
    };
  };

  try {
    const { jobRole, interviewType, experienceLevel, conversationHistory } = req.body;
    const role    = jobRole         || 'Software Engineer';
    const type    = interviewType   || 'Technical';
    const level   = experienceLevel || 'Entry-Level';
    const history = Array.isArray(conversationHistory) ? conversationHistory : [];

    const userAnswers = history.filter(m => m.role === 'user');
    if (userAnswers.length === 0) {
      return res.status(400).json({ success: false, error: 'Please answer at least one question before evaluating.' });
    }

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const transcript = history
          .map(m => `${m.role === 'user' ? 'Candidate' : 'Interviewer'}: ${m.content}`)
          .join('\n\n');

        const prompt = `You are a senior engineering manager at a FAANG company conducting post-interview evaluation.

INTERVIEW DETAILS:
- Role: ${level} ${role}
- Focus: ${type}
- Questions answered: ${userAnswers.length}

FULL TRANSCRIPT:
${transcript}

TASK: Produce a DETAILED, HONEST performance report. Return ONLY a raw JSON object — no markdown, no code fences, no prose.

Required JSON format:
{
  "overallScore": <integer 0-100>,
  "communicationScore": <integer 0-100>,
  "technicalScore": <integer 0-100>,
  "problemSolvingScore": <integer 0-100>,
  "confidenceScore": <integer 0-100>,
  "hiringVerdict": "<one of: Strong Hire | Hire | No Hire | Strong No Hire>",
  "industryPercentile": <integer 1-99, estimated percentile vs peers applying for this role>,
  "strengths": [
    "<specific strength with evidence from transcript>",
    "<second specific strength>",
    "<third specific strength>"
  ],
  "weaknesses": [
    "<specific gap with evidence from transcript>",
    "<second specific gap>",
    "<third specific gap>"
  ],
  "projectInsights": [
    {
      "title": "<project or topic they discussed>",
      "rating": <integer 0-100>,
      "observation": "<one sentence: what they showed about this project/topic>",
      "suggestion": "<one sentence: what would have made this answer stronger>"
    }
  ],
  "keyMoments": [
    {
      "type": "<positive or negative>",
      "quote": "<short direct quote or paraphrase from their answer>",
      "insight": "<one sentence explaining why this was notable>"
    },
    {
      "type": "<positive or negative>",
      "quote": "<second quote>",
      "insight": "<insight>"
    }
  ],
  "skillGaps": [
    { "skill": "<specific skill or concept they lacked>", "priority": "<High|Medium|Low>", "resource": "<specific book, course, or platform to learn it>" },
    { "skill": "<second skill>", "priority": "<High|Medium|Low>", "resource": "<resource>" },
    { "skill": "<third skill>", "priority": "<High|Medium|Low>", "resource": "<resource>" }
  ],
  "nextSteps": [
    "<actionable step 1 specific to their weaknesses>",
    "<actionable step 2>",
    "<actionable step 3>",
    "<actionable step 4>"
  ],
  "feedback": "<3-4 sentence executive summary: what stood out, critical gaps, hiring recommendation, and one key thing to work on before next interview>"
}

SCORING RUBRIC (be honest, not generous):
- overallScore: weighted average (technical 40%, communication 30%, problem-solving 20%, confidence 10%)
- communicationScore: clarity, structure, conciseness, use of examples
- technicalScore: correctness, depth, proper use of terminology
- problemSolvingScore: approach methodology, handling unknowns, edge cases
- confidenceScore: directness, authority, self-assurance in answers
All scores must be integers 0-100. Do NOT round up to make the candidate feel good.`;

        const result = await model.generateContent(prompt);
        let text = (result.response.text() || '').trim();

        // Multi-pass JSON extraction
        text = text.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
        const start = text.indexOf('{');
        const end   = text.lastIndexOf('}');
        if (start === -1 || end === -1) throw new Error('No JSON block in AI response');

        let jsonStr = text.slice(start, end + 1)
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/[\u2018\u2019]/g, "'")
          .replace(/[\u201C\u201D]/g, '"');

        const evaluation = JSON.parse(jsonStr);

        // Normalise scores
        ['overallScore','communicationScore','technicalScore','problemSolvingScore','confidenceScore']
          .forEach(k => { if (evaluation[k] !== undefined) evaluation[k] = clamp(evaluation[k]); });

        if (evaluation.industryPercentile !== undefined)
          evaluation.industryPercentile = clamp(evaluation.industryPercentile, 1, 99);

        // Fill missing arrays with defaults
        if (!Array.isArray(evaluation.strengths) || !evaluation.strengths.length)
          evaluation.strengths = buildSyntheticEval(history, role, type).strengths;
        if (!Array.isArray(evaluation.weaknesses) || !evaluation.weaknesses.length)
          evaluation.weaknesses = buildSyntheticEval(history, role, type).weaknesses;
        if (!Array.isArray(evaluation.projectInsights) || !evaluation.projectInsights.length)
          evaluation.projectInsights = buildSyntheticEval(history, role, type).projectInsights;
        if (!Array.isArray(evaluation.keyMoments) || !evaluation.keyMoments.length)
          evaluation.keyMoments = buildSyntheticEval(history, role, type).keyMoments;
        if (!Array.isArray(evaluation.skillGaps) || !evaluation.skillGaps.length)
          evaluation.skillGaps = buildSyntheticEval(history, role, type).skillGaps;
        if (!Array.isArray(evaluation.nextSteps) || !evaluation.nextSteps.length)
          evaluation.nextSteps = buildSyntheticEval(history, role, type).nextSteps;
        if (!evaluation.feedback)
          evaluation.feedback = buildSyntheticEval(history, role, type).feedback;
        if (!evaluation.hiringVerdict)
          evaluation.hiringVerdict = evaluation.overallScore >= 75 ? 'Strong Hire' : evaluation.overallScore >= 60 ? 'Hire' : 'No Hire';

        console.log('[MockInterview] Rich evaluation generated successfully.');
        return res.json({ success: true, evaluation });

      } catch (aiErr) {
        console.error('[MockInterview] AI evaluation failed, using synthetic fallback:', aiErr.message);
      }
    }

    // Synthetic fallback
    return res.json({ success: true, evaluation: buildSyntheticEval(history, role, type), synthetic: true });

  } catch (fatalErr) {
    console.error('[MockInterview] Evaluate fatal error:', fatalErr.message);
    return res.json({
      success: true,
      evaluation: {
        overallScore: 50, communicationScore: 50, technicalScore: 50,
        problemSolvingScore: 50, confidenceScore: 50,
        hiringVerdict: 'No Hire', industryPercentile: 40,
        strengths: ['Participated in the interview'],
        weaknesses: ['Evaluation unavailable — please retake'],
        projectInsights: [],
        keyMoments: [],
        skillGaps: [{ skill: 'General preparation', priority: 'High', resource: 'LeetCode, System Design Primer' }],
        nextSteps: ['Retake the interview for a full evaluation'],
        feedback: 'An error occurred while generating your evaluation. Please retake for a complete performance report.',
      },
      synthetic: true,
    });
  }
});

module.exports = router;
