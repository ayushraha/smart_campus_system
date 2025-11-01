// ============================================
// backend/services/aiChatService.js
// ✅ OPTIMIZED FOR GEMINI 2.5 FLASH
// ============================================

const axios = require('axios');
require('dotenv').config();

class AIChatService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'gemini';
    this.apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!this.apiKey) {
      console.warn('⚠️  No API key found. Using mock mode.');
      this.provider = 'mock';
    }

    // ✅ GEMINI 2.5 FLASH - LATEST MODEL
    this.geminiModels = {
      'gemini-2.5-flash': 'gemini-2.5-flash',
      'gemini-1.5-flash': 'gemini-1.5-flash-latest',
      'gemini-1.5-pro': 'gemini-1.5-pro-latest',
      'gemini-pro': 'gemini-pro'
    };

    // ✅ USE GEMINI 2.5 FLASH BY DEFAULT
    this.defaultModel = this.geminiModels['gemini-2.5-flash'];
    
    console.log(`🤖 Gemini Model: ${this.defaultModel}`);
  }

  // ===================================
  // MAIN AI HANDLER
  // ===================================
  async generateResponse(userMessage, context = {}) {
    try {
      if (!userMessage || userMessage.trim().length === 0) {
        throw new Error('Message cannot be empty');
      }

      console.log(`🤖 AI Provider in use: ${this.provider}`);
      console.log(`   Model: ${this.defaultModel}`);

      if (this.provider === 'openai') return await this.callOpenAI(userMessage, context);
      if (this.provider === 'gemini') return await this.callGemini(userMessage, context);
      
      return await this.mockAIResponse(userMessage, context);
    } catch (error) {
      console.error('❌ AI Service Error:', error.message);
      throw new Error('AI Service Error: ' + error.message);
    }
  }

  // ===================================
  // OPENAI API CALL
  // ===================================
  async callOpenAI(userMessage, context) {
    const systemPrompt = `You are an AI Career Assistant helping students with interview prep, resume analysis, and career advice. 
Be friendly, specific, and structured.`;

    try {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY not configured');
      }

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature: 0.7,
          max_tokens: 400
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data.choices?.[0]?.message?.content || 'No response from OpenAI';
    } catch (error) {
      console.error('❌ OpenAI API Error:', error.response?.data || error.message);
      throw new Error('Failed to get response from OpenAI: ' + error.message);
    }
  }

  // ===================================
  // ✅ GEMINI 2.5 FLASH API CALL
  // ===================================
  async callGemini(userMessage, context) {
    try {
      console.log('🔗 Sending request to Gemini API...');

      if (!this.apiKey) {
        throw new Error('Missing GEMINI_API_KEY in .env');
      }

      // ✅ USE GEMINI 2.5 FLASH
      const model = this.defaultModel;
      console.log(`   Using model: ${model}`);

      // ✅ CORRECT ENDPOINT FOR GEMINI 2.5 FLASH
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
      
      console.log(`   Endpoint: ${url.split('?')[0]}...`);

      const prompt = `You are an AI Career Assistant for students.

Context:
- Topic: ${context.topic || 'general'}
- Student ID: ${context.studentId || 'unknown'}

User Message: ${userMessage}

Instructions:
- Respond clearly and concisely
- Be helpful and professional
- Keep response under 500 words
- Use formatting when helpful (bullet points, etc.)
- Be specific and actionable`;

      // ✅ OPTIMIZED PAYLOAD FOR GEMINI 2.5 FLASH
      const payload = {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,  // 2.5 Flash supports more tokens
          topP: 0.95,
          topK: 40
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      };

      console.log('   Sending request to Gemini 2.5 Flash...');

      const response = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });

      console.log('✅ Gemini 2.5 Flash response received successfully');

      // ✅ EXTRACT TEXT FROM RESPONSE
      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        console.error('❌ Invalid response structure:', JSON.stringify(response.data));
        throw new Error('No valid response text from Gemini 2.5 Flash');
      }

      console.log(`   Response length: ${text.length} characters`);
      return text;

    } catch (error) {
      console.error('❌ Gemini 2.5 Flash Error:', error.message);
      console.error('   Response status:', error.response?.status);
      console.error('   Response data:', error.response?.data);

      // ✅ SPECIFIC ERROR MESSAGES
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Invalid GEMINI_API_KEY - check Google Cloud Console');
      }
      if (error.response?.status === 404) {
        const model = this.defaultModel;
        throw new Error(`Model not found: ${model} - this model may not be available in your region. Try gemini-1.5-flash-latest instead.`);
      }
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded - you have made too many requests. Try again in 1 minute.');
      }
      if (error.response?.status === 400) {
        const detail = error.response.data?.error?.message || 'Invalid request format';
        throw new Error(`Bad request: ${detail}`);
      }
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timeout - Gemini API is slow or unreachable');
      }
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot reach Gemini API - check internet connection');
      }

      throw new Error('Failed to get response from Gemini 2.5 Flash: ' + error.message);
    }
  }

  // ===================================
  // FALLBACK / MOCK AI
  // ===================================
  async mockAIResponse(userMessage, context = {}) {
    console.log('⚙️ Mock mode active (fallback AI)');
    
    const lower = userMessage.toLowerCase();
    
    if (lower.includes('interview')) {
      return `📝 Interview Prep Tip: Prepare STAR-based answers (Situation, Task, Action, Result). Review core concepts for ${context.topic || 'your role'}. Practice common questions. Use the STAR method to structure your responses clearly.`;
    }
    if (lower.includes('resume')) {
      return `📄 Resume Advice: Keep your resume concise (1-2 pages), results-oriented, and tailored to job descriptions. Highlight achievements with numbers and metrics, not just responsibilities. Use action verbs and quantify your impact.`;
    }
    if (lower.includes('job')) {
      return `💼 Job Matching: Target roles that match your skills and experience. Tailor your resume for each position using keywords from job descriptions. Research the company and role before applying.`;
    }
    if (lower.includes('skill')) {
      return `🎯 Skill Development: Focus on in-demand skills. Take online courses, build projects, and get certifications relevant to your career goals. Practice consistently and build a portfolio.`;
    }
    
    return `👋 Hello! I'm your AI Career Assistant. I can help you with:
- 📝 Interview preparation and practice
- 📄 Resume analysis and improvement
- 💼 Job matching and career advice
- 🎯 Career guidance and skill development
- 🚀 Professional development tips

What would you like help with today?`;
  }

  // ===================================
  // INTERVIEW QUESTIONS GENERATOR
  // ===================================
  async generateInterviewQuestions(jobTitle, skills) {
    if (!jobTitle || !skills || skills.length === 0) {
      throw new Error('Job title and skills are required');
    }

    const prompt = `Generate 5 detailed interview questions for a ${jobTitle} position. 
Focus on these skills: ${skills.join(', ')}. 

For each question:
1. Include both technical and behavioral questions
2. Provide brief answer hints
3. Explain why this question is asked
4. Make questions specific to the role

Format as numbered list with clear separation.`;
    
    return await this.generateResponse(prompt, { topic: 'interview' });
  }

  // ===================================
  // RESUME ANALYZER
  // ===================================
  async analyzeResumeContent(resumeText) {
    if (!resumeText || resumeText.trim().length === 0) {
      throw new Error('Resume text is required');
    }

    const prompt = `Analyze this resume and provide detailed feedback:

Resume:
${resumeText}

Please provide:
1. **Key Strengths** (3-4 specific strengths with examples)
2. **Areas for Improvement** (3-4 specific weaknesses with solutions)
3. **Specific Enhancement Suggestions** (concrete changes to make)
4. **Overall Assessment** (1-2 sentences summary)
5. **Action Items** (prioritized list of changes)

Be specific and actionable. Reference actual content from the resume.`;
    
    return await this.generateResponse(prompt, { topic: 'resume' });
  }

  // ===================================
  // JOB MATCHING ADVISOR
  // ===================================
  async getJobMatchingAdvice(userProfile, jobDescription) {
    if (!userProfile || !jobDescription) {
      throw new Error('User profile and job description are required');
    }

    const prompt = `Compare this student profile with the job description and provide matching analysis.

Student Profile:
${JSON.stringify(userProfile, null, 2)}

Job Description:
${jobDescription}

Provide:
1. **Match Score** (0-10 with explanation)
2. **Matching Points** (3-4 areas where student matches the role)
3. **Skill Gaps** (2-3 skills student needs to develop)
4. **Improvement Recommendations** (specific steps to improve fit)
5. **Overall Recommendation** (should student apply?)

Be honest but constructive.`;
    
    return await this.generateResponse(prompt, { topic: 'job-matching' });
  }

  // ===================================
  // CUSTOM ADVICE GENERATOR
  // ===================================
  async getCustomAdvice(topic, details) {
    if (!topic || !details) {
      throw new Error('Topic and details are required');
    }

    const prompt = `Provide detailed career advice on: ${topic}

Details: ${details}

Be specific, actionable, and professional.`;
    
    return await this.generateResponse(prompt, { topic });
  }
}

module.exports = new AIChatService();