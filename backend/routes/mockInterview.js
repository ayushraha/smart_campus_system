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
      const profile = await StudentProfile.findOne({ userId: req.user.id || req.userId });
      if (profile) {
        const techSkills = profile.skills?.technical?.join(', ') || 'None listed';
        const softSkills = profile.skills?.soft?.join(', ') || 'None listed';
        const tools = profile.skills?.tools?.join(', ') || 'None listed';
        const projects = profile.projects?.map(p => `${p.title}: ${p.description} (Tech: ${p.technologies?.join(', ')})`).join('; ') || 'None listed';
        const exp = profile.workExperience?.map(w => `${w.jobTitle} at ${w.company} (${w.duration}): ${w.description}`).join('; ') || 'None listed';
        const edu = profile.education ? `${profile.education.degree} in ${profile.education.field} from ${profile.education.institution}` : 'None listed';
        const career = profile.careerPreferences?.preferredRoles?.join(', ') || 'None listed';
        
        profileContext = `
        CANDIDATE BACKGROUND:
        - Education: ${edu}
        - Technical Skills: ${techSkills}
        - Tools & Technologies: ${tools}
        - Projects: ${projects}
        - Experience: ${exp}
        - Targeted Roles: ${career}
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
    
    CANDIDATE CONTEXT (IMPORTANT):
    ${profileContext}
    
    CONVERSATIONAL STRATEGY:
    - **Persona**: Authoritative yet professional. Use industry terminology relevant to ${role}.
    - **Opening**: Reference a specific project or skill from the background above in your first 2 questions.
    - **Deep Dive**: 90% of your questions must be based on the candidate's LATEST response. Do not follow a static list.
    - **Voice UI Optimization**: Keep responses extremely concise (max 2 sentences). No markdown or formatting.
    - **Strict Rule**: Ask exactly ONE question at a time. 
    - **BLOCKED QUESTIONS**: Never ask "Tell me about yourself", "What are your strengths?", or "Where do you see yourself in 5 years?". These are HR clichés.
    - **Completion**: If the candidate provides a final conclusion or says INTERVIEW_COMPLETE, end the session smoothly.`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: systemInstruction
    });

    // Handle history conversion into a single context string to force attention
    const transcript = history.map(msg => 
        `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`
    ).join('\n\n');
    
    // Construct the active prompt
    let prompt = "";
    if (history.length === 0) {
      prompt = `This is the session start. 
                TIMESTAMP: ${Date.now()}
                - Role: ${role}
                - Background: ${profileContext}
                
                ACTION: Welcome the candidate briefly and jump IMMEDIATELY into a deep technical question about a specific project or skill from their background. 
                If background is empty, ask a complex scenario-based question relevant to ${role}. 
                DO NOT ask for an introduction.`;
    } else {
      prompt = `
      CURRENT TRANSCRIPT:
      ${transcript}
      
      INSTRUCTION FOR THE INTERVIEWER:
      1. Carefully analyze the Candidate's last answer.
      2. Acknowledge the core technical or behavioral point they made.
      3. Ask ONE follow-up question that pushes them to explain implementation details, trade-offs, or specific results.
      4. CRITICAL: Do NOT reuse the same wording or question structure as seen in the transcript history.
      5. STAY IMMERSIVE. Never mention that you are an AI or using a transcript.

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
