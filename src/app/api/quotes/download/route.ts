import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as fs from "fs";
import * as path from "path";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const csvPath = path.join(process.cwd(), "src", "assets", "sheets", "generated-quotes.csv");

    if (!fs.existsSync(csvPath)) {
      return NextResponse.json(
        { message: "Quote sheet not found" },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(csvPath);

    return new NextResponse(fileContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="generated-quotes-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error downloading quote sheet:", error);
    return NextResponse.json(
      { message: "Failed to download quote sheet" },
      { status: 500 }
    );
  }
}
