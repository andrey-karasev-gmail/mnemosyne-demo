import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/client/client";

const sqliteUrl = `file:${path.resolve(__dirname, "../prisma/dev.db")}`;
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? sqliteUrl,
});

const globalDatabase = globalThis as typeof globalThis & { mnemosynePrisma?: PrismaClient };

export const prisma = globalDatabase.mnemosynePrisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalDatabase.mnemosynePrisma = prisma;
}
