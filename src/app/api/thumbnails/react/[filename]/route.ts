import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

/**
 * React Component Thumbnail Serving API Route
 *
 * Serves thumbnail images from the src/assets/images/react-component-thumbnails directory.
 */

// Define the thumbnails directory path
const THUMBNAILS_DIR = path.join(
  process.cwd(),
  "src",
  "assets",
  "images",
  "react-component-thumbnails"
);

// Content type mapping for common image extensions
const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
};

// GET - Serve a thumbnail image
export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Validate filename to prevent path traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return NextResponse.json(
        { error: "Invalid filename" },
        { status: 400 }
      );
    }

    const filepath = path.join(THUMBNAILS_DIR, filename);

    // Check if file exists
    if (!existsSync(filepath)) {
      return NextResponse.json(
        { error: "Thumbnail not found" },
        { status: 404 }
      );
    }

    // Read the file
    const fileBuffer = await readFile(filepath);

    // Determine content type
    const extension = filename.split(".").pop()?.toLowerCase() || "png";
    const contentType = CONTENT_TYPES[extension] || "application/octet-stream";

    // Return the image with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error serving react thumbnail:", error);
    return NextResponse.json(
      { error: "Failed to serve thumbnail" },
      { status: 500 }
    );
  }
}
