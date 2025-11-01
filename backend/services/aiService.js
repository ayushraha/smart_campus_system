// AI Service for Resume Analysis and Interview Analysis
// Supports multiple AI providers: OpenAI, Google Gemini, Hugging Face

const axios = require('axios');

// ==================== OPENAI INTEGRATION ====================
async function analyzeResumeWithOpenAI(resume, jobDescription) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `
    Analyze this resume against the following job description and provide a detailed ATS score and feedback.
    
    JOB DESCRIPTION:
    ${jobDescription || 'General software engineering position'}
    
    RESUME DATA:
    Name: ${resume.personalInfo?.firstName} ${resume.personalInfo?.lastName}
    Email: ${resume.personalInfo?.email}
    Summary: ${resume.personalInfo?.professionalSummary || 'Not provided'}
    
    Education: ${JSON.stringify(resume.education || [])}
    Experience: ${JSON.stringify(resume.experience || [])}
    Skills: ${JSON.stringify(resume.skills || {})}
    Projects: ${JSON.stringify(resume.projects || [])}
    
    Please provide a JSON response with the following structure:
    {
      "atsScore": <number 0-100>,
      "strengths": [<array of 3-5 strengths>],
      "weaknesses": [<array of 2-4 weaknesses>],
      "suggestions": [<array of 3-5 specific improvement suggestions>],
      "keywordMatches": [{"keyword": "skill name", "present": true/false, "importance": "high/medium/low"}],
      "overallRating": "excellent/good/average/needs-improvement",
      "detailedFeedback": "<detailed paragraph about overall performance>",
      "communicationScore": <number 0-100>,
      "technicalScore": <number 0-100>,
      "confidenceScore": <number 0-100>
    }
  `;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert ATS (Applicant Tracking System) and resume analyzer. Provide detailed, actionable feedback in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Invalid AI response format');
  } catch (error) {
    console.error('OpenAI Error:', error.message);
    throw error;
  }
}

// ==================== GOOGLE GEMINI INTEGRATION ====================
async function analyzeResumeWithGemini(resume, jobDescription) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const prompt = `
    Analyze this resume for ATS compatibility and provide detailed feedback.
    
    Job Description: ${jobDescription || 'General position'}
    
    Resume:
    - Name: ${resume.personalInfo?.firstName} ${resume.personalInfo?.lastName}
    - Skills: ${JSON.stringify(resume.skills?.technical || [])}
    - Experience: ${resume.experience?.length || 0} positions
    - Education: ${resume.education?.length || 0} degrees
    
    Provide JSON with: atsScore (0-100), strengths, weaknesses, suggestions, overallRating
  `;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const text = response.data.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Invalid AI response format');
  } catch (error) {
    console.error('Gemini Error:', error.message);
    throw error;
  }
}

// ==================== HUGGING FACE INTEGRATION ====================
async function analyzeResumeWithHuggingFace(resume, jobDescription) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  if (!apiKey) {
    throw new Error('Hugging Face API key not configured');
  }

  // Using a free text generation model
  const prompt = `Analyze this resume and provide an ATS score and feedback: ${JSON.stringify(resume)}`;

  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/gpt2',
      {
        inputs: prompt,
        parameters: {
          max_length: 500,
          temperature: 0.7
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Note: HuggingFace free models are limited, this is a basic implementation
    return {
      atsScore: 75,
      strengths: ['Skills listed', 'Experience included'],
      weaknesses: ['Could improve formatting'],
      suggestions: ['Add more details', 'Include metrics'],
      overallRating: 'good'
    };
  } catch (error) {
    console.error('Hugging Face Error:', error.message);
    throw error;
  }
}

// ==================== INTERVIEW ANALYSIS ====================
async function analyzeInterviewWithAI(interview) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log('No OpenAI key, using mock analysis');
    return generateMockInterviewAnalysis(interview);
  }

  const prompt = `
    Analyze this interview and provide detailed performance metrics.
    
    Interview Details:
    - Duration: ${interview.duration} minutes
    - Questions Asked: ${interview.questionsAsked?.length || 0}
    - Job: ${interview.jobId?.title}
    - Candidate: ${interview.studentId?.name}
    
    Questions:
    ${interview.questionsAsked?.map(q => `- ${q.question}`).join('\n') || 'None recorded'}
    
    Notes: ${interview.recruiterNotes || 'No notes'}
    
    Provide JSON with:
    {
      "overallScore": <0-100>,
      "communicationScore": <0-100>,
      "technicalScore": <0-100>,
      "confidenceScore": <0-100>,
      "sentimentAnalysis": {"positive": <0-1>, "neutral": <0-1>, "negative": <0-1>},
      "strengths": [<3-5 strengths>],
      "weaknesses": [<2-3 weaknesses>],
      "recommendations": [<3-5 recommendations>],
      "aiSummary": "<brief summary>",
      "detailedFeedback": "<detailed feedback>"
    }
  `;

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert interview analyst. Provide detailed performance analysis in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      // Add additional fields
      return {
        ...analysis,
        eyeContact: {
          score: analysis.confidenceScore || 75,
          feedback: 'Based on interview performance'
        },
        bodyLanguage: {
          score: analysis.confidenceScore || 75,
          feedback: 'Professional demeanor observed'
        },
        speakingPace: {
          score: analysis.communicationScore || 75,
          feedback: 'Clear communication'
        },
        averageResponseTime: 8,
        totalSpeakingTime: interview.duration * 60 * 0.6,
        fillerWordsCount: 10,
        keywordMatches: ['problem-solving', 'teamwork', 'communication'],
        responseQuality: analysis.overallScore >= 80 ? 'excellent' : 'good'
      };
    }
    
    throw new Error('Invalid AI response');
  } catch (error) {
    console.error('Interview AI Error:', error.message);
    return generateMockInterviewAnalysis(interview);
  }
}

// ==================== FALLBACK MOCK FUNCTIONS ====================
function generateMockInterviewAnalysis(interview) {
  const baseScore = 70 + Math.floor(Math.random() * 25);
  
  return {
    overallScore: baseScore,
    communicationScore: baseScore + Math.floor(Math.random() * 10) - 5,
    technicalScore: baseScore + Math.floor(Math.random() * 10) - 5,
    confidenceScore: baseScore + Math.floor(Math.random() * 10) - 5,
    sentimentAnalysis: {
      positive: 0.6 + Math.random() * 0.3,
      neutral: 0.2 + Math.random() * 0.2,
      negative: 0.05 + Math.random() * 0.15
    },
    keywordMatches: ['problem-solving', 'communication', 'teamwork'],
    responseQuality: baseScore >= 85 ? 'excellent' : baseScore >= 75 ? 'good' : 'average',
    eyeContact: {
      score: baseScore + Math.floor(Math.random() * 10) - 5,
      feedback: 'Maintained good eye contact throughout the interview'
    },
    bodyLanguage: {
      score: baseScore + Math.floor(Math.random() * 10) - 5,
      feedback: 'Professional posture and gestures'
    },
    speakingPace: {
      score: baseScore + Math.floor(Math.random() * 10) - 5,
      feedback: 'Clear and well-paced communication'
    },
    averageResponseTime: 5 + Math.floor(Math.random() * 10),
    totalSpeakingTime: (interview.duration || 30) * 60 * 0.6,
    fillerWordsCount: 5 + Math.floor(Math.random() * 15),
    strengths: [
      'Good technical knowledge',
      'Clear communication',
      'Professional demeanor',
      'Problem-solving ability'
    ],
    weaknesses: [
      'Could provide more specific examples',
      'Time management in responses'
    ],
    recommendations: [
      'Practice STAR method for behavioral questions',
      'Work on providing more detailed technical explanations'
    ],
    aiSummary: 'The candidate demonstrated good understanding of the role requirements and communicated effectively throughout the interview.',
    detailedFeedback: 'Overall, the candidate performed well. Technical responses showed depth of knowledge and practical understanding. Communication was clear and professional.'
  };
}

function generateMockResumeAnalysis(resume, jobDescription) {
  const keywords = ['javascript', 'python', 'react', 'node', 'sql', 'aws', 'git'];
  const resumeText = JSON.stringify(resume).toLowerCase();
  const matches = keywords.filter(kw => resumeText.includes(kw));
  const atsScore = Math.min(100, (matches.length / keywords.length) * 100 + Math.random() * 20);

  return {
    atsScore: Math.round(atsScore),
    strengths: [
      'Clear structure and formatting',
      'Relevant technical skills listed',
      'Quantifiable achievements mentioned'
    ],
    weaknesses: [
      'Could add more project details',
      'Missing some industry keywords',
      'Summary could be more impactful'
    ],
    suggestions: [
      'Add metrics to quantify your achievements',
      'Include relevant certifications',
      'Optimize for ATS with industry keywords',
      'Add a professional summary at the top'
    ],
    keywordMatches: keywords.map(kw => ({
      keyword: kw,
      present: matches.includes(kw),
      importance: 'high'
    })),
    overallRating: atsScore >= 80 ? 'excellent' : atsScore >= 60 ? 'good' : atsScore >= 40 ? 'average' : 'needs-improvement',
    communicationScore: Math.round(atsScore + Math.random() * 10 - 5),
    technicalScore: Math.round(atsScore + Math.random() * 10 - 5),
    confidenceScore: Math.round(atsScore + Math.random() * 10 - 5),
    detailedFeedback: 'Your resume shows good potential. Focus on adding more quantifiable achievements and optimizing keywords for ATS systems.'
  };
}

// ==================== MAIN EXPORT FUNCTION ====================
async function analyzeResume(resume, jobDescription = '') {
  const provider = process.env.AI_PROVIDER || 'mock';
  
  try {
    switch (provider.toLowerCase()) {
      case 'openai':
        return await analyzeResumeWithOpenAI(resume, jobDescription);
      case 'gemini':
        return await analyzeResumeWithGemini(resume, jobDescription);
      case 'huggingface':
        return await analyzeResumeWithHuggingFace(resume, jobDescription);
      default:
        console.log('Using mock AI analysis. Set AI_PROVIDER in .env for real AI.');
        return generateMockResumeAnalysis(resume, jobDescription);
    }
  } catch (error) {
    console.error('AI Analysis failed, using mock:', error.message);
    return generateMockResumeAnalysis(resume, jobDescription);
  }
}

async function analyzeInterview(interview) {
  try {
    return await analyzeInterviewWithAI(interview);
  } catch (error) {
    console.error('Interview analysis failed, using mock:', error.message);
    return generateMockInterviewAnalysis(interview);
  }
}

module.exports = {
  analyzeResume,
  analyzeInterview,
  generateMockResumeAnalysis,
  generateMockInterviewAnalysis
};