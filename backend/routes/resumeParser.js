// backend/routes/resumeParser.js - REAL GEMINI AI PARSING
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// Initialize Gemini AI
let genAI = null;
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Try both environment variable names
const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("❌ Gemini API key not found!");
  console.error("   Add GEMINI_API_KEY or GOOGLE_GEMINI_API_KEY to .env");
} else {
  try {
    genAI = new GoogleGenerativeAI(apiKey);
    console.log("✅ Gemini AI initialized successfully");
    console.log(`   Using API key: ${apiKey.substring(0, 20)}...`);
  } catch (err) {
    console.error("❌ Failed to initialize Gemini AI:", err.message);
  }
}

let pdfParse = null;
try {
  const pdfParseModule = require("pdf-parse");
  pdfParse = pdfParseModule.default || pdfParseModule;
  console.log("✅ pdf-parse loaded successfully");
} catch (err) {
  console.warn("⚠️  pdf-parse module not available:", err.message);
  console.warn("   Install with: npm install pdf-parse");
}

// Create uploads directory
const uploadsDir = path.join(__dirname, "../uploads/resumes");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Simple auth middleware
const authMiddleware = (req, res, next) => {
  try {
    req.user = { id: "test-user-123", role: "student" };
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: "Auth failed" });
  }
};

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain"
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Extract text from file
const extractTextFromFile = async (filePath, mimeType) => {
  try {
    // For PDF files
    if (mimeType === "application/pdf") {
      if (pdfParse) {
        console.log("📄 Parsing PDF with pdf-parse...");
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        
        if (!data.text || data.text.trim().length === 0) {
          console.warn("⚠️  PDF contains no extractable text (possibly scanned/image)");
          throw new Error("PDF appears to be a scanned image or corrupted");
        }
        
        console.log(`✅ Extracted ${data.text.length} characters from PDF`);
        return data.text;
      } else {
        console.warn("⚠️  pdf-parse not available, reading as text...");
        const text = fs.readFileSync(filePath, "utf-8", { encoding: 'latin1' });
        if (!text || text.trim().length === 0) {
          throw new Error("Cannot extract text from PDF");
        }
        return text;
      }
    }
    
    // For text files
    if (mimeType === "text/plain") {
      console.log("📄 Reading text file...");
      const text = fs.readFileSync(filePath, "utf-8");
      if (!text || text.trim().length === 0) {
        throw new Error("Text file is empty");
      }
      return text;
    }
    
    // For DOC/DOCX files - try to read as text
    if (mimeType.includes("word") || mimeType.includes("document")) {
      console.log("📄 Reading document file...");
      const text = fs.readFileSync(filePath, "utf-8");
      if (!text || text.trim().length === 0) {
        throw new Error("Cannot extract text from document");
      }
      return text;
    }
    
    // Fallback - read as text
    console.log("📄 Reading file as text...");
    const text = fs.readFileSync(filePath, "utf-8");
    if (!text || text.trim().length === 0) {
      throw new Error("File appears to be empty or unreadable");
    }
    return text;
    
  } catch (error) {
    console.error("❌ Error extracting text:", error.message);
    throw new Error(`Cannot extract text: ${error.message}`);
  }
};

// Parse resume with REAL Gemini AI
const parseResumeWithAI = async (resumeText) => {
  if (!genAI) {
    throw new Error("Gemini AI not initialized. Check GOOGLE_GEMINI_API_KEY in .env");
  }

  try {
    console.log("\n🤖 CALLING GEMINI AI FOR RESUME PARSING...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an expert HR professional and resume analyst. Analyze this resume carefully and return ONLY a valid JSON response with NO markdown formatting, NO code blocks, NO extra text - JUST THE JSON.

Resume:
${resumeText}

Return this exact JSON structure filled with data extracted from the resume:
{
  "personalInfo": {
    "name": "Extract the person's full name from the resume",
    "email": "Extract email address",
    "phone": "Extract phone number",
    "location": "Extract location/city",
    "summary": "Extract professional summary or objective if available"
  },
  "skills": {
    "technical": ["List all technical skills found in resume"],
    "soft": ["List soft skills like communication, leadership"],
    "languages": ["List any languages mentioned"],
    "tools": ["List tools, software, frameworks"]
  },
  "experience": [
    {
      "jobTitle": "Job title",
      "company": "Company name",
      "duration": "Start date - End date or current",
      "description": "Job responsibilities and achievements",
      "skills_used": ["Skills used in this job"]
    }
  ],
  "education": [
    {
      "degree": "Degree name (e.g., Bachelor of Science)",
      "institution": "University or school name",
      "field": "Field of study",
      "graduationYear": "Graduation year",
      "grade": "GPA or grade if mentioned"
    }
  ],
  "certifications": [
    {
      "name": "Certification name",
      "issuer": "Issuing organization",
      "date": "Certification date if available"
    }
  ],
  "projects": [
    {
      "title": "Project name",
      "description": "Project description",
      "technologies": ["Technologies used"]
    }
  ],
  "analysis": {
    "strengths": ["List 3-5 key strengths based on resume"],
    "weaknesses": ["List 2-3 areas that could be improved"],
    "suggestions": ["List 3-5 actionable suggestions for improvement"],
    "careerPath": "Suggested career path based on experience",
    "industryFit": "Industries this person would fit well in",
    "experienceLevel": "junior, mid-level, or senior based on years and roles",
    "overall_score": 75
  },
  "keywords": {
    "ats_friendly_keywords": ["List ATS-friendly keywords present in resume"],
    "missing_keywords": ["List important keywords that should be added"],
    "ats_score": 72
  }
}`;

    console.log("📤 Sending to Gemini AI...");
    const response = await model.generateContent(prompt);
    const responseText = response.response.text();
    
    console.log("📥 Response received from Gemini AI");
    console.log("Response length:", responseText.length);
    console.log("First 300 chars:", responseText.substring(0, 300));

    // Extract JSON - try multiple patterns
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error("❌ No JSON found in response!");
      console.error("Full response:", responseText);
      throw new Error("Gemini AI did not return valid JSON");
    }

    let jsonString = jsonMatch[0];
    console.log("✅ JSON extracted, length:", jsonString.length);

    // Try to parse the JSON
    let parsedData;
    try {
      parsedData = JSON.parse(jsonString);
      console.log("✅ JSON parsed successfully");
      console.log("Parsed data keys:", Object.keys(parsedData));
      return parsedData;
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError.message);
      console.error("JSON string:", jsonString.substring(0, 500));
      
      // Try to clean up common issues
      jsonString = jsonString
        .replace(/,\s*}/g, "}") // Remove trailing commas
        .replace(/,\s*]/g, "]")
        .replace(/\n/g, " ");
      
      try {
        parsedData = JSON.parse(jsonString);
        console.log("✅ JSON parsed after cleanup");
        return parsedData;
      } catch (err) {
        console.error("❌ Still failed after cleanup");
        throw new Error(`Failed to parse AI response: ${parseError.message}`);
      }
    }

  } catch (error) {
    console.error("\n❌ GEMINI AI ERROR:");
    console.error("Error message:", error.message);
    console.error("Error code:", error.status);
    console.error("Full error:", error);
    throw error;
  }
};

// Generate recommendations with REAL Gemini AI
const generateRecommendationsWithAI = async (parsedData, resumeText) => {
  if (!genAI) {
    throw new Error("Gemini AI not initialized");
  }

  try {
    console.log("\n💡 GENERATING RECOMMENDATIONS WITH AI...");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Based on this resume analysis, provide detailed personalized recommendations. Return ONLY valid JSON with NO markdown, NO code blocks, NO extra text.

Resume Skills: ${JSON.stringify(parsedData.skills)}
Experience: ${JSON.stringify(parsedData.experience)}
Analysis: ${JSON.stringify(parsedData.analysis)}

Return ONLY this JSON structure:
{
  "resumeImprovements": [
    {
      "section": "Resume section to improve",
      "currentIssue": "What's wrong with this section",
      "recommendation": "How to fix it",
      "priority": "high/medium/low",
      "example": "Example of improved content"
    }
  ],
  "skillGaps": [
    {
      "skill": "Skill to learn",
      "importance": "high/medium/low",
      "learningPath": "How to learn this skill",
      "estimatedTime": "Time estimate to learn"
    }
  ],
  "certifications": [
    {
      "name": "Certification name",
      "provider": "Provider name",
      "benefit": "Why this certification is beneficial"
    }
  ],
  "jobTargets": [
    {
      "jobTitle": "Suitable job title",
      "matchScore": 85,
      "why": "Why this person is suited for this role",
      "preparation": "What to prepare for this role"
    }
  ]
}`;

    console.log("📤 Sending to Gemini AI...");
    const response = await model.generateContent(prompt);
    const responseText = response.response.text();
    
    console.log("📥 Response received");
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error("❌ No JSON in recommendations response");
      throw new Error("No JSON in recommendations");
    }

    let jsonString = jsonMatch[0];
    let recommendations = JSON.parse(jsonString);
    console.log("✅ Recommendations generated");
    return recommendations;

  } catch (error) {
    console.error("\n❌ RECOMMENDATIONS ERROR:", error.message);
    throw error;
  }
};

// POST: Upload and parse resume with REAL AI
router.post("/parse", authMiddleware, upload.single("resume"), async (req, res) => {
  try {
    console.log("\n\n╔════════════════════════════════════════╗");
    console.log("║   REAL AI RESUME PARSING - START      ║");
    console.log("╚════════════════════════════════════════╝\n");
    
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No file uploaded" });
    }

    console.log(`📄 File received: ${req.file.originalname}`);
    console.log(`📊 Size: ${req.file.size} bytes`);
    console.log(`🎯 Type: ${req.file.mimetype}\n`);

    const filePath = req.file.path;
    const fileName = req.file.originalname;

    // Extract text
    console.log("🔍 EXTRACTING TEXT FROM FILE...");
    let resumeText;
    try {
      resumeText = await extractTextFromFile(filePath, req.file.mimetype);
    } catch (extractError) {
      console.error("❌ Text extraction failed:", extractError.message);
      try { fs.unlinkSync(filePath); } catch (e) {}
      return res.status(400).json({ 
        success: false, 
        error: `Failed to extract text from file: ${extractError.message}. Make sure the file is not a scanned image.`
      });
    }

    if (!resumeText || !resumeText.trim()) {
      console.error("❌ No readable text found");
      try { fs.unlinkSync(filePath); } catch (e) {}
      return res.status(400).json({ 
        success: false, 
        error: "No readable text found in the uploaded file. The file might be a scanned image, corrupted, or in an unsupported format. Please upload a text-based PDF or Word document."
      });
    }

    console.log(`✅ Extracted ${resumeText.length} characters from resume\n`);

    // Parse with REAL Gemini AI
    console.log("═══════════════════════════════════════════");
    const parsedData = await parseResumeWithAI(resumeText);
    console.log("═══════════════════════════════════════════\n");

    // Generate recommendations with REAL AI
    console.log("═══════════════════════════════════════════");
    const recommendations = await generateRecommendationsWithAI(parsedData, resumeText);
    console.log("═══════════════════════════════════════════\n");

    console.log("╔════════════════════════════════════════╗");
    console.log("║   ✅ PARSING COMPLETE - SUCCESS       ║");
    console.log("╚════════════════════════════════════════╝\n");

    res.json({
      success: true,
      analysisId: Date.now().toString(),
      parsedData: parsedData,
      recommendations: recommendations,
      message: "Resume parsed with REAL Gemini AI",
    });

  } catch (error) {
    console.error("\n╔════════════════════════════════════════╗");
    console.error("║   ❌ PARSING FAILED                    ║");
    console.error("╚════════════════════════════════════════╝");
    console.error("Error:", error.message);
    console.error("\n");
    
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    
    res.status(500).json({ 
      success: false,
      error: error.message || "Failed to parse resume with AI"
    });
  }
});

// GET: History
router.get("/history", authMiddleware, async (req, res) => {
  res.json({ success: true, analyses: [] });
});

// GET: Single
router.get("/:id", authMiddleware, async (req, res) => {
  res.status(404).json({ success: false, error: "Not found" });
});

// POST: Compare
router.post("/compare/:analysisId", authMiddleware, async (req, res) => {
  res.json({
    success: true,
    comparison: {
      overallMatchScore: 85,
      matchBreakdown: {
        skillsMatch: { score: 80, matchedSkills: [], missingSkills: [] },
        experienceMatch: { score: 85, analysis: "Good fit" },
        educationMatch: { score: 90, analysis: "Good fit" }
      },
      readiness: "good_fit",
      recommendations: []
    }
  });
});

// DELETE
router.delete("/:id", authMiddleware, async (req, res) => {
  res.json({ success: true, message: "Deleted" });
});

module.exports = router;