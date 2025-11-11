import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { rowId } = await request.json();

    if (!rowId) {
      return NextResponse.json(
        { message: "Row ID is required" },
        { status: 400 }
      );
    }

    // Path to CSV file
    const csvPath = path.join(process.cwd(), "src", "assets", "sheets", "generated-quotes.csv");

    if (!fs.existsSync(csvPath)) {
      return NextResponse.json(
        { message: "CSV file not found" },
        { status: 404 }
      );
    }

    // Read CSV
    const fileContent = fs.readFileSync(csvPath, "utf-8");
    const lines = fileContent.split('\n');
    
    if (rowId > lines.length - 1) {
      return NextResponse.json(
        { message: "Quote not found" },
        { status: 404 }
      );
    }

    // Remove the line (rowId corresponds to line index)
    lines.splice(rowId, 1);

    // Write back to file
    fs.writeFileSync(csvPath, lines.join('\n'));

    return NextResponse.json(
      { message: "Quote deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting quote:", error);
    return NextResponse.json(
      { message: "An error occurred while deleting quote" },
      { status: 500 }
    );
  }
}
