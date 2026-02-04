import { GoogleGenAI } from "@google/genai";

// Safe initialization for browser environment
const getApiKey = () => {
  try {
    return process.env.API_KEY || '';
  } catch (e) {
    return '';
  }
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });

export const getHRAssistance = async (query: string, context: any): Promise<string> => {
  if (!apiKey) {
    return "The AI assistant is currently offline (API key missing). Please contact your administrator.";
  }

  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    You are an HR Assistant for AllenHR. 
    The employee is asking: "${query}"
    
    Current Context:
    - Employee Name: ${context.user?.name || 'Employee'}
    - Role: ${context.user?.role || 'Staff'}
    - Attendance History Summary: ${JSON.stringify(context.attendance?.slice(0, 5) || [])}
    - Leave Balance: ${JSON.stringify(context.user?.leaveBalance || {})}
    
    Provide a professional, helpful, and concise response. If they ask about policies, answer based on general modern HR practices.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "I processed your request but don't have a specific answer right now.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I'm having trouble connecting to the HR intelligence module right now.";
  }
};
