import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { imageData, prompt, model, aspectRatio } = await request.json();

    if (!imageData || !prompt) {
      return NextResponse.json(
        { message: "Image data and prompt are required" },
        { status: 400 }
      );
    }

    // Create unique filename with UUID
    const imageId = uuidv4();
    const filename = `${imageId}.jpg`;
    const imagePath = path.join(process.cwd(), "src", "assets", "gen-images", filename);

    // Ensure directory exists
    const dirPath = path.dirname(imagePath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Extract base64 data and save image
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    fs.writeFileSync(imagePath, buffer);

    // Save metadata to CSV
    const csvPath = path.join(process.cwd(), "src", "assets", "sheets", "generated-images.csv");
    
    // Create CSV file with headers if it doesn't exist
    if (!fs.existsSync(csvPath)) {
      fs.writeFileSync(csvPath, "Timestamp,ImagePath,Prompt,Model,AspectRatio\n");
    }

    const timestamp = new Date().toISOString();
    const escapeCSV = (value: string | undefined) => {
      if (!value) return "";
      const cleanedValue = value.replace(/[\r\n]+/g, ' ').trim();
      return `"${cleanedValue.replace(/"/g, '""')}"`;
    };

    const relativePath = `src/assets/gen-images/${filename}`;
    const csvRow = [
      escapeCSV(timestamp),
      escapeCSV(relativePath),
      escapeCSV(prompt),
      escapeCSV(model || ""),
      escapeCSV(aspectRatio || "")
    ].join(",") + "\n";

    fs.appendFileSync(csvPath, csvRow);

    return NextResponse.json(
      { 
        message: "Image saved successfully",
        imagePath: relativePath,
        imageId
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving image:", error);
    return NextResponse.json(
      { message: "An error occurred while saving image" },
      { status: 500 }
    );
  }
}
