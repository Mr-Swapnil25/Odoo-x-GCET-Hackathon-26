// AI Service - Powered by Google Gemini API
// Provides intelligent features for HR management

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
  error?: {
    message: string;
  };
}

// Helper function to call Gemini API
const callGeminiAPI = async (prompt: string): Promise<{ result: string | null; error: string | null }> => {
  if (!GEMINI_API_KEY) {
    return { result: null, error: 'Gemini API key not configured' };
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data: GeminiResponse = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('No response from AI');
    }

    return { result: text, error: null };
  } catch (error: any) {
    console.error('Gemini API error:', error);
    return { result: null, error: error.message };
  }
};

// ============================================
// AI-POWERED HR FEATURES
// ============================================

export interface SkillRecommendation {
  skill: string;
  relevance: 'high' | 'medium' | 'low';
  reason: string;
  learningResources?: string[];
}

export interface ProfileAnalysis {
  overallScore: number;
  strengths: string[];
  areasForImprovement: string[];
  careerSuggestions: string[];
  skillGaps: string[];
}

export interface CareerPath {
  currentRole: string;
  targetRole: string;
  timeframe: string;
  steps: {
    step: number;
    title: string;
    description: string;
    skills: string[];
    duration: string;
  }[];
}

export interface InterviewQuestion {
  question: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tips: string;
  sampleAnswer?: string;
}

export interface LeaveInsight {
  pattern: string;
  suggestion: string;
  riskLevel: 'low' | 'medium' | 'high';
}

// 1. AI-Powered Profile/Resume Analysis
export const analyzeProfile = async (employee: {
  firstName: string;
  lastName: string;
  designation: string;
  department: string;
  skills: string[];
  experience?: number;
  certifications?: string[];
}): Promise<{ data: ProfileAnalysis | null; error: string | null }> => {
  const prompt = `
You are an expert HR analyst and career coach. Analyze this employee profile and provide actionable insights.

EMPLOYEE PROFILE:
- Name: ${employee.firstName} ${employee.lastName}
- Current Role: ${employee.designation}
- Department: ${employee.department}
- Skills: ${employee.skills.join(', ') || 'Not specified'}
- Experience: ${employee.experience || 'Not specified'} years
- Certifications: ${employee.certifications?.join(', ') || 'None listed'}

Provide your analysis in the following JSON format ONLY (no other text):
{
  "overallScore": <number 1-100>,
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "areasForImprovement": ["<area1>", "<area2>", "<area3>"],
  "careerSuggestions": ["<suggestion1>", "<suggestion2>", "<suggestion3>"],
  "skillGaps": ["<skill1>", "<skill2>", "<skill3>"]
}
`;

  const { result, error } = await callGeminiAPI(prompt);
  
  if (error || !result) {
    return { data: null, error: error || 'Failed to analyze profile' };
  }

  try {
    // Extract JSON from response
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }
    const analysis = JSON.parse(jsonMatch[0]) as ProfileAnalysis;
    return { data: analysis, error: null };
  } catch (e) {
    console.error('Parse error:', e);
    return { data: null, error: 'Failed to parse AI response' };
  }
};

// 2. Smart Skill Recommendations
export const getSkillRecommendations = async (
  currentSkills: string[],
  designation: string,
  department: string
): Promise<{ data: SkillRecommendation[] | null; error: string | null }> => {
  const prompt = `
You are a talent development expert. Based on the employee's current profile, suggest skills they should learn.

CURRENT PROFILE:
- Role: ${designation}
- Department: ${department}
- Current Skills: ${currentSkills.join(', ') || 'None specified'}

Suggest 5 skills that would be valuable for their career growth. Consider:
1. Industry trends in ${department}
2. Skills that complement their current skillset
3. High-demand skills in 2024-2025

Respond with ONLY this JSON format (no other text):
{
  "recommendations": [
    {
      "skill": "<skill name>",
      "relevance": "high|medium|low",
      "reason": "<why this skill is valuable>",
      "learningResources": ["<resource1>", "<resource2>"]
    }
  ]
}
`;

  const { result, error } = await callGeminiAPI(prompt);
  
  if (error || !result) {
    return { data: null, error: error || 'Failed to get recommendations' };
  }

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid response format');
    const parsed = JSON.parse(jsonMatch[0]);
    return { data: parsed.recommendations as SkillRecommendation[], error: null };
  } catch (e) {
    console.error('Parse error:', e);
    return { data: null, error: 'Failed to parse AI response' };
  }
};

// 3. AI Career Path Generator
export const generateCareerPath = async (
  currentRole: string,
  targetRole: string,
  currentSkills: string[],
  yearsExperience: number
): Promise<{ data: CareerPath | null; error: string | null }> => {
  const prompt = `
You are a career development expert. Create a detailed career progression path.

CURRENT STATE:
- Current Role: ${currentRole}
- Target Role: ${targetRole}
- Current Skills: ${currentSkills.join(', ')}
- Years of Experience: ${yearsExperience}

Create a realistic career path with specific steps. Consider:
1. Typical industry progression
2. Required skill development
3. Realistic timeframes

Respond with ONLY this JSON format:
{
  "currentRole": "${currentRole}",
  "targetRole": "${targetRole}",
  "timeframe": "<estimated total time>",
  "steps": [
    {
      "step": 1,
      "title": "<role/milestone title>",
      "description": "<what to achieve>",
      "skills": ["<skill1>", "<skill2>"],
      "duration": "<time estimate>"
    }
  ]
}
`;

  const { result, error } = await callGeminiAPI(prompt);
  
  if (error || !result) {
    return { data: null, error: error || 'Failed to generate career path' };
  }

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid response format');
    return { data: JSON.parse(jsonMatch[0]) as CareerPath, error: null };
  } catch (e) {
    console.error('Parse error:', e);
    return { data: null, error: 'Failed to parse AI response' };
  }
};

// 4. Interview Prep AI Assistant
export const generateInterviewQuestions = async (
  role: string,
  department: string,
  experienceLevel: 'junior' | 'mid' | 'senior'
): Promise<{ data: InterviewQuestion[] | null; error: string | null }> => {
  const prompt = `
You are an expert interviewer. Generate interview questions for this role.

ROLE DETAILS:
- Position: ${role}
- Department: ${department}
- Experience Level: ${experienceLevel}

Generate 5 interview questions with varying difficulty. Include:
1. Technical/role-specific questions
2. Behavioral questions
3. Situational questions

Respond with ONLY this JSON format:
{
  "questions": [
    {
      "question": "<the interview question>",
      "category": "technical|behavioral|situational",
      "difficulty": "easy|medium|hard",
      "tips": "<tips for answering>",
      "sampleAnswer": "<brief sample answer>"
    }
  ]
}
`;

  const { result, error } = await callGeminiAPI(prompt);
  
  if (error || !result) {
    return { data: null, error: error || 'Failed to generate questions' };
  }

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid response format');
    const parsed = JSON.parse(jsonMatch[0]);
    return { data: parsed.questions as InterviewQuestion[], error: null };
  } catch (e) {
    console.error('Parse error:', e);
    return { data: null, error: 'Failed to parse AI response' };
  }
};

// 5. Leave Pattern Analysis
export const analyzeLeavePatterns = async (
  leaveHistory: {
    type: string;
    startDate: string;
    endDate: string;
    reason: string;
  }[],
  employeeName: string
): Promise<{ data: LeaveInsight[] | null; error: string | null }> => {
  if (leaveHistory.length < 2) {
    return { 
      data: [{
        pattern: 'Insufficient data',
        suggestion: 'Not enough leave history to analyze patterns',
        riskLevel: 'low'
      }], 
      error: null 
    };
  }

  const prompt = `
You are an HR analytics expert. Analyze this employee's leave patterns.

EMPLOYEE: ${employeeName}
LEAVE HISTORY:
${leaveHistory.map(l => `- ${l.type}: ${l.startDate} to ${l.endDate} - "${l.reason}"`).join('\n')}

Identify patterns and provide insights. Consider:
1. Frequency of leaves
2. Types of leaves used
3. Timing patterns (day of week, month)
4. Any concerning patterns

Respond with ONLY this JSON format:
{
  "insights": [
    {
      "pattern": "<observed pattern>",
      "suggestion": "<actionable suggestion>",
      "riskLevel": "low|medium|high"
    }
  ]
}
`;

  const { result, error } = await callGeminiAPI(prompt);
  
  if (error || !result) {
    return { data: null, error: error || 'Failed to analyze patterns' };
  }

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid response format');
    const parsed = JSON.parse(jsonMatch[0]);
    return { data: parsed.insights as LeaveInsight[], error: null };
  } catch (e) {
    console.error('Parse error:', e);
    return { data: null, error: 'Failed to parse AI response' };
  }
};

// 6. Smart Employee Onboarding Suggestions
export const getOnboardingSuggestions = async (
  newEmployee: {
    firstName: string;
    lastName: string;
    designation: string;
    department: string;
  }
): Promise<{ data: string[] | null; error: string | null }> => {
  const prompt = `
You are an HR onboarding specialist. Create a personalized onboarding checklist.

NEW EMPLOYEE:
- Name: ${newEmployee.firstName} ${newEmployee.lastName}
- Role: ${newEmployee.designation}
- Department: ${newEmployee.department}

Generate 7 specific, actionable onboarding tasks for their first week. Consider:
1. Role-specific training needs
2. Department introduction
3. Tool and system access
4. Team integration activities

Respond with ONLY this JSON format:
{
  "tasks": [
    "<task 1>",
    "<task 2>",
    "<task 3>",
    "<task 4>",
    "<task 5>",
    "<task 6>",
    "<task 7>"
  ]
}
`;

  const { result, error } = await callGeminiAPI(prompt);
  
  if (error || !result) {
    return { data: null, error: error || 'Failed to generate suggestions' };
  }

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid response format');
    const parsed = JSON.parse(jsonMatch[0]);
    return { data: parsed.tasks as string[], error: null };
  } catch (e) {
    console.error('Parse error:', e);
    return { data: null, error: 'Failed to parse AI response' };
  }
};

// 7. Performance Review Helper
export const generatePerformanceReviewDraft = async (
  employee: {
    name: string;
    designation: string;
    department: string;
    achievements?: string[];
    challenges?: string[];
    goals?: string[];
  }
): Promise<{ data: { summary: string; strengths: string[]; improvements: string[]; goals: string[] } | null; error: string | null }> => {
  const prompt = `
You are an HR performance management expert. Draft a performance review.

EMPLOYEE:
- Name: ${employee.name}
- Role: ${employee.designation}
- Department: ${employee.department}
- Key Achievements: ${employee.achievements?.join(', ') || 'Not specified'}
- Challenges Faced: ${employee.challenges?.join(', ') || 'Not specified'}
- Goals Set: ${employee.goals?.join(', ') || 'Not specified'}

Generate a balanced, constructive performance review draft.

Respond with ONLY this JSON format:
{
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength1>", "<strength2>", "<strength3>"],
  "improvements": ["<area1>", "<area2>"],
  "goals": ["<goal1>", "<goal2>", "<goal3>"]
}
`;

  const { result, error } = await callGeminiAPI(prompt);
  
  if (error || !result) {
    return { data: null, error: error || 'Failed to generate review' };
  }

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Invalid response format');
    return { data: JSON.parse(jsonMatch[0]), error: null };
  } catch (e) {
    console.error('Parse error:', e);
    return { data: null, error: 'Failed to parse AI response' };
  }
};

// 8. AI Chatbot for HR Queries
export const askHRChatbot = async (
  question: string,
  context?: {
    employeeName?: string;
    department?: string;
    companyPolicies?: string[];
  }
): Promise<{ data: string | null; error: string | null }> => {
  const prompt = `
You are DayflowAI, an intelligent HR assistant for a modern company. Be helpful, concise, and professional.

${context ? `CONTEXT:
- Employee: ${context.employeeName || 'Not specified'}
- Department: ${context.department || 'Not specified'}
- Company Policies: ${context.companyPolicies?.join('; ') || 'Standard HR policies'}
` : ''}

USER QUESTION: ${question}

Provide a helpful, accurate response. If you don't know something specific, say so and provide general guidance. Keep responses under 200 words.
`;

  const { result, error } = await callGeminiAPI(prompt);
  
  if (error || !result) {
    return { data: null, error: error || 'Failed to process question' };
  }

  return { data: result, error: null };
};

// Export all AI functions
export const AIService = {
  analyzeProfile,
  getSkillRecommendations,
  generateCareerPath,
  generateInterviewQuestions,
  analyzeLeavePatterns,
  getOnboardingSuggestions,
  generatePerformanceReviewDraft,
  askHRChatbot,
};

export default AIService;
