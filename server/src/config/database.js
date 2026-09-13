import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

export async function isSupabaseConnected() {
  try {
    const { error } = await supabase.from("reports").select("*", { count: "exact", head: true });
    return !error;
  } catch {
    return false;
  }
}
