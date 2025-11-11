import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as fs from "fs";
import * as path from "path";

export async function GET(request: Request) {
  try {
    console.log("📸 Images list API called");
    
    const session = await getServerSession(authOptions);
    console.log("🔐 Session:", session ? "authenticated" : "not authenticated");

    if (!session) {
      console.log("❌ Unauthorized - no session");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    console.log(`📄 Page: ${page}, Limit: ${limit}`);

    const csvPath = path.join(process.cwd(), "src", "assets", "sheets", "generated-images.csv");
    console.log("📂 CSV Path:", csvPath);
    console.log("📁 CSV exists:", fs.existsSync(csvPath));

    if (!fs.existsSync(csvPath)) {
      console.log("⚠️ CSV file not found, returning empty array");
      return NextResponse.json({ images: [], total: 0, page, limit, totalPages: 0 });
    }

    const fileContent = fs.readFileSync(csvPath, "utf-8");
    console.log("📝 File content length:", fileContent.length);
    
    // Parse CSV manually (similar to quotes API)
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    if (lines.length <= 1) {
      console.log("⚠️ CSV file has no data rows");
      return NextResponse.json({ images: [], total: 0, page, limit, totalPages: 0 });
    }

    // Parse header
    const headers = lines[0].split(',');
    console.log("📋 Headers:", headers);
    
    // Parse records - handle quoted CSV values
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
    console.log("📊 Parsed records:", records.length);

    // Reverse to show newest first
    const allImages = records.reverse();
    const total = allImages.length;

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedImages = allImages.slice(startIndex, endIndex);
    console.log(`✅ Returning ${paginatedImages.length} images (${startIndex}-${endIndex} of ${total})`);

    return NextResponse.json({
      images: paginatedImages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("❌ Error listing images:", error);
    return NextResponse.json(
      { message: "Failed to list images", error: String(error) },
      { status: 500 }
    );
  }
}
