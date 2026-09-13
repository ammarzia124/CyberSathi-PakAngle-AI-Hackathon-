import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://smnygafwwkiscugayuff.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.argv[2];

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Usage: node migrate.mjs <service-role-key>");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const sql = `
CREATE TABLE IF NOT EXISTS reports (
  id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  report_id               TEXT UNIQUE NOT NULL,
  input_type              TEXT NOT NULL CHECK (input_type IN ('url','message','screenshot','combined')),
  risk_score              INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  threat_level            TEXT NOT NULL CHECK (threat_level IN ('Low','Suspicious','High','Critical')),
  threat_type             TEXT NOT NULL,
  indicators              JSONB NOT NULL DEFAULT '[]',
  explanation             TEXT NOT NULL,
  recommended_actions     JSONB NOT NULL DEFAULT '[]',
  urls                    JSONB NOT NULL DEFAULT '[]',
  investigation_timeline  JSONB NOT NULL DEFAULT '[]',
  urdu_explanation        TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_threat_level ON reports (threat_level);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_report_id ON reports (report_id);
`;

async function migrate() {
  console.log("Creating reports table...");

  const { data, error } = await supabase.rpc("exec_sql", { query: sql });

  if (error) {
    console.error("RPC exec_sql failed:", error.message);
    console.log("\nPlease run this SQL manually in Supabase SQL Editor:");
    console.log(sql);
    process.exit(1);
  }

  console.log("Migration complete!");
}

migrate();
