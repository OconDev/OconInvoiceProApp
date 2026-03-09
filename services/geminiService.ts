
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function polishDescription(text: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Transform this basic line item description into a professional, clear, and compelling business description for an invoice or estimate: "${text}". Keep it concise (max 30 words).`,
  });
  return response.text || text;
}

export async function brainstormItems(projectName: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate 5 realistic line items for a professional project named "${projectName}". Include a title, a brief professional description, a suggested quantity, and a suggested rate.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            quantity: { type: Type.NUMBER },
            rate: { type: Type.NUMBER },
          },
          required: ["title", "description", "quantity", "rate"],
        }
      }
    }
  });
  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return [];
  }
}

export async function generateSalesPitch(total: number, clientName: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Write a 2-sentence professional cover note/sales pitch for an estimate totaling $${total.toLocaleString()} for ${clientName}. It should be warm, confident, and invite collaboration.`,
  });
  return response.text || '';
}

export async function draftEmail(total: number, clientName: string, docNumber: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Draft a warm, professional email body for invoice #${docNumber} for ${clientName}. Mention the total of $${total.toLocaleString()}. Use a professional but friendly tone.`,
  });
  return response.text || '';
}
