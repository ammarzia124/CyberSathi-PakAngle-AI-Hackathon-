import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://smnygafwwkiscugayuff.supabase.co";
const SUPABASE_KEY = process.argv[2];

if (!SUPABASE_KEY) {
  console.error("Usage: node create-table.mjs <service-role-key>");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createTable() {
  console.log("Checking if reports table exists...");

  const { data, error: checkError } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true });

  if (!checkError) {
    console.log("Table 'reports' already exists. Skipping creation.");
    return true;
  }

  if (checkError.code !== "PGRST205") {
    console.error("Unexpected error checking table:", checkError);
    return false;
  }

  console.log("Table does not exist. Attempting creation via pg module...");

  try {
    const pg = await import("pg");
    const { Client } = pg;

    const projectRef = "smnygafwwkiscugayuff";
    const dbUrl = `postgresql://postgres.${projectRef}:${encodeURIComponent(SUPABASE_KEY)}@aws-0-us-east-2.pooler.supabase.com:6543/postgres`;

    const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();

    const sql = `
      CREATE TABLE IF NOT EXISTS reports (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        report_id TEXT UNIQUE NOT NULL,
        input_type TEXT NOT NULL CHECK (input_type IN ('url','message','screenshot','combined')),
        risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
        threat_level TEXT NOT NULL CHECK (threat_level IN ('Low','Suspicious','High','Critical')),
        threat_type TEXT NOT NULL,
        indicators JSONB NOT NULL DEFAULT '[]',
        explanation TEXT NOT NULL,
        recommended_actions JSONB NOT NULL DEFAULT '[]',
        urls JSONB NOT NULL DEFAULT '[]',
        investigation_timeline JSONB NOT NULL DEFAULT '[]',
        urdu_explanation TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_reports_threat_level ON reports (threat_level);
      CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_reports_report_id ON reports (report_id);
    `;

    await client.query(sql);
    await client.end();
    console.log("Table created successfully!");
    return true;
  } catch (err) {
    console.error("Direct connection failed:", err.message);
    return false;
  }
}

const success = await createTable();
if (success) {
  const { data, error } = await supabase.from("reports").select("*", { count: "exact", head: true });
  console.log("Verification - count:", data?.length ?? 0, "error:", error?.message ?? "none");
}
process.exit(success ? 0 : 1);
