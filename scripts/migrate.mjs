#!/usr/bin/env node
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "..", "db", "migrations");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

await client.query(`
  CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`);

const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort();
const { rows } = await client.query("SELECT name FROM _migrations");
const applied = new Set(rows.map((r) => r.name));

for (const file of files) {
  if (applied.has(file)) {
    console.log(`skip ${file}`);
    continue;
  }
  const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
  console.log(`apply ${file}`);
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query("INSERT INTO _migrations(name) VALUES ($1)", [file]);
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(`failed ${file}:`, e);
    process.exit(1);
  }
}

await client.end();
console.log("migrations done");
