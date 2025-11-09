import "dotenv/config";
import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";
import path from "path";

// Load .env.local for local development
config({ path: path.resolve(process.cwd(), ".env.local") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
