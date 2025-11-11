import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { quote, tone, length, niche, context, model } = await request.json();

    if (!quote) {
      return NextResponse.json(
        { message: "Quote is required" },
        { status: 400 }
      );
    }

    // Path to CSV file
    const csvPath = path.join(process.cwd(), "src", "assets", "sheets", "generated-quotes.csv");

    // Ensure directory exists
    const dirPath = path.dirname(csvPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    // Create CSV file with headers if it doesn't exist
    if (!fs.existsSync(csvPath)) {
      fs.writeFileSync(csvPath, "Timestamp,Quote,Tone,Length,Niche,Context,Model\n");
    }

    // Format data for CSV - escape quotes and wrap in quotes
    const timestamp = new Date().toISOString();
    const escapeCSV = (value: string | undefined) => {
      if (!value) return "";
      // Remove line breaks and trim, then escape double quotes by doubling them and wrap in quotes
      const cleanedValue = value.replace(/[\r\n]+/g, ' ').trim();
      return `"${cleanedValue.replace(/"/g, '""')}"`;
    };

    const csvRow = [
      escapeCSV(timestamp),
      escapeCSV(quote),
      escapeCSV(tone || ""),
      escapeCSV(length || ""),
      escapeCSV(niche || ""),
      escapeCSV(context || ""),
      escapeCSV(model || "")
    ].join(",") + "\n";

    // Append to CSV file
    fs.appendFileSync(csvPath, csvRow);

    return NextResponse.json(
      { message: "Quote saved successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving quote:", error);
    return NextResponse.json(
      { message: "An error occurred while saving quote" },
      { status: 500 }
    );
  }
}
