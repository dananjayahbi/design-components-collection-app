import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET all image models
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const models = await prisma.imageModel.findMany({
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }]
    });

    return NextResponse.json({ models });
  } catch (error) {
    console.error("Error fetching image models:", error);
    return NextResponse.json(
      { message: "Failed to fetch image models" },
      { status: 500 }
    );
  }
}

// POST new image model
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
      await prisma.imageModel.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    const model = await prisma.imageModel.create({
      data: { name, modelId, isDefault }
    });

    return NextResponse.json({ model });
  } catch (error) {
    console.error("Error creating image model:", error);
    return NextResponse.json(
      { message: "Failed to create image model" },
      { status: 500 }
    );
  }
}

// PATCH update image model
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
      await prisma.imageModel.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false }
      });
    }

    const model = await prisma.imageModel.update({
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
    console.error("Error updating image model:", error);
    return NextResponse.json(
      { message: "Failed to update image model" },
      { status: 500 }
    );
  }
}

// DELETE image model
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

    await prisma.imageModel.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Model deleted successfully" });
  } catch (error) {
    console.error("Error deleting image model:", error);
    return NextResponse.json(
      { message: "Failed to delete image model" },
      { status: 500 }
    );
  }
}
