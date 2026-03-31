// backend/routes/mockInterview.js
const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { auth } = require('../middleware/auth');

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
    
    // Default fallback values
    const role = jobRole || 'Software Engineer';
    const type = interviewType || 'Technical';
    const level = experienceLevel || 'Entry-Level';
    const history = conversationHistory || [];

    // The system prompt sets the strict persona
    const systemInstruction = `You are a professional and highly experienced interviewer for the role of ${level} ${role}.
    This is a ${type} interview.
    
    CRITICAL RULES:
    1. Do NOT break character. You are the interviewer.
    2. RESPOND WITH VOICE IN MIND: Keep responses concise (maximum 2-3 sentences). This is for a voice-based interview.
    3. ADAPTIVE FOLLOW-UPS: Always acknowledge the candidate's last answer and ask a direct, relevant follow-up question based on the content of their response. For example: "Interesting approach to state management in React. How would you handle prop drilling in that same scenario?"
    4. Ask exactly ONE question at a time.
    5. Do NOT answer the question for the candidate.
    6. If the candidate asks to end, say a brief concluding word and state "INTERVIEW_COMPLETE".
    7. No emojis, no markdown formatting, no "Interviewer:" prefix. Speak as if you are a real person on a call.
    
    If this is the FIRST message, welcome the candidate briefly and ask the first question (e.g., "Tell me about yourself").`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction
    });

    // Handle history conversion into a single context string to force attention
    const transcript = history.map(msg => 
        `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`
    ).join('\n\n');
    
    // Construct the active prompt with FEW-SHOT examples for precision
    let prompt = "";
    if (history.length === 0) {
      prompt = "This is the start of the interview. Represent as the interviewer and ask the first question (e.g. 'Welcome! Tell me about yourself').";
    } else {
      prompt = `
      CURRENT TRANSCRIPT:
      ${transcript}
      
      INSTRUCTION FOR THE INTERVIEWER:
      1. Carefully review the Candidate's last answer.
      2. Briefly acknowledge the specific points made in that answer.
      3. Ask exactly ONE relevant follow-up question that dives deeper into their answer. 
      4. DO NOT ask generic questions (e.g., "Tell me more about your project"). 
      5. BE SPECIFIC to the tools, technologies, or challenges they just mentioned.

      EXAMPLES OF GOOD FOLLOW-UPS:
      Candidate: "I prefer React for frontend because of its component-based architecture and hooks like useEffect."
      Interviewer: "I see you value the hooks system. How would you handle a race condition within a useEffect call that fetches data?"

      Candidate: "I used Python for the backend scraping because of BeautifulSoup's ease of use."
      Interviewer: "Good choice with BeautifulSoup. How did you handle sites that rely heavily on JavaScript for content rendering?"

      YOUR RESPONSE (Speak directly as the interviewer):
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
