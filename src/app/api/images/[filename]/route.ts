import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as fs from "fs";
import * as path from "path";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { filename } = await params;
    
    // Security: validate filename to prevent directory traversal
    if (!filename || filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json({ message: "Invalid filename" }, { status: 400 });
    }

    const imagePath = path.join(process.cwd(), "src", "assets", "gen-images", filename);

    if (!fs.existsSync(imagePath)) {
      return NextResponse.json({ message: "Image not found" }, { status: 404 });
    }

    const imageBuffer = fs.readFileSync(imagePath);
    
    // Determine content type based on extension
    const ext = path.extname(filename).toLowerCase();
    const contentType = ext === ".png" ? "image/png" : "image/jpeg";

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving image:", error);
    return NextResponse.json(
      { message: "Failed to serve image" },
      { status: 500 }
    );
  }
}
