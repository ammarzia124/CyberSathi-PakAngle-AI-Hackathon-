import "dotenv/config";

const required = ["MONGODB_URI"];

const env = {
  PORT: parseInt(process.env.PORT, 10) || 3001,
  MONGODB_URI: process.env.MONGODB_URI,
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
