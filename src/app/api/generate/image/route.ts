import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenAI, Modality, Part } from "@google/genai";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    let { model, prompt, aspectRatio } = await request.json();

    // If no model specified, get default from database
    if (!model) {
      const defaultModel = await prisma.imageModel.findFirst({
        where: { isDefault: true, isActive: true }
      });
      
      if (defaultModel) {
        model = defaultModel.modelId;
      } else {
        return NextResponse.json(
          { message: "No model specified and no default model configured" },
          { status: 400 }
        );
      }
    }

    // If no aspect ratio specified, get default from database
    if (!aspectRatio) {
      let settings = await prisma.imageSettings.findFirst();
      if (!settings) {
        settings = await prisma.imageSettings.create({
          data: { defaultAspectRatio: "3:4" }
        });
      }
      aspectRatio = settings.defaultAspectRatio;
    }

    if (!prompt) {
      return NextResponse.json(
        { message: "Prompt is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { message: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    // Initialize GoogleGenAI
    const ai = new GoogleGenAI({ apiKey });

    // Build the parts array with the prompt including aspect ratio instruction
    const enhancedPrompt = `${prompt}. Use ${aspectRatio} aspect ratio.`;
    const parts: Part[] = [{ text: enhancedPrompt }];

    // Generate image using Gemini 2.5 Flash Image model
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    // Extract the image from the response
    const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

    if (imagePart?.inlineData?.data) {
      const base64ImageBytes: string = imagePart.inlineData.data;
      const mimeType = imagePart.inlineData.mimeType || 'image/jpeg';
      const imageData = `data:${mimeType};base64,${base64ImageBytes}`;
      
      return NextResponse.json({
        imageData,
        model,
        aspectRatio,
      });
    } else {
      throw new Error("No image was generated. The response may be empty or blocked due to safety policies.");
    }

  } catch (error) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "An error occurred while generating image" },
      { status: 500 }
    );
  }
}

