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
    const systemInstruction = `You are a strict, professional, and highly experienced interviewer for the role of ${level} ${role}.
    This is a ${type} interview.
    
    CRITICAL RULES:
    1. Do NOT break character under any circumstances.
    2. Respond with ONLY what an interviewer would say (no stage directions, no markdown formatting unless appropriate, no emojis).
    3. Ask exactly ONE question at a time.
    4. Wait for the candidate's response. Do NOT answer the question for the candidate.
    5. If the candidate gives a poor or incomplete answer, ask a follow-up probe or point out the flaw gently but firmly.
    6. If the candidate asks you to end the interview, provide a concluding remark and state "INTERVIEW_COMPLETE".
    7. Keep your responses concise, realistic, and focused.
    
    If this is the FIRST message (i.e. conversation history is empty), introduce yourself briefly, welcome the candidate, and ask the first question (e.g. "Tell me about yourself").
    Do not output "Interviewer:" prefix. Just speak the words natively.`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction
    });

    // Handle history conversion
    let geminiHistory = [];
    if (history.length > 0) {
        geminiHistory = history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));
    }

    // Nudge/Prompt logic
    let prompt = "Proceed with the interview.";
    if (history.length === 0) {
      prompt = "This is the start of the interview. Please welcome the candidate and ask the first question.";
    } else {
      const lastMessage = history[history.length - 1];
      if (lastMessage && lastMessage.role === 'user') {
          prompt = lastMessage.content;
          // Pop it from history to send it actively via sendMessage
          geminiHistory.pop();
      }
    }

    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(prompt);
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
