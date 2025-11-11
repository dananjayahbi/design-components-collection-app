import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET image settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get the first (and should be only) settings record
    let settings = await prisma.imageSettings.findFirst();

    // If no settings exist, create default
    if (!settings) {
      settings = await prisma.imageSettings.create({
        data: { defaultAspectRatio: "3:4" }
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error fetching image settings:", error);
    return NextResponse.json(
      { message: "Failed to fetch image settings" },
      { status: 500 }
    );
  }
}

// PATCH update image settings
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { defaultAspectRatio } = await request.json();

    if (!defaultAspectRatio) {
      return NextResponse.json(
        { message: "Default aspect ratio is required" },
        { status: 400 }
      );
    }

    // Get the first settings record or create if doesn't exist
    let settings = await prisma.imageSettings.findFirst();

    if (settings) {
      settings = await prisma.imageSettings.update({
        where: { id: settings.id },
        data: { defaultAspectRatio }
      });
    } else {
      settings = await prisma.imageSettings.create({
        data: { defaultAspectRatio }
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Error updating image settings:", error);
    return NextResponse.json(
      { message: "Failed to update image settings" },
      { status: 500 }
    );
  }
}
