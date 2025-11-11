import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get pagination parameters from query string
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Path to CSV file
    const csvPath = path.join(process.cwd(), "src", "assets", "sheets", "generated-quotes.csv");

    // Check if file exists
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json({
        quotes: [],
        totalCount: 0,
        currentPage: page,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      });
    }

    // Read and parse CSV file manually
    const fileContent = fs.readFileSync(csvPath, "utf-8");
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    if (lines.length <= 1) {
      return NextResponse.json({
        quotes: [],
        totalCount: 0,
        currentPage: page,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      });
    }

    // Parse header
    const headers = lines[0].split(',');
    
    // Parse records - simple approach for quoted CSV
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values: string[] = [];
      let currentValue = '';
      let insideQuote = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        const nextChar = j < line.length - 1 ? line[j + 1] : '';
        
        if (char === '"' && nextChar === '"') {
          // Escaped quote
          currentValue += '"';
          j++; // Skip next quote
        } else if (char === '"') {
          // Toggle quote state
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          // Field delimiter
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      // Add last value
      values.push(currentValue.trim());
      
      const record: any = {};
      headers.forEach((header, index) => {
        record[header.trim()] = values[index] || '';
      });
      records.push(record);
    }

    // Calculate pagination
    const totalCount = records.length;
    const totalPages = Math.ceil(totalCount / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    // Get paginated records and add row IDs
    const paginatedQuotes = records
      .slice(startIndex, endIndex)
      .map((record: any, index: number) => ({
        rowId: startIndex + index + 1,
        timestamp: record.Timestamp,
        quote: record.Quote,
        tone: record.Tone,
        length: record.Length,
        niche: record.Niche,
        context: record.Context,
        model: record.Model,
      }));

    return NextResponse.json({
      quotes: paginatedQuotes,
      totalCount,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    });
  } catch (error) {
    console.error("Error reading quotes:", error);
    return NextResponse.json(
      { message: "An error occurred while reading quotes" },
      { status: 500 }
    );
  }
}
