// backend/services/aiResumeParserService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

class ResumeParserService {
  async parseResume(resumeFilePath, resumeText) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `You are an expert HR professional and resume analyst. Analyze the following resume/CV and provide a comprehensive AI-powered parsing report.

Resume Content:
${resumeText}

Please provide a detailed JSON report with the following structure:
{
  "personalInfo": {
    "name": "extracted name",
    "email": "extracted email",
    "phone": "extracted phone",
    "location": "extracted location",
    "summary": "brief professional summary if available"
  },
  "skills": {
    "technical": ["skill1", "skill2", "skill3"],
    "soft": ["skill1", "skill2"],
    "languages": ["language1", "language2"],
    "tools": ["tool1", "tool2"]
  },
  "experience": [
    {
      "jobTitle": "title",
      "company": "company name",
      "duration": "start - end",
      "description": "key responsibilities and achievements",
      "skills_used": ["skill1", "skill2"]
    }
  ],
  "education": [
    {
      "degree": "degree name",
      "institution": "university/school name",
      "field": "field of study",
      "graduationYear": "year",
      "grade": "gpa or percentage if available"
    }
  ],
  "certifications": [
    {
      "name": "certification name",
      "issuer": "issuer",
      "date": "date",
      "credentialId": "credential ID if available"
    }
  ],
  "projects": [
    {
      "title": "project title",
      "description": "project description",
      "technologies": ["tech1", "tech2"],
      "link": "link if available"
    }
  ],
  "analysis": {
    "strengths": ["strength1", "strength2", "strength3"],
    "weaknesses": ["area1", "area2"],
    "suggestions": ["suggestion1", "suggestion2", "suggestion3"],
    "careerPath": "recommended career path based on profile",
    "industryFit": "best fitting industries",
    "experienceLevel": "junior/mid-level/senior",
    "overall_score": 85
  },
  "keywords": {
    "ats_friendly_keywords": ["keyword1", "keyword2"],
    "missing_keywords": ["keyword1", "keyword2"],
    "ats_score": 78
  }
}

Provide ONLY valid JSON response, no markdown or extra text.`;

      const response = await model.generateContent(prompt);
      const parsedResponse = response.response.text();

      // Extract JSON from response
      const jsonMatch = parsedResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Could not extract JSON from AI response");
      }

      const parsedData = JSON.parse(jsonMatch[0]);

      return {
        success: true,
        data: parsedData,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Resume parsing error:", error);
      throw new Error(`Resume parsing failed: ${error.message}`);
    }
  }

  async generateRecommendations(parsedResumeData) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `Based on this parsed resume data, provide personalized recommendations for improving the resume and career development:

${JSON.stringify(parsedResumeData, null, 2)}

Provide recommendations in this JSON format:
{
  "resumeImprovements": [
    {
      "section": "section name",
      "currentIssue": "current issue",
      "recommendation": "specific recommendation",
      "priority": "high/medium/low",
      "example": "example of improved content"
    }
  ],
  "skillGaps": [
    {
      "skill": "skill name",
      "importance": "high/medium/low",
      "learningPath": "recommended learning path",
      "estimatedTime": "estimated time to learn"
    }
  ],
  "certifications": [
    {
      "name": "certification name",
      "provider": "provider",
      "benefit": "why this certification would help",
      "link": "resource link if available"
    }
  ],
  "jobTargets": [
    {
      "jobTitle": "job title",
      "matchScore": 85,
      "why": "why this person is suited",
      "preparation": "how to prepare for this role"
    }
  ]
}

Provide ONLY valid JSON response.`;

      const response = await model.generateContent(prompt);
      const recommendationsText = response.response.text();

      const jsonMatch = recommendationsText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Could not extract recommendations JSON");
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Recommendations generation error:", error);
      throw new Error(`Failed to generate recommendations: ${error.message}`);
    }
  }

  async compareWithJobDescription(resumeData, jobDescription) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `Compare this resume profile with the job description and provide a match analysis:

Resume Profile:
${JSON.stringify(resumeData, null, 2)}

Job Description:
${jobDescription}

Provide analysis in this JSON format:
{
  "overallMatchScore": 85,
  "matchBreakdown": {
    "skillsMatch": {
      "score": 80,
      "matchedSkills": ["skill1", "skill2"],
      "missingSkills": ["skill1", "skill2"]
    },
    "experienceMatch": {
      "score": 85,
      "analysis": "detailed analysis"
    },
    "educationMatch": {
      "score": 90,
      "analysis": "detailed analysis"
    }
  },
  "readiness": "ready/good_fit/needs_preparation",
  "recommendations": [
    "recommendation 1",
    "recommendation 2"
  ]
}

Provide ONLY valid JSON response.`;

      const response = await model.generateContent(prompt);
      const matchText = response.response.text();

      const jsonMatch = matchText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Could not extract match JSON");
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error("Job match comparison error:", error);
      throw new Error(`Failed to compare with job: ${error.message}`);
    }
  }
}

module.exports = new ResumeParserService();