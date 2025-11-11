
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const model = 'gemini-flash-lite-latest';

const PROMPT = `Generate a unique and inspiring motivational quote. The quote should be short, impactful, and not a famous saying. Focus on themes of perseverance, growth, and self-belief. Do not include any quotation marks or attributions.`;

export async function generateQuoteStream() {
    try {
        const response = await ai.models.generateContentStream({
            model: model,
            contents: PROMPT,
            config: {
                temperature: 0.9,
                topK: 1,
                topP: 1,
                maxOutputTokens: 2048,
            }
        });
        return response;
    } catch (error) {
        console.error("Error generating quote from Gemini API:", error);
        throw new Error("Could not fetch a quote from the Gemini API.");
    }
}
