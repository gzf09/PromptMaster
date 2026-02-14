import { GoogleGenAI } from "@google/genai";

// Initialize the client with the API key from the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const optimizePromptWithAI = async (originalPrompt: string): Promise<string> => {
  if (!originalPrompt.trim()) {
    throw new Error("Prompt cannot be empty");
  }

  try {
    const systemInstruction = `You are an expert Prompt Engineer. Your goal is to take a raw, potentially vague user idea and transform it into a highly effective, structured, and clear prompt suitable for Large Language Models (LLMs) like Gemini, GPT-4, or Claude.
    
    Guidelines:
    1.  **Clarity & Specificity**: Remove ambiguity. Specify the persona, context, task, and constraints.
    2.  **Structure**: Use markdown (bullet points, headers) if complex.
    3.  **Output Format**: Explicitly state how the output should look (JSON, code, table, essay, etc.).
    4.  **Tone**: Define the desired tone (professional, witty, academic, etc.).
    5.  **Language**: IF the input is in Chinese, the output MUST be in Chinese. If the input is English, the output must be English.
    
    Input: The user's draft prompt.
    Output: ONLY the optimized prompt text. Do not add conversational filler like "Here is your optimized prompt:".`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: originalPrompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    if (response.text) {
      return response.text.trim();
    } else {
      throw new Error("No response text received from Gemini.");
    }
  } catch (error) {
    console.error("Error optimizing prompt:", error);
    throw error;
  }
};

export const generateIdeasWithAI = async (topic: string): Promise<string[]> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate 5 creative and useful prompt ideas related to the topic: "${topic}". Return them as a simple JSON array of strings. If the topic is Chinese, return Chinese ideas.`,
            config: {
                responseMimeType: 'application/json',
            }
        });

        const text = response.text;
        if (!text) return [];
        return JSON.parse(text);
    } catch (error) {
        console.error("Error generating ideas:", error);
        return [];
    }
}
