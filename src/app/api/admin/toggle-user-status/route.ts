import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "SUPERADMIN") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, isActive } = body;

    if (!userId || typeof isActive !== "boolean") {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Prevent deactivating superadmin accounts
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    if (user.role === "SUPERADMIN") {
      return NextResponse.json(
        { message: "Cannot modify superadmin accounts" },
        { status: 400 }
      );
    }

    // Update user status
    await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    return NextResponse.json(
      { message: `User ${isActive ? "activated" : "deactivated"} successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json(
      { message: "An error occurred" },
      { status: 500 }
    );
  }
}
