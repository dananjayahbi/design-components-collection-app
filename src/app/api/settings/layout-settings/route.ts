import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Layout Settings API Route
 * 
 * This API route manages layout/navigation visibility settings.
 * It's used by the page creation script and the LayoutSettingsTab component.
 * 
 * When creating new toggleable pages using the create-page.js script,
 * this file will be automatically updated to include the new settings field.
 */

// GET - Fetch current layout settings
export async function GET() {
  try {
    // Get or create layout settings
    let settings = await prisma.layoutSettings.findFirst();

    if (!settings) {
      settings = await prisma.layoutSettings.create({
        data: {
          // Add default values for new settings fields here
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching layout settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch layout settings" },
      { status: 500 }
    );
  }
}

// PATCH - Update layout settings
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Get or create layout settings
    let settings = await prisma.layoutSettings.findFirst();

    if (!settings) {
      settings = await prisma.layoutSettings.create({
        data: {
          ...body,
        },
      });
    } else {
      settings = await prisma.layoutSettings.update({
        where: { id: settings.id },
        data: {
          ...body,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating layout settings:", error);
    return NextResponse.json(
      { error: "Failed to update layout settings" },
      { status: 500 }
    );
  }
}
