// backend/routes/mockInterview.js
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { auth } = require('../middleware/auth');
const StudentProfile = require('../models/StudentProfile');

// Initialize Gemini
const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
let genAI = null;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

// POST /api/mock-interview/chat
router.post('/chat', auth, async (req, res) => {
  try {
    if (!genAI) {
      throw new Error('Gemini AI not configured');
    }
    const { jobRole, interviewType, experienceLevel, conversationHistory } = req.body;
    
    // Fetch Student Profile for dynamic context
    let profileContext = "No specific candidate background available.";
    try {
      const profile = await StudentProfile.findOne({ userId: req.user.id });
      if (profile) {
        const skills = profile.skills?.technical?.join(', ') || 'None listed';
        const projects = profile.projects?.map(p => `${p.title}: ${p.description}`).join('; ') || 'None listed';
        const exp = profile.workExperience?.map(w => `${w.jobTitle} at ${w.company}`).join('; ') || 'None listed';
        
        profileContext = `
        CANDIDATE PROFILE DETAILS:
        - Technical Skills: ${skills}
        - Projects: ${projects}
        - Work Experience: ${exp}
        `;
      }
    } catch (err) {
      console.warn("Failed to fetch student profile for AI context:", err);
    }

    // Default fallback values
    const role = jobRole || 'Software Engineer';
    const type = interviewType || 'Technical';
    const level = experienceLevel || 'Entry-Level';
    const history = conversationHistory || [];

    // The system prompt sets the strict persona
    const systemInstruction = `You are a professional and highly experienced executive interviewer for the role of ${level} ${role}.
    This is a ${type} interview.

    YOUR KNOWLEDGE BASE:
    ${profileContext}
    
    CRITICAL RULES:
    1. Do NOT break character. You are the interviewer.
    2. RESPOND WITH VOICE IN MIND: Keep responses concise (maximum 2-3 sentences).
    3. ADAPTIVE PERSONA: 
       - In the FIRST 2 questions, try to reference a specific project or skill from the candidate's profile listed above.
       - NEVER ask "Standard" HR questions (e.g. "Where do you see yourself in 5 years?"). 
       - Ask exactly ONE question at a time.
    4. DYNAMIC FOLLOW-UPS:
       - 90% of your questions must be based directly on the candidate's last answer.
       - If they mention a tool, ask about a specific challenge or feature of that tool.
       - STOP if the candidate answers "INTERVIEW_COMPLETE".
    5. No emojis, no markdown, no prefixes like "Interviewer:".`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      systemInstruction: systemInstruction
    });

    // Handle history conversion into a single context string to force attention
    const transcript = history.map(msg => 
        `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`
    ).join('\n\n');
    
    // Construct the active prompt
    let prompt = "";
    if (history.length === 0) {
      prompt = "This is the start of the interview. Based on the profile context, welcome the candidate and ask a specific opening question related to their role or projects.";
    } else {
      prompt = `
      CURRENT TRANSCRIPT:
      ${transcript}
      
      INSTRUCTION FOR THE INTERVIEWER:
      1. Carefully review the Candidate's last answer.
      2. Acknowledge what they said (e.g. "Interesting use of X" or "I see how you handled Y").
      3. Ask exactly ONE deep-dive follow-up question. 
      4. DO NOT REPEAT a question pattern you used previously in this transcript.
      5. If the answer was vague, ask for specific metrics or implementation details.

      YOUR RESPONSE:
      `;
    }

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return res.json({ success: true, response: responseText });

  } catch (error) {
    console.error('Mock Interview Error:', error);
    
    // FALLBACK: Return a mock response if AI fails (prevents 500)
    const mockResponses = [
      "Welcome! I am your AI interviewer. To get started, please tell me about your background.",
      "That sounds interesting. Can you elaborate on the technical challenges you faced in your last project?",
      "Good. How do you handle working in a team with conflicting opinions?",
      "Can you explain the difference between a process and a thread in simple terms?",
      "Thank you for your time. The interview is now complete. I will analyze your responses."
    ];
    
    // Just a basic loop for the mock
    const history = req.body.conversationHistory || [];
    const index = Math.min(history.length, mockResponses.length - 1);
    
    return res.json({ 
      success: true, 
      response: mockResponses[index],
      error: 'Falling back to mock mode (AI engine temporarily unavailable).'
    });
  }
});

// POST /api/mock-interview/evaluate
router.post('/evaluate', auth, async (req, res) => {
  if (!genAI) {
    return res.status(500).json({ success: false, error: 'Gemini AI not configured.' });
  }

  try {
    const { jobRole, interviewType, experienceLevel, conversationHistory } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Format transcript
    const transcript = conversationHistory.map(msg => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`).join('\n\n');

    const evaluationPrompt = `You are an expert technical recruiter and hiring manager. 
    Review the following interview transcript for the role of ${experienceLevel} ${jobRole} (${interviewType} focus).
    
    TRANSCRIPT:
    ${transcript}
    
    Evaluate the candidate's performance. Return a valid JSON object strictly formatted as follows, with no markdown code blocks:
    {
      "overallScore": 85,
      "communicationScore": 80,
      "technicalScore": 90,
      "strengths": ["List of 3 strong points"],
      "weaknesses": ["List of 3 areas for improvement"],
      "feedback": "A comprehensive paragraph summarizing the candidate's performance and likelihood of hire."
    }`;

    const result = await model.generateContent(evaluationPrompt);
    let responseText = result.response.text();

    console.log("Evaluating...", responseText);

    // Clean JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
       throw new Error("Invalid format from AI");
    }

    const evaluation = JSON.parse(jsonMatch[0]);
    return res.json({ success: true, evaluation });

  } catch (error) {
    console.error('Evaluation Error:', error);
    res.status(500).json({ success: false, error: 'Failed to evaluate interview.' });
  }
});

module.exports = router;
