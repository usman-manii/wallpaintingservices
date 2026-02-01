// Prisma 7.x Configuration File
import "dotenv/config";
import { defineConfig } from "prisma/config";

// Security: DATABASE_URL must be explicitly set - no fallback with hardcoded credentials
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL environment variable is required. '
    + 'Please set it in your .env file or environment.'
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
