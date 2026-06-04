import { createClient } from "@supabase/supabase-js";
import { tradeImages } from "./mock-data";
import type { Artisan } from "./types";

type SupabaseArtisan = {
  id: number;
  nom: string | null;
  metier: string | null;
  ville: string | null;
  district: string | null;
  tel: string | null;
  expertise: string | null;
  bio: string | null;
  note_total: number | null;
  nombre_avis: number | null;
  is_available_today: boolean | null;
  callout_fee: number | null;
  is_verified: boolean | null;
  avatar: string | null;
};

function mapArtisan(row: SupabaseArtisan): Artisan {
  const reviews = row.nombre_avis || 0;
  const rating = reviews > 0 ? (row.note_total || 0) / reviews : 4.6;

  return {
    id: String(row.id),
    name: row.nom || "Artisan",
    trade: row.metier || "Artisan",
    town: row.ville || "Maurice",
    district: row.district || "Maurice",
    rating: Number(rating.toFixed(1)),
    reviews,
    available: !!row.is_available_today,
    etaMinutes: row.is_available_today ? 22 : 50,
    priceHint: "Quote after brief",
    verified: !!row.is_verified,
    specialties: (row.expertise || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 3),
    bio: row.bio || "Profil verifie par ArtisanMu.",
    phone: row.tel || "",
    image:
      row.avatar && row.avatar.startsWith("http")
        ? row.avatar
        : tradeImages[row.metier || ""] || tradeImages.default,
  };
}

export async function getArtisans(): Promise<Artisan[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) return [];

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("artisans")
    .select(
      "id,nom,metier,ville,district,tel,expertise,bio,note_total,nombre_avis,is_available_today,callout_fee,is_verified,avatar",
    )
    .eq("is_verified", true)
    .order("created_at", { ascending: false });

  if (error || !data?.length) return [];

  return data.map(mapArtisan);
}
