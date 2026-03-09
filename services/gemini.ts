
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateEmailDraft = async (docType: string, docNumber: string, clientName: string, amount: string, businessName: string): Promise<{subject: string, body: string}> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Draft a professional email for sending an ${docType} to a client. 
      Details: Doc Number: ${docNumber}, Client: ${clientName}, Amount: ${amount}, From: ${businessName}.
      Return as JSON with "subject" and "body" keys. Body should be warm but professional.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING }
          },
          required: ["subject", "body"]
        }
      }
    });
    return JSON.parse(response.text || '{"subject": "", "body": ""}');
  } catch (error) {
    return {
      subject: `${docType} #${docNumber} from ${businessName}`,
      body: `Hi ${clientName},\n\nPlease find your ${docType} for ${amount} attached.\n\nBest regards,\n${businessName}`
    };
  }
};

export const generateProfessionalDescription = async (basicText: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Improve this invoice item description to sound more professional and concise: "${basicText}". Keep it under 15 words.`,
      config: { 
        maxOutputTokens: 100, 
        temperature: 0.7,
        // Added thinkingConfig as required when maxOutputTokens is set
        thinkingConfig: { thinkingBudget: 50 }
      }
    });
    return response.text?.trim() || basicText;
  } catch (error) {
    return basicText;
  }
};

export const brainstormProjectItems = async (projectType: string): Promise<any[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate 4 common line items for a project described as: "${projectType}". 
      Return as JSON array of objects with keys: title, description, quantity (number), rate (suggested realistic number in USD).`,
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
              rate: { type: Type.NUMBER }
            },
            required: ["title", "description", "quantity", "rate"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const generateSalesPitch = async (items: any[], businessName: string): Promise<string> => {
  try {
    const itemString = items.map(i => i.title || i.description).join(", ");
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a persuasive 2-sentence cover note for a proposal from ${businessName} for: ${itemString}.`,
      config: { 
        maxOutputTokens: 150, 
        temperature: 0.8,
        // Added thinkingConfig as required when maxOutputTokens is set
        thinkingConfig: { thinkingBudget: 50 }
      }
    });
    return response.text?.trim() || "";
  } catch (error) {
    return "We are excited to propose these services for your project.";
  }
};

export const generateReminderEmail = async (invoice: any, client: any, business: any): Promise<string> => {
  try {
    const daysOverdue = Math.floor((Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24));
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a professional overdue reminder for invoice ${invoice.invoiceNumber}. ${daysOverdue} days late. Terms: ${business.paymentTerms}.`,
      config: { 
        maxOutputTokens: 300,
        // Added thinkingConfig as required when maxOutputTokens is set
        thinkingConfig: { thinkingBudget: 100 }
      }
    });
    return response.text?.trim() || "Reminder: Your invoice is past due.";
  } catch (error) {
    return "Gentle reminder: Your invoice is past due.";
  }
};
