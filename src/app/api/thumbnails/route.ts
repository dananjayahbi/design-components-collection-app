import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

/**
 * Thumbnail Upload API Route
 *
 * Handles uploading thumbnail images for basic components.
 * Saves images to src/assets/images/basic-component-thumbnails directory.
 */

// Define the thumbnails directory path
const THUMBNAILS_DIR = path.join(
  process.cwd(),
  "src",
  "assets",
  "images",
  "basic-component-thumbnails"
);

// POST - Upload a new thumbnail
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("thumbnail") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No thumbnail file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Ensure thumbnails directory exists
    if (!existsSync(THUMBNAILS_DIR)) {
      await mkdir(THUMBNAILS_DIR, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = file.name.split(".").pop() || "png";
    const filename = `${uuidv4()}.${fileExtension}`;
    const filepath = path.join(THUMBNAILS_DIR, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return the URL path for the thumbnail
    const thumbnailUrl = `/api/thumbnails/${filename}`;

    return NextResponse.json({ thumbnailUrl, filename }, { status: 201 });
  } catch (error) {
    console.error("Error uploading thumbnail:", error);
    return NextResponse.json(
      { error: "Failed to upload thumbnail" },
      { status: 500 }
    );
  }
}
