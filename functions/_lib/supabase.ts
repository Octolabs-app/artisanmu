import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { HttpError, type PagesEnv } from "./http";

let serviceClient: SupabaseClient | null = null;
let serviceClientKey = "";

export function getServiceSupabase(env: PagesEnv) {
  const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new HttpError(
      500,
      "missing_supabase_config",
      "Supabase service configuration is missing.",
    );
  }

  const cacheKey = `${url}:${key.slice(0, 10)}`;
  if (!serviceClient || serviceClientKey !== cacheKey) {
    serviceClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    serviceClientKey = cacheKey;
  }

  return serviceClient;
}
