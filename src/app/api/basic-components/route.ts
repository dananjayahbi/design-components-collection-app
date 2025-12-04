import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { unlink } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

/**
 * Basic Components API Route
 *
 * Handles CRUD operations for basic component code snippets.
 * Supports long code content (1000+ lines) using TEXT fields.
 * Includes server-side pagination and search.
 */

// Define the thumbnails directory path
const THUMBNAILS_DIR = path.join(
  process.cwd(),
  "src",
  "assets",
  "images",
  "basic-component-thumbnails"
);

// Helper function to delete thumbnail file
async function deleteThumbnailFile(thumbnailUrl: string | null): Promise<void> {
  if (!thumbnailUrl) return;
  
  try {
    // Extract filename from URL (e.g., /api/thumbnails/uuid.png -> uuid.png)
    const filename = thumbnailUrl.split("/").pop();
    if (!filename) return;
    
    const filepath = path.join(THUMBNAILS_DIR, filename);
    
    if (existsSync(filepath)) {
      await unlink(filepath);
      console.log(`Deleted thumbnail: ${filename}`);
    }
  } catch (error) {
    console.error("Error deleting thumbnail file:", error);
    // Don't throw - we still want to delete the component even if thumbnail deletion fails
  }
}

// GET - Fetch all basic components or a specific one by ID
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const search = searchParams.get("search");
    const tag = searchParams.get("tag");
    const favorite = searchParams.get("favorite");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const skip = (page - 1) * limit;

    // If ID is provided, fetch single component
    if (id) {
      const component = await prisma.basicComponent.findUnique({
        where: { id },
      });

      if (!component) {
        return NextResponse.json(
          { error: "Component not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(component);
    }

    // Build filters
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (tag) {
      where.tags = { has: tag };
    }

    if (favorite === "true") {
      where.isFavorite = true;
    }

    // Get total count for pagination
    const totalCount = await prisma.basicComponent.count({ where });

    // Fetch components with pagination
    const components = await prisma.basicComponent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    return NextResponse.json({
      components,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + components.length < totalCount,
      },
    });
  } catch (error) {
    console.error("Error fetching basic components:", error);
    return NextResponse.json(
      { error: "Failed to fetch basic components" },
      { status: 500 }
    );
  }
}

// POST - Create a new basic component
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, html, css, javascript, tags, thumbnailUrl } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Component name is required" },
        { status: 400 }
      );
    }

    const component = await prisma.basicComponent.create({
      data: {
        name,
        description: description || "",
        html: html || "",
        css: css || "",
        javascript: javascript || "",
        tags: tags || [],
        thumbnailUrl: thumbnailUrl || null,
      },
    });

    return NextResponse.json(component, { status: 201 });
  } catch (error) {
    console.error("Error creating basic component:", error);
    return NextResponse.json(
      { error: "Failed to create basic component" },
      { status: 500 }
    );
  }
}

// PATCH - Update an existing basic component
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, html, css, javascript, tags, isFavorite, thumbnailUrl } =
      body;

    if (!id) {
      return NextResponse.json(
        { error: "Component ID is required" },
        { status: 400 }
      );
    }

    // Check if component exists
    const existing = await prisma.basicComponent.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Component not found" },
        { status: 404 }
      );
    }

    const component = await prisma.basicComponent.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(html !== undefined && { html }),
        ...(css !== undefined && { css }),
        ...(javascript !== undefined && { javascript }),
        ...(tags !== undefined && { tags }),
        ...(isFavorite !== undefined && { isFavorite }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
      },
    });

    return NextResponse.json(component);
  } catch (error) {
    console.error("Error updating basic component:", error);
    return NextResponse.json(
      { error: "Failed to update basic component" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a basic component
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Component ID is required" },
        { status: 400 }
      );
    }

    // Check if component exists and get its thumbnail URL
    const existing = await prisma.basicComponent.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Component not found" },
        { status: 404 }
      );
    }

    // Delete the thumbnail file if it exists
    await deleteThumbnailFile(existing.thumbnailUrl);

    // Delete the component from database
    await prisma.basicComponent.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Component deleted successfully" });
  } catch (error) {
    console.error("Error deleting basic component:", error);
    return NextResponse.json(
      { error: "Failed to delete basic component" },
      { status: 500 }
    );
  }
}
