import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyBMgAXzxb7rps412bOtYElChPzwE7aUbMI";
const genAI = new GoogleGenerativeAI(API_KEY);

// Get the Gemini model
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Generate a professional leave request reason
 */
export async function generateLeaveReason(
  leaveType: string, 
  startDate: string, 
  endDate: string
): Promise<string> {
  try {
    // Calculate duration
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const prompt = `Write a professional leave request reason for ${leaveType} for ${days} day(s) from ${startDate} to ${endDate}. 
    
Requirements:
- Keep it concise (2-3 sentences maximum)
- Be formal and appropriate for HR submission
- Don't include personal details
- Make it sound genuine and professional
- Don't use placeholder text like [dates] or [reason]

Just provide the reason text directly, no quotes or explanation.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error: any) {
    console.error("Gemini AI Error:", error);
    if (error.message?.includes("429") || error.message?.includes("quota")) {
      throw new Error("Too many requests. Please wait a moment and try again.");
    }
    throw new Error("AI assistant unavailable. Please try again later.");
  }
}

/**
 * Generate attendance insights for admin dashboard
 */
export async function generateAttendanceInsights(attendanceData: {
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  departmentStats: { name: string; employees: number; present: number }[];
  recentTrend: number[];
}): Promise<string[]> {
  try {
    const prompt = `Analyze this employee attendance data and provide 3 actionable HR insights as bullet points:

Data Summary:
- Total Employees: ${attendanceData.totalEmployees}
- Present Today: ${attendanceData.presentToday} (${Math.round((attendanceData.presentToday / attendanceData.totalEmployees) * 100)}%)
- On Leave Today: ${attendanceData.onLeave}
- Attendance Trend (last 6 months): ${attendanceData.recentTrend.join('%, ')}%
- Department Breakdown: ${attendanceData.departmentStats.map(d => `${d.name}: ${d.present}/${d.employees}`).join(', ')}

Requirements:
- Provide exactly 3 insights as separate lines
- Each insight should be actionable and specific
- Focus on patterns, improvements, or concerns
- Keep each insight to 1-2 sentences
- Don't use bullet points or numbers in the response
- Just provide the 3 insights, one per line`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text().trim();
    
    // Split by newlines and filter empty lines
    const insights = text
      .split('\n')
      .map(line => line.replace(/^[-•*\d.]+\s*/, '').trim())
      .filter(line => line.length > 10)
      .slice(0, 3);
    
    return insights.length > 0 ? insights : [
      "Overall attendance rate is healthy. Consider recognizing teams with consistent attendance.",
      "Monitor departments with lower attendance for potential workload or morale issues.",
      "Consider implementing flexible work arrangements to further improve attendance."
    ];
  } catch (error: any) {
    console.error("Gemini AI Error:", error);
    // Return fallback insights
    return [
      "Attendance data analysis temporarily unavailable. Refresh to try again.",
      "Tip: Regular attendance reviews help identify patterns early.",
      "Consider setting up automated alerts for attendance anomalies."
    ];
  }
}

/**
 * Generate AI performance summary for an employee
 */
export async function generatePerformanceSummary(employee: {
  name: string;
  department: string;
  designation: string;
  joinDate: string;
  attendanceRate: number;
  leaveDaysUsed: number;
  totalLeaveBalance: number;
}): Promise<string> {
  try {
    // Calculate tenure in months
    const joinDate = new Date(employee.joinDate);
    const now = new Date();
    const tenureMonths = Math.floor((now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    const prompt = `Generate a brief HR performance summary for this employee:

Employee Details:
- Name: ${employee.name}
- Department: ${employee.department}
- Designation: ${employee.designation}
- Tenure: ${tenureMonths} months
- Attendance Rate: ${employee.attendanceRate}%
- Leave Days Used: ${employee.leaveDaysUsed} of ${employee.totalLeaveBalance} available

Requirements:
- Write 2-3 professional sentences
- Highlight strengths based on the data
- Be encouraging but objective
- If attendance is high (>90%), mention it positively
- If leave usage is balanced, note good work-life balance
- Suggest potential if tenure and performance warrant it
- Don't use placeholder text or quotes`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error: any) {
    console.error("Gemini AI Error:", error);
    // Return a generic summary based on available data
    const attendanceNote = employee.attendanceRate >= 90 
      ? "demonstrates excellent attendance reliability" 
      : "maintains regular attendance";
    return `${employee.name} ${attendanceNote} with ${employee.attendanceRate}% attendance rate. Currently serving as ${employee.designation} in the ${employee.department} department.`;
  }
}

/**
 * Generate quick HR tips/suggestions
 */
export async function generateHRTip(): Promise<string> {
  const tips = [
    "Regular one-on-ones boost employee engagement by 30%",
    "Recognition programs increase retention by up to 31%",
    "Flexible work options are the #1 requested benefit",
    "Clear career paths reduce turnover by 50%",
    "Team building activities improve collaboration scores",
    "Mental health support is now a top employee priority",
    "Transparent communication builds trust and loyalty",
    "Skills development opportunities attract top talent"
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}
