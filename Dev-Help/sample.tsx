import { GoogleGenAI, Modality, Part } from "@google/genai";

// Assume process.env.API_KEY is available in the environment
const apiKey = process.env.API_KEY;
if (!apiKey) {
    console.warn("API_KEY environment variable is not set. The application may not function correctly.");
}

const ai = new GoogleGenAI({ apiKey: apiKey! });

interface ImageInput {
    data: string;
    mimeType: string;
}

export const generateImage = async (prompt: string, image?: ImageInput): Promise<string> => {
    try {
        console.log(`Generating image for prompt: "${prompt}" with${image ? '' : 'out'} an input image.`);
        const parts: Part[] = [];

        if (image) {
            parts.push({
                inlineData: {
                    data: image.data,
                    mimeType: image.mimeType,
                },
            });
        }
        
        // The prompt is still required, even if it's just to guide the model.
        parts.push({ text: prompt });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

        if (imagePart?.inlineData) {
            const base64ImageBytes: string = imagePart.inlineData.data;
            const mimeType = imagePart.inlineData.mimeType;
            return `data:${mimeType};base64,${base64ImageBytes}`;
        } else {
            throw new Error("No image was generated. The response may be empty or blocked due to safety policies.");
        }
    } catch (error) {
        console.error("Error generating image:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate image: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the image.");
    }
};