import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imagePath = searchParams.get("path");

    if (!imagePath) {
      return NextResponse.json(
        { message: "Image path is required" },
        { status: 400 }
      );
    }

    const csvPath = path.join(process.cwd(), "src", "assets", "sheets", "generated-images.csv");
    const fullImagePath = path.join(process.cwd(), imagePath);

    // Delete the image file
    if (fs.existsSync(fullImagePath)) {
      fs.unlinkSync(fullImagePath);
    }

    // Update CSV
    if (fs.existsSync(csvPath)) {
      const fileContent = fs.readFileSync(csvPath, "utf-8");
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
      });

      const updatedRecords = records.filter(
        (record: any) => record.ImagePath !== imagePath
      );

      // Manually reconstruct CSV
      const csvLines = ["Timestamp,ImagePath,Prompt,Model,AspectRatio"];
      updatedRecords.forEach((record: any) => {
        const line = [
          record.Timestamp,
          record.ImagePath,
          `"${record.Prompt?.replace(/"/g, '""') || ''}"`,
          record.Model,
          record.AspectRatio,
        ].join(",");
        csvLines.push(line);
      });

      fs.writeFileSync(csvPath, csvLines.join("\n"));
    }

    return NextResponse.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json(
      { message: "Failed to delete image" },
      { status: 500 }
    );
  }
}
