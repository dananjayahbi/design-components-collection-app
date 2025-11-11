import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

    let { model, tone, length, niche, context } = await request.json();

    // If no model specified, get default from database
    if (!model) {
      const defaultModel = await prisma.textModel.findFirst({
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

    // Import GoogleGenAI
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { message: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model });

    // Build dynamic prompt based on optional parameters
    let prompt = "Generate a unique, powerful";
    
    // Add tone
    if (tone) {
      prompt += ` and ${tone}`;
    }
    
    prompt += " quote";

    // Add niche/topic
    if (niche) {
      prompt += ` about ${niche}`;
    }

    // Add length specification
    if (length === "short") {
      prompt += ". Keep it concise and impactful (1-2 lines).";
    } else if (length === "medium") {
      prompt += ". Make it meaningful and complete (3-4 lines).";
    } else if (length === "long") {
      prompt += ". Create an elaborate and detailed quote (5-6 lines).";
    } else {
      prompt += ". Make it meaningful and impactful.";
    }

    // Add custom context if provided
    if (context) {
      prompt += ` Context: ${context}.`;
    }

    prompt += " Return only the quote itself, without any quotation marks, attribution, or extra formatting. Make it original and thought-provoking.";

    const result = await geminiModel.generateContentStream(prompt);

    // Create a readable stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (error) {
    console.error("Error generating quote:", error);
    return NextResponse.json(
      { message: "An error occurred while generating quote" },
      { status: 500 }
    );
  }
}
