import { GoogleGenAI, Type } from "@google/genai";
import { DiagramData } from "../types";

const SYSTEM_PROMPT = `
You are an expert software architect and diagram generator.
Your task is to extract sequence diagram structures from user input (text description or image).
You must identify:
1. Actors (participants/lifelines)
2. Messages (interactions between actors in chronological order)

Return the result purely as a JSON object matching the requested schema.
`;

const extractJsonText = (response: any): string | null => {
  const directText = response?.text;
  if (directText) return directText;

  const parts = response?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    const textPart = parts.find((p: any) => typeof p?.text === "string");
    if (textPart?.text) return textPart.text;
  }

  return null;
};

const parseDiagramData = (rawText: string): DiagramData => {
  const trimmed = rawText.trim();
  const withoutFences = trimmed
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(withoutFences) as DiagramData;
};

export const generateDiagramFromText = async (apiKey: string, text: string): Promise<DiagramData> => {
  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a sequence diagram from this description: "${text}"`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          actors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING }
              },
              required: ['id', 'name']
            }
          },
          messages: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                sourceId: { type: Type.STRING },
                targetId: { type: Type.STRING },
                label: { type: Type.STRING },
                order: { type: Type.INTEGER }
              },
              required: ['id', 'sourceId', 'targetId', 'label', 'order']
            }
          }
        },
        required: ['actors', 'messages']
      }
    }
  });

  const rawText = extractJsonText(response);
  if (rawText) {
    return parseDiagramData(rawText);
  }
  throw new Error("No data returned from AI");
};

export const generateDiagramFromImage = async (apiKey: string, base64Image: string): Promise<DiagramData> => {
  const ai = new GoogleGenAI({ apiKey });
  
  // Extract mime type + base64 payload from data URL
  const dataUrlMatch = base64Image.match(/^data:(.+);base64,(.*)$/);
  const mimeType = dataUrlMatch?.[1] || "image/png";
  const cleanBase64 = dataUrlMatch?.[2] || base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");
  if (!cleanBase64) {
    throw new Error("Invalid image data");
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview', // Using preview model for image analysis
    contents: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64
            }
          },
          {
            text: "Analyze this image and extract the sequence diagram structure (actors and messages)."
          }
        ]
      }
    ],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          actors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING }
              },
              required: ['id', 'name']
            }
          },
          messages: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                sourceId: { type: Type.STRING },
                targetId: { type: Type.STRING },
                label: { type: Type.STRING },
                order: { type: Type.INTEGER }
              },
              required: ['id', 'sourceId', 'targetId', 'label', 'order']
            }
          }
        },
        required: ['actors', 'messages']
      }
    }
  });

  const rawText = extractJsonText(response);
  if (rawText) {
    return parseDiagramData(rawText);
  }
  throw new Error("No data returned from AI");
};
