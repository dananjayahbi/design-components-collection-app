import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { writeFile } from "fs/promises";

// Define the backup directory
const BACKUP_DIR = path.join(process.cwd(), "backups");
const TEMP_RESTORE_FILE = path.join(BACKUP_DIR, "restore-temp.db");

// Ensure backup directory exists
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

// POST - Restore from uploaded backup file
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the uploaded file
    const formData = await request.formData();
    const file = formData.get("backup") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No backup file provided" },
        { status: 400 }
      );
    }

    // Validate file extension
    if (!file.name.endsWith(".db")) {
      return NextResponse.json(
        { error: "Invalid file format. Please upload a .db file" },
        { status: 400 }
      );
    }

    ensureBackupDir();

    // Save uploaded file temporarily
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(TEMP_RESTORE_FILE, buffer);

    // Open the backup database
    let db: Database.Database;
    try {
      db = new Database(TEMP_RESTORE_FILE, { readonly: true });
    } catch (e) {
      fs.unlinkSync(TEMP_RESTORE_FILE);
      return NextResponse.json(
        { error: "Invalid or corrupted backup file" },
        { status: 400 }
      );
    }

    // Validate backup structure
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all() as { name: string }[];
    
    const tableNames = tables.map((t) => t.name);
    const requiredTables = ["BasicComponent", "ReactComponent"];
    
    for (const required of requiredTables) {
      if (!tableNames.includes(required)) {
        db.close();
        fs.unlinkSync(TEMP_RESTORE_FILE);
        return NextResponse.json(
          { error: `Invalid backup file: missing ${required} table` },
          { status: 400 }
        );
      }
    }

    // Read data from backup
    const basicComponents = db.prepare("SELECT * FROM BasicComponent").all() as any[];
    const reactComponents = db.prepare("SELECT * FROM ReactComponent").all() as any[];
    
    let layoutSettingsData: any[] = [];
    if (tableNames.includes("LayoutSettings")) {
      layoutSettingsData = db.prepare("SELECT * FROM LayoutSettings").all() as any[];
    }

    // Get metadata if available
    let metadata = null;
    if (tableNames.includes("BackupMetadata")) {
      metadata = db.prepare("SELECT * FROM BackupMetadata WHERE id = 1").get() as any;
    }

    db.close();

    // Clear existing data (optional - user can choose)
    const clearExisting = formData.get("clearExisting") === "true";

    if (clearExisting) {
      await Promise.all([
        prisma.basicComponent.deleteMany(),
        prisma.reactComponent.deleteMany(),
        prisma.layoutSettings.deleteMany(),
      ]);
    }

    // Restore BasicComponents
    let restoredBasic = 0;
    for (const component of basicComponents) {
      try {
        await prisma.basicComponent.upsert({
          where: { id: component.id },
          update: {
            name: component.name,
            description: component.description,
            html: component.html,
            css: component.css,
            javascript: component.javascript,
            tags: JSON.parse(component.tags || "[]"),
            isFavorite: component.isFavorite === 1,
            thumbnailUrl: component.thumbnailUrl,
            updatedAt: new Date(),
          },
          create: {
            id: component.id,
            name: component.name,
            description: component.description,
            html: component.html,
            css: component.css,
            javascript: component.javascript,
            tags: JSON.parse(component.tags || "[]"),
            isFavorite: component.isFavorite === 1,
            thumbnailUrl: component.thumbnailUrl,
            createdAt: new Date(component.createdAt),
            updatedAt: new Date(component.updatedAt),
          },
        });
        restoredBasic++;
      } catch (e) {
        console.error(`Failed to restore BasicComponent ${component.id}:`, e);
      }
    }

    // Restore ReactComponents
    let restoredReact = 0;
    for (const component of reactComponents) {
      try {
        await prisma.reactComponent.upsert({
          where: { id: component.id },
          update: {
            name: component.name,
            description: component.description,
            componentCode: component.componentCode,
            cssCode: component.cssCode,
            dependencies: JSON.parse(component.dependencies || "[]"),
            tags: JSON.parse(component.tags || "[]"),
            isFavorite: component.isFavorite === 1,
            thumbnailUrl: component.thumbnailUrl,
            updatedAt: new Date(),
          },
          create: {
            id: component.id,
            name: component.name,
            description: component.description,
            componentCode: component.componentCode,
            cssCode: component.cssCode,
            dependencies: JSON.parse(component.dependencies || "[]"),
            tags: JSON.parse(component.tags || "[]"),
            isFavorite: component.isFavorite === 1,
            thumbnailUrl: component.thumbnailUrl,
            createdAt: new Date(component.createdAt),
            updatedAt: new Date(component.updatedAt),
          },
        });
        restoredReact++;
      } catch (e) {
        console.error(`Failed to restore ReactComponent ${component.id}:`, e);
      }
    }

    // Restore LayoutSettings
    let restoredSettings = 0;
    for (const settings of layoutSettingsData) {
      try {
        await prisma.layoutSettings.upsert({
          where: { id: settings.id },
          update: {
            showBasicComponents: settings.showBasicComponents === 1,
            showSaveReactComponents: settings.showSaveReactComponents === 1,
            showSaveBasicComponents: settings.showSaveBasicComponents === 1,
            showDesignConcepts: settings.showDesignConcepts === 1,
            showReactComponents: settings.showReactComponents === 1,
            updatedAt: new Date(),
          },
          create: {
            id: settings.id,
            showBasicComponents: settings.showBasicComponents === 1,
            showSaveReactComponents: settings.showSaveReactComponents === 1,
            showSaveBasicComponents: settings.showSaveBasicComponents === 1,
            showDesignConcepts: settings.showDesignConcepts === 1,
            showReactComponents: settings.showReactComponents === 1,
            createdAt: new Date(settings.createdAt),
            updatedAt: new Date(settings.updatedAt),
          },
        });
        restoredSettings++;
      } catch (e) {
        console.error(`Failed to restore LayoutSettings ${settings.id}:`, e);
      }
    }

    // Clean up temp file
    if (fs.existsSync(TEMP_RESTORE_FILE)) {
      fs.unlinkSync(TEMP_RESTORE_FILE);
    }

    return NextResponse.json({
      success: true,
      message: "Restore completed successfully",
      stats: {
        basicComponents: {
          total: basicComponents.length,
          restored: restoredBasic,
        },
        reactComponents: {
          total: reactComponents.length,
          restored: restoredReact,
        },
        layoutSettings: {
          total: layoutSettingsData.length,
          restored: restoredSettings,
        },
        backupDate: metadata?.backupDate || "Unknown",
      },
    });
  } catch (error) {
    console.error("Restore error:", error);
    
    // Clean up temp file on error
    if (fs.existsSync(TEMP_RESTORE_FILE)) {
      fs.unlinkSync(TEMP_RESTORE_FILE);
    }
    
    return NextResponse.json(
      { error: "Failed to restore backup", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
