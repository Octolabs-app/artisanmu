import { createClient } from "@supabase/supabase-js";
import { mapSupabaseArtisan, publicArtisanSelect, type SupabaseArtisanProfile } from "./artisan-profile";
import type { Artisan } from "./types";

export async function getArtisans(): Promise<Artisan[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) return [];

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("artisans")
    .select(publicArtisanSelect)
    .eq("is_verified", true)
    .order("created_at", { ascending: false });

  if (error || !data?.length) return [];

  return (data as SupabaseArtisanProfile[]).map(mapSupabaseArtisan);
}
