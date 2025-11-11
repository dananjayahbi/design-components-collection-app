import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateQuote = async (theme: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: `Generate a short, powerful motivational quote about "${theme}". The quote should be inspiring and concise. Return only the raw text of the quote itself, without quotation marks or any other text.`,
    });
    const quoteText = response.text.trim();
    if (!quoteText) {
        console.error("Gemini API returned an empty string for the quote.");
        throw new Error("The model returned an empty quote. Please try a different theme.");
    }
    return quoteText;
  } catch (error) {
    console.error("Error generating quote:", error);
    if (error instanceof Error && error.message.includes("empty quote")) {
        throw error;
    }
    throw new Error("Failed to generate quote from Gemini API.");
  }
};

export const generateBackgroundImage = async (theme: string): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
        model: 'gemini-2.5-flash-image',
        prompt: `An inspiring and visually stunning abstract background image representing the concept of "${theme}". It should have vibrant, harmonious colors and a sense of depth and texture. The image must be suitable as a background for a motivational quote, meaning it should not be too busy or have a clear focal point that would distract from text. No text or logos in the image.`,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '3:4', // 3:4 is a supported aspect ratio, close to the desired 4:5
        },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    } else {
      throw new Error("No image was generated.");
    }
  } catch (error) {
    console.error("Error generating background image:", error);
    throw new Error("Failed to generate background image from Gemini API.");
  }
};