import { GoogleGenAI } from "@google/genai";

// Always use the recommended initialization with the API_KEY from process.env
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getHRAssistance = async (query: string, context: any) => {
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    You are an HR Assistant for AllenHR. 
    The employee is asking: "${query}"
    
    Current Context:
    - Employee Name: ${context.user.name}
    - Role: ${context.user.role}
    - Attendance History Summary: ${JSON.stringify(context.attendance.slice(0, 5))}
    - Leave Balance: ${JSON.stringify(context.user.leaveBalance)}
    
    Provide a professional, helpful, and concise response. If they ask about policies, answer based on general modern HR practices.
  `;

  try {
    // Generate content using the recommended ai.models.generateContent call
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I'm having trouble connecting to the HR intelligence module right now.";
  }
};
