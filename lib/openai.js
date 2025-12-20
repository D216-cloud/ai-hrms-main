import OpenAI from "openai";

let openai = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
} else {
  console.warn("OPENAI_API_KEY not configured - AI features will be disabled");
}

/**
 * Generate embeddings for text using OpenAI's text-embedding-3-large model
 * @param {string} text - The text to generate embeddings for
 * @returns {Promise<number[]>} - The embedding vector
 */
export async function generateEmbedding(text) {
  if (!openai) {
    throw new Error("OpenAI API key not configured");
  }
  
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-large",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error("Failed to generate embedding");
  }
}

/**
 * Generate a job description using OpenAI
 * @param {Object} jobDetails - Job details
 * @returns {Promise<string>} - Generated job description
 */
export async function generateJobDescription({
  title,
  skills = [],
  experienceMin = 0,
  experienceMax = 5,
  location = "",
  salaryMin = null,
  salaryMax = null,
}) {
  try {
    if (!openai) {
      console.error("OpenAI client is not configured. OPENAI_API_KEY missing.");
      throw new Error("OpenAI API key not configured");
    }
    // Allow skills to be either an array or a comma-separated string
    let skillsArray = Array.isArray(skills)
      ? skills
      : typeof skills === "string"
      ? skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const skillsList = skillsArray.length > 0 ? skillsArray.join(", ") : "relevant technical skills";
    const salaryInfo = salaryMin && salaryMax 
      ? `\nSalary Range: $${salaryMin.toLocaleString()} - $${salaryMax.toLocaleString()}`
      : "";

    const prompt = `Generate a professional, engaging job description for the following position:

Title: ${title}
Location: ${location}
Experience Required: ${experienceMin}-${experienceMax} years
Key Skills: ${skillsList}${salaryInfo}

IMPORTANT FORMATTING REQUIREMENTS:
1. Use emojis appropriately to make sections engaging (🎯, 💼, ✨, 🚀, 📋, 🎓, 🌟, 💡, etc.)
2. Use clear section headings with emojis
3. Use bullet points (•) for lists, NOT numbered lists
4. Keep paragraphs concise and scannable
5. Write in an engaging, modern tone
6. Do NOT use markdown symbols like ** or # or ##
7. Use line breaks for visual separation

REQUIRED SECTIONS:

🎯 About the Role
[Write 2-3 sentences describing the position and its impact]

💼 Key Responsibilities
• [Bullet point]
• [Bullet point]
• [Bullet point]
• [Bullet point]
• [Bullet point]

✨ Required Qualifications
• [Bullet point]
• [Bullet point]
• [Bullet point]
• [Bullet point]

🚀 Preferred Skills
• [Bullet point]
• [Bullet point]
• [Bullet point]

🌟 What We Offer
• [Bullet point about benefits/culture]
• [Bullet point about benefits/culture]
• [Bullet point about benefits/culture]

Make it professional yet engaging. Focus on clarity and readability.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert HR copywriter who creates compelling, well-formatted job descriptions with emojis and bullet points. Never use markdown symbols or asterisks. Use plain text with emojis and bullet points (•) only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    // Log full error details for server-side debugging
    console.error("Error generating job description:", error?.message || error);
    if (error?.response) {
      console.error("OpenAI response:", error.response);
    }
    throw new Error(error?.message || "Failed to generate job description");
  }
}

/**
 * Parse resume text into structured JSON
 * @param {string} resumeText - The extracted resume text
 * @returns {Promise<Object>} - Parsed resume data in strict JSON format for form auto-fill
 */
export async function parseResume(resumeText) {
  try {
    // Validate input
    if (!resumeText || typeof resumeText !== 'string') {
      throw new Error("Invalid resume text provided for parsing");
    }
    
    const trimmedText = resumeText.trim();
    if (trimmedText.length < 50) {
      throw new Error("Resume text is too short to parse meaningfully");
    }
    
    console.log("Parsing resume text. Length:", trimmedText.length);
    
    const prompt = `You are a professional resume parser. Extract ALL information from the resume and return ONLY valid JSON.

REQUIRED JSON STRUCTURE:
{
  "full_name": "string - extracted full name",
  "email": "string - extracted email address or empty string",
  "phone": "string - extracted phone number or empty string",
  "location": "string - extracted city, state/country or empty string",
  "about_me": "string - professional summary or objective (1-2 sentences) or empty string",
  "skills": ["array of skill strings - extract ALL technical and soft skills"],
  "experience": [
    {
      "job_title": "string - job title",
      "company": "string - company name",
      "start_date": "string - start date (YYYY-MM or YYYY or just year)",
      "end_date": "string - end date (YYYY-MM or YYYY or 'Present' if current)",
      "description": "string - job description or key responsibilities (2-3 sentences or bullet points)"
    }
  ],
  "education": [
    {
      "school": "string - school/university name",
      "degree": "string - degree type (e.g., Bachelor of Science, MBA)",
      "field_of_study": "string - major/field or empty string",
      "graduation_year": "string - graduation year (YYYY) or empty string",
      "gpa": "string - GPA if available or empty string"
    }
  ]
}

EXTRACTION RULES:
1. Extract full_name as the candidate's complete name
2. Extract email (common patterns: name@domain.com)
3. Extract phone (various formats accepted)
4. Extract location (city, state, or country)
5. Extract about_me from professional summary or objective section
6. Extract ALL skills mentioned - technical, software, languages, certifications
7. For experience: extract ALL jobs with company, title, dates, and description
8. For education: extract ALL degrees with institution, degree type, field, year, GPA
9. If a field is missing, use empty string "" NOT null
10. Return ONLY valid JSON - no markdown, no explanations

Resume text:
${trimmedText}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert resume parser. Your job is to extract all essential resume information and return it as valid JSON matching the exact structure provided. Be thorough and accurate. Never skip fields - use empty strings for missing data.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 3000,
      response_format: { type: "json_object" },
    });

    // Validate response
    if (!response || !response.choices || !response.choices[0]) {
      throw new Error("Invalid response from OpenAI API");
    }
    
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI API");
    }
    
    console.log("OpenAI response received. Content length:", content.length);
    
    const parsed = JSON.parse(content);
    
    // Validate structure and apply defaults for missing fields
    const validatedData = {
      full_name: String(parsed.full_name || "").trim(),
      email: String(parsed.email || "").trim(),
      phone: String(parsed.phone || "").trim(),
      location: String(parsed.location || "").trim(),
      about_me: String(parsed.about_me || "").trim(),
      skills: Array.isArray(parsed.skills) 
        ? parsed.skills.map(s => String(s).trim()).filter(s => s.length > 0)
        : [],
      experience: Array.isArray(parsed.experience)
        ? parsed.experience.map(exp => ({
            job_title: String(exp.job_title || "").trim(),
            company: String(exp.company || "").trim(),
            start_date: String(exp.start_date || "").trim(),
            end_date: String(exp.end_date || "").trim(),
            description: String(exp.description || "").trim()
          }))
        : [],
      education: Array.isArray(parsed.education)
        ? parsed.education.map(edu => ({
            school: String(edu.school || "").trim(),
            degree: String(edu.degree || "").trim(),
            field_of_study: String(edu.field_of_study || "").trim(),
            graduation_year: String(edu.graduation_year || "").trim(),
            gpa: String(edu.gpa || "").trim()
          }))
        : []
    };
    
    console.log("Resume parsed successfully:", {
      full_name: validatedData.full_name,
      email: validatedData.email,
      skillsCount: validatedData.skills.length,
      experienceCount: validatedData.experience.length,
      educationCount: validatedData.education.length
    });
    
    return validatedData;
  } catch (error) {
    console.error("Error parsing resume:", error);
    console.error("Resume text sample:", resumeText ? resumeText.substring(0, 200) + "..." : "No text");
    
    if (error.message.includes("JSON")) {
      throw new Error("Failed to parse resume - AI returned invalid JSON. Please try again.");
    }
    
    throw new Error("Failed to parse resume");
  }
}

/**
 * Generate MCQ questions for a job
 * @param {Object} params - Job parameters
 * @returns {Promise<Array>} - Array of MCQ questions
 */
export async function generateMCQ({
  jobTitle,
  skills = [],
  experienceYears = 2,
}) {
  try {
    const prompt = `Generate 7 multiple-choice technical questions (JSON array). Each item should have: {q: string, options: array of 4 strings, correctIndex: number (0-3)}. 
    
Topic: ${jobTitle} requiring ${skills.join(", ")}. 
Keep medium difficulty for a candidate with ${experienceYears} years of experience.

Return only valid JSON array. No markdown, no extra text.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a technical interview question generator. Create relevant, fair questions.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.questions || result;
  } catch (error) {
    console.error("Error generating MCQ:", error);
    throw new Error("Failed to generate MCQ questions");
  }
}

/**
 * Transcribe audio using OpenAI Whisper
 * @param {File|Blob} audioFile - Audio file
 * @returns {Promise<string>} - Transcribed text
 */
export async function transcribeAudio(audioFile) {
  try {
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });

    return response.text;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error("Failed to transcribe audio");
  }
}

/**
 * Evaluate interview transcript
 * @param {string} transcript - Interview transcript
 * @param {string} question - Interview question
 * @returns {Promise<Object>} - Evaluation results
 */
export async function evaluateTranscript(
  transcript,
  question = "Tell me about yourself"
) {
  try {
    const prompt = `You are an interviewer. Evaluate the candidate's answer below for correctness, structure, and communication. 

Question: ${question}
Answer: ${transcript}

Return JSON with: {score: number (0-100), strengths: array of strings, weaknesses: array of strings, feedback: string}

Return only valid JSON. No markdown, no extra text.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert interviewer evaluating candidate responses.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 1000,
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error evaluating transcript:", error);
    throw new Error("Failed to evaluate transcript");
  }
}

/**
 * Intelligently match resume against job description using AI
 * Analyzes skills, experience, qualifications and provides detailed scoring
 * @param {string} resumeText - Extracted text from candidate's resume
 * @param {string} jobDescription - Job description text
 * @param {Object} jobDetails - Additional job details (title, required skills, experience range)
 * @returns {Promise<Object>} - Match analysis with score and detailed breakdown
 */
export async function matchResumeToJob(resumeText, jobDescription, jobDetails) {
  try {
    const prompt = `You are an expert ATS (Applicant Tracking System) analyzer. Analyze how well this candidate's resume matches the job requirements.

JOB DETAILS:
Title: ${jobDetails.title || "Not specified"}
Required Experience: ${jobDetails.minExp || 0}-${jobDetails.maxExp || 5} years
Key Skills Required: ${jobDetails.skills?.join(", ") || "Not specified"}
Location: ${jobDetails.location || "Not specified"}

JOB DESCRIPTION:
${jobDescription}

CANDIDATE RESUME:
${resumeText}

Analyze the match and return JSON with:
{
  "matchScore": number (0-100, where 100 is perfect match),
  "skillsMatch": {
    "matched": array of skills from resume that match job requirements,
    "missing": array of required skills not found in resume,
    "additional": array of relevant skills candidate has beyond requirements
  },
  "experienceMatch": {
    "candidateYears": number or null,
    "meetsRequirement": boolean,
    "analysis": string
  },
  "strengths": array of strings (top 3-5 reasons this is a good match),
  "concerns": array of strings (top 3-5 potential gaps or concerns),
  "recommendation": string ("Strong Match" | "Good Match" | "Moderate Match" | "Weak Match" | "Poor Match"),
  "summary": string (2-3 sentence overall assessment)
}

Be thorough but fair. Consider:
- Technical skills alignment
- Years of experience
- Education background
- Industry experience
- Project relevance
- Cultural fit indicators

Return only valid JSON. No markdown, no extra text.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an expert ATS analyzer and HR professional. Provide accurate, fair, and detailed candidate-job matching analysis.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent scoring
      max_tokens: 2500,
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(response.choices[0].message.content);

    // Ensure matchScore is within valid range
    if (analysis.matchScore < 0) analysis.matchScore = 0;
    if (analysis.matchScore > 100) analysis.matchScore = 100;

    return analysis;
  } catch (error) {
    console.error("Error matching resume to job:", error);
    throw new Error("Failed to analyze resume-job match");
  }
}

export default openai;
