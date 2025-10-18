import { Client } from "pg"
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function setupDatabase() {
  console.log("[v0] Starting database setup...")

  const client = new Client({
    connectionString: process.env.SUPABASE_POSTGRES_URL,
  })

  try {
    await client.connect()
    console.log("[v0] Connected to database")

    // Read and execute SQL scripts in order
    const scripts = [
      "001_create_tables.sql",
      "002_enable_rls.sql",
      "003_create_storage.sql",
      "004_create_functions.sql",
    ]

    for (const scriptFile of scripts) {
      console.log(`[v0] Executing ${scriptFile}...`)
      const sqlPath = join(__dirname, scriptFile)
      const sql = readFileSync(sqlPath, "utf-8")

      await client.query(sql)
      console.log(`[v0] ✓ ${scriptFile} completed`)
    }

    console.log("[v0] Database setup completed successfully!")
  } catch (error) {
    console.error("[v0] Database setup failed:", error)
    throw error
  } finally {
    await client.end()
  }
}

setupDatabase()
