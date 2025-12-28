import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Define the backup directory
const BACKUP_DIR = path.join(process.cwd(), "backups");
const BACKUP_FILE = path.join(BACKUP_DIR, "backup.db");

// Ensure backup directory exists
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

// Initialize SQLite database with schema
function initializeBackupDb(db: Database.Database) {
  // Create BasicComponent table
  db.exec(`
    CREATE TABLE IF NOT EXISTS BasicComponent (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      html TEXT NOT NULL,
      css TEXT NOT NULL,
      javascript TEXT NOT NULL,
      tags TEXT NOT NULL,
      isFavorite INTEGER NOT NULL DEFAULT 0,
      thumbnailUrl TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // Create ReactComponent table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ReactComponent (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      componentCode TEXT NOT NULL,
      cssCode TEXT NOT NULL,
      dependencies TEXT NOT NULL,
      tags TEXT NOT NULL,
      isFavorite INTEGER NOT NULL DEFAULT 0,
      thumbnailUrl TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // Create LayoutSettings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS LayoutSettings (
      id TEXT PRIMARY KEY,
      showBasicComponents INTEGER NOT NULL DEFAULT 1,
      showSaveReactComponents INTEGER NOT NULL DEFAULT 1,
      showSaveBasicComponents INTEGER NOT NULL DEFAULT 1,
      showDesignConcepts INTEGER NOT NULL DEFAULT 1,
      showReactComponents INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // Create metadata table for backup info
  db.exec(`
    CREATE TABLE IF NOT EXISTS BackupMetadata (
      id INTEGER PRIMARY KEY,
      backupDate TEXT NOT NULL,
      version TEXT NOT NULL,
      basicComponentCount INTEGER NOT NULL,
      reactComponentCount INTEGER NOT NULL
    )
  `);
}

// POST - Create backup
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    ensureBackupDir();

    // Remove existing backup file if exists
    if (fs.existsSync(BACKUP_FILE)) {
      fs.unlinkSync(BACKUP_FILE);
    }

    // Create new SQLite database
    const db = new Database(BACKUP_FILE);
    initializeBackupDb(db);

    // Fetch all data from PostgreSQL
    const [basicComponents, reactComponents, layoutSettings] = await Promise.all([
      prisma.basicComponent.findMany(),
      prisma.reactComponent.findMany(),
      prisma.layoutSettings.findMany(),
    ]);

    // Insert BasicComponents
    const insertBasicComponent = db.prepare(`
      INSERT INTO BasicComponent (id, name, description, html, css, javascript, tags, isFavorite, thumbnailUrl, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const component of basicComponents) {
      insertBasicComponent.run(
        component.id,
        component.name,
        component.description,
        component.html,
        component.css,
        component.javascript,
        JSON.stringify(component.tags),
        component.isFavorite ? 1 : 0,
        component.thumbnailUrl,
        component.createdAt.toISOString(),
        component.updatedAt.toISOString()
      );
    }

    // Insert ReactComponents
    const insertReactComponent = db.prepare(`
      INSERT INTO ReactComponent (id, name, description, componentCode, cssCode, dependencies, tags, isFavorite, thumbnailUrl, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const component of reactComponents) {
      insertReactComponent.run(
        component.id,
        component.name,
        component.description,
        component.componentCode,
        component.cssCode,
        JSON.stringify(component.dependencies),
        JSON.stringify(component.tags),
        component.isFavorite ? 1 : 0,
        component.thumbnailUrl,
        component.createdAt.toISOString(),
        component.updatedAt.toISOString()
      );
    }

    // Insert LayoutSettings
    const insertLayoutSettings = db.prepare(`
      INSERT INTO LayoutSettings (id, showBasicComponents, showSaveReactComponents, showSaveBasicComponents, showDesignConcepts, showReactComponents, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const settings of layoutSettings) {
      insertLayoutSettings.run(
        settings.id,
        settings.showBasicComponents ? 1 : 0,
        settings.showSaveReactComponents ? 1 : 0,
        settings.showSaveBasicComponents ? 1 : 0,
        settings.showDesignConcepts ? 1 : 0,
        settings.showReactComponents ? 1 : 0,
        settings.createdAt.toISOString(),
        settings.updatedAt.toISOString()
      );
    }

    // Insert metadata
    const insertMetadata = db.prepare(`
      INSERT INTO BackupMetadata (id, backupDate, version, basicComponentCount, reactComponentCount)
      VALUES (1, ?, ?, ?, ?)
    `);

    insertMetadata.run(
      new Date().toISOString(),
      "1.0.0",
      basicComponents.length,
      reactComponents.length
    );

    db.close();

    return NextResponse.json({
      success: true,
      message: "Backup created successfully",
      stats: {
        basicComponents: basicComponents.length,
        reactComponents: reactComponents.length,
        layoutSettings: layoutSettings.length,
        backupPath: BACKUP_FILE,
        backupDate: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Backup error:", error);
    return NextResponse.json(
      { error: "Failed to create backup", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// GET - Download backup file
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!fs.existsSync(BACKUP_FILE)) {
      return NextResponse.json(
        { error: "No backup file found. Please create a backup first." },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(BACKUP_FILE);
    const fileName = `backup-${new Date().toISOString().split("T")[0]}.db`;

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Download backup error:", error);
    return NextResponse.json(
      { error: "Failed to download backup" },
      { status: 500 }
    );
  }
}
