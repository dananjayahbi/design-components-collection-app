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
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the registration request
    const registrationRequest = await prisma.registrationRequest.findUnique({
      where: { id: requestId },
    });

    if (!registrationRequest) {
      return NextResponse.json(
        { message: "Registration request not found" },
        { status: 404 }
      );
    }

    if (registrationRequest.status !== "PENDING") {
      return NextResponse.json(
        { message: "This request has already been processed" },
        { status: 400 }
      );
    }

    // Update request status to rejected
    await prisma.registrationRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        processedAt: new Date(),
      },
    });

    return NextResponse.json(
      { message: "Registration request rejected" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error rejecting registration:", error);
    return NextResponse.json(
      { message: "An error occurred" },
      { status: 500 }
    );
  }
}
