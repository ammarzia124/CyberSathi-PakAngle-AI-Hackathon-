import "dotenv/config";

const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];

const env = {
  PORT: parseInt(process.env.PORT, 10) || 3001,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  NODE_ENV: process.env.NODE_ENV || "development",
};

for (const key of required) {
  if (!env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

if (env.NODE_ENV === "production" && !env.OPENAI_API_KEY) {
  console.warn("WARNING: OPENAI_API_KEY is not set. AI analysis will use fallback responses.");
}

export { env };
