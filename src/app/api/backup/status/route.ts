import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Define the backup directory
const BACKUP_DIR = path.join(process.cwd(), "backups");
const BACKUP_FILE = path.join(BACKUP_DIR, "backup.db");

// GET - Get backup status and info
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!fs.existsSync(BACKUP_FILE)) {
      return NextResponse.json({
        exists: false,
        message: "No backup file found",
      });
    }

    // Get file stats
    const stats = fs.statSync(BACKUP_FILE);

    // Open database to get metadata
    let metadata = null;
    let counts = { basicComponents: 0, reactComponents: 0, layoutSettings: 0 };

    try {
      const db = new Database(BACKUP_FILE, { readonly: true });
      
      // Get metadata
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table'")
        .all() as { name: string }[];
      
      const tableNames = tables.map((t) => t.name);
      
      if (tableNames.includes("BackupMetadata")) {
        metadata = db.prepare("SELECT * FROM BackupMetadata WHERE id = 1").get() as any;
      }

      // Get counts
      if (tableNames.includes("BasicComponent")) {
        const result = db.prepare("SELECT COUNT(*) as count FROM BasicComponent").get() as any;
        counts.basicComponents = result?.count || 0;
      }
      if (tableNames.includes("ReactComponent")) {
        const result = db.prepare("SELECT COUNT(*) as count FROM ReactComponent").get() as any;
        counts.reactComponents = result?.count || 0;
      }
      if (tableNames.includes("LayoutSettings")) {
        const result = db.prepare("SELECT COUNT(*) as count FROM LayoutSettings").get() as any;
        counts.layoutSettings = result?.count || 0;
      }

      db.close();
    } catch (e) {
      console.error("Error reading backup metadata:", e);
    }

    return NextResponse.json({
      exists: true,
      fileSize: stats.size,
      fileSizeFormatted: formatFileSize(stats.size),
      lastModified: stats.mtime.toISOString(),
      backupDate: metadata?.backupDate || stats.mtime.toISOString(),
      version: metadata?.version || "Unknown",
      counts,
    });
  } catch (error) {
    console.error("Backup status error:", error);
    return NextResponse.json(
      { error: "Failed to get backup status" },
      { status: 500 }
    );
  }
}

// DELETE - Delete backup file
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!fs.existsSync(BACKUP_FILE)) {
      return NextResponse.json({
        success: true,
        message: "No backup file to delete",
      });
    }

    fs.unlinkSync(BACKUP_FILE);

    return NextResponse.json({
      success: true,
      message: "Backup file deleted successfully",
    });
  } catch (error) {
    console.error("Delete backup error:", error);
    return NextResponse.json(
      { error: "Failed to delete backup" },
      { status: 500 }
    );
  }
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
