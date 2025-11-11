import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { rowId, quote } = await request.json();

    if (!rowId || !quote) {
      return NextResponse.json(
        { message: "Row ID and quote are required" },
        { status: 400 }
      );
    }

    // Path to CSV file
    const csvPath = path.join(process.cwd(), "src", "assets", "sheets", "generated-quotes.csv");

    if (!fs.existsSync(csvPath)) {
      return NextResponse.json(
        { message: "CSV file not found" },
        { status: 404 }
      );
    }

    // Read and parse CSV
    const fileContent = fs.readFileSync(csvPath, "utf-8");
    const lines = fileContent.split('\n');
    
    if (rowId > lines.length - 1) {
      return NextResponse.json(
        { message: "Quote not found" },
        { status: 404 }
      );
    }

    // Parse the line to update
    const lineIndex = rowId; // rowId corresponds to line index (1-indexed, but 0 is header)
    const line = lines[lineIndex];
    const values: string[] = [];
    let currentValue = '';
    let insideQuote = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      const nextChar = j < line.length - 1 ? line[j + 1] : '';
      
      if (char === '"' && nextChar === '"') {
        currentValue += '"';
        j++;
      } else if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());

    // Update the quote field (index 1)
    const cleanedQuote = quote.replace(/[\r\n]+/g, ' ').trim();
    values[1] = `"${cleanedQuote.replace(/"/g, '""')}"`;

    // Reconstruct the line
    lines[lineIndex] = values.join(',');

    // Write back to file
    fs.writeFileSync(csvPath, lines.join('\n'));

    return NextResponse.json(
      { message: "Quote updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating quote:", error);
    return NextResponse.json(
      { message: "An error occurred while updating quote" },
      { status: 500 }
    );
  }
}
