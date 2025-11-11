import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET all text models
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const models = await prisma.textModel.findMany({
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }]
    });

    return NextResponse.json({ models });
  } catch (error) {
    console.error("Error fetching text models:", error);
    return NextResponse.json(
      { message: "Failed to fetch text models" },
      { status: 500 }
    );
  }
}

// POST new text model
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { name, modelId, isDefault = false } = await request.json();

    if (!name || !modelId) {
      return NextResponse.json(
        { message: "Name and modelId are required" },
        { status: 400 }
      );
    }

    // If this is set as default, remove default from others
    if (isDefault) {
      await prisma.textModel.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    const model = await prisma.textModel.create({
      data: { name, modelId, isDefault }
    });

    return NextResponse.json({ model });
  } catch (error) {
    console.error("Error creating text model:", error);
    return NextResponse.json(
      { message: "Failed to create text model" },
      { status: 500 }
    );
  }
}

// PATCH update text model
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id, name, modelId, isDefault, isActive } = await request.json();

    if (!id) {
      return NextResponse.json(
        { message: "Model ID is required" },
        { status: 400 }
      );
    }

    // If this is set as default, remove default from others
    if (isDefault) {
      await prisma.textModel.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false }
      });
    }

    const model = await prisma.textModel.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(modelId && { modelId }),
        ...(isDefault !== undefined && { isDefault }),
        ...(isActive !== undefined && { isActive }),
      }
    });

    return NextResponse.json({ model });
  } catch (error) {
    console.error("Error updating text model:", error);
    return NextResponse.json(
      { message: "Failed to update text model" },
      { status: 500 }
    );
  }
}

// DELETE text model
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Model ID is required" },
        { status: 400 }
      );
    }

    await prisma.textModel.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Model deleted successfully" });
  } catch (error) {
    console.error("Error deleting text model:", error);
    return NextResponse.json(
      { message: "Failed to delete text model" },
      { status: 500 }
    );
  }
}
