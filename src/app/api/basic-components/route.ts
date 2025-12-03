import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Basic Components API Route
 *
 * Handles CRUD operations for basic component code snippets.
 * Supports long code content (1000+ lines) using TEXT fields.
 */

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

    // Fetch all components with filters
    const components = await prisma.basicComponent.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(components);
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
    const { name, description, html, css, javascript, tags } = body;

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
    const { id, name, description, html, css, javascript, tags, isFavorite } =
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
