import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET - Fetch layout settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get or create default layout settings
    let settings = await prisma.layoutSettings.findFirst();

    if (!settings) {
      settings = await prisma.layoutSettings.create({
        data: {

        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching layout settings:", error);
    return NextResponse.json(
      { message: "Failed to fetch layout settings" },
      { status: 500 }
    );
  }
}

// PATCH - Update layout settings
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {  } = body;

    // Get or create settings
    let settings = await prisma.layoutSettings.findFirst();

    if (!settings) {
      settings = await prisma.layoutSettings.create({
        data: {

      },
      });
    } else {
      settings = await prisma.layoutSettings.update({
        where: { id: settings.id },
        data: {

      },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error updating layout settings:", error);
    return NextResponse.json(
      { message: "Failed to update layout settings" },
      { status: 500 }
    );
  }
}
