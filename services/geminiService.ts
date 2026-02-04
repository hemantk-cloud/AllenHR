import { GoogleGenAI } from "@google/genai";

// Always use the apiKey from process.env.API_KEY directly in the initialization object
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getHRAssistance = async (query: string, context: any): Promise<string> => {
  // Use 'gemini-3-flash-preview' for basic text tasks as per model selection guidelines
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
    // Correct usage of ai.models.generateContent with model and contents
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    
    // response.text is a getter property, correctly accessed without parenthesis
    return response.text || "I processed your request but don't have a specific answer right now.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm sorry, I'm having trouble connecting to the HR intelligence module right now.";
  }
};
