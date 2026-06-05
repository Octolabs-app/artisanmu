import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.107.0";

type JsonValue = Record<string, unknown> | unknown[];

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

let adminClient: SupabaseClient | null = null;
let adminClientKey = "";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const adminPasswordHashFallback = "fe3ffd2d9a9aaced48c32c451afd6c81ca0a68beb6873dbcb3717755a0150bd9";

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function optionsResponse() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export function jsonResponse(data: JsonValue | Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

export function errorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return jsonResponse({ error: error.code, message: error.message }, error.status);
  }

  const message = error instanceof Error ? error.message : "Unexpected server error.";
  return jsonResponse({ error: "server_error", message }, 500);
}

export async function readJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError(400, "invalid_json", "The request body must be valid JSON.");
  }
}

export async function sha256Hex(value: string) {
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyAdminPassword(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(401, "missing_admin_password", "Admin password is required.");
  }

  const expectedHash =
    Deno.env.get("ADMIN_PASSWORD_HASH") ||
    Deno.env.get("NEXT_PUBLIC_ADMIN_PASSWORD_HASH") ||
    adminPasswordHashFallback;
  const candidateHash = await sha256Hex(value.trim());

  if (candidateHash !== expectedHash) {
    throw new HttpError(403, "admin_forbidden", "Admin password is invalid.");
  }
}

function parseSecretKeys() {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!raw) return "";

  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed.default || Object.values(parsed)[0] || "";
  } catch {
    return "";
  }
}

export function getAdminSupabase() {
  const url = Deno.env.get("SUPABASE_URL");
  const key =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    Deno.env.get("SUPABASE_SECRET_KEY") ||
    parseSecretKeys();

  if (!url || !key) {
    throw new HttpError(500, "missing_supabase_config", "Supabase service configuration is missing.");
  }

  const cacheKey = `${url}:${key.slice(0, 12)}`;
  if (!adminClient || adminClientKey !== cacheKey) {
    adminClient = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    adminClientKey = cacheKey;
  }

  return adminClient;
}

function contactSecret() {
  const secret =
    Deno.env.get("CONTACT_ENCRYPTION_KEY") ||
    Deno.env.get("CONTACT_HASH_SALT") ||
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    parseSecretKeys();

  if (!secret || secret.length < 16) {
    throw new HttpError(500, "missing_contact_secret", "Contact privacy configuration is missing.");
  }

  return secret;
}

function toBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function contactKey() {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(contactSecret()));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptPhone(value: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await contactKey(),
    encoder.encode(value),
  );

  return {
    encrypted: toBase64(new Uint8Array(encrypted)),
    iv: toBase64(iv),
  };
}

export async function decryptPhone(encrypted: string, iv: string) {
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(iv) },
    await contactKey(),
    fromBase64(encrypted),
  );

  return decoder.decode(decrypted);
}

export async function hashPhone(value: string) {
  const salt = Deno.env.get("CONTACT_HASH_SALT") || contactSecret();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(salt),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function normalizeMauritiusWhatsapp(value: unknown) {
  if (typeof value !== "string") {
    throw new HttpError(400, "missing_whatsapp", "A WhatsApp number is required.");
  }

  const digits = value.replace(/\D/g, "");
  const local = digits.startsWith("230") ? digits.slice(3) : digits;

  if (!/^[24579]\d{7}$/.test(local)) {
    throw new HttpError(400, "invalid_whatsapp", "Enter a valid Mauritius WhatsApp number.");
  }

  return `+230${local}`;
}

export function whatsappDeepLink(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function requireString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(400, `missing_${field}`, `${field} is required.`);
  }

  return value.trim();
}

export function customerDisplayName() {
  return `Client ${Math.floor(100 + Math.random() * 900)}`;
}

export const allowedUrgency = ["urgent", "planned"];
export const allowedTrades = [
  "Plumber",
  "Electrician",
  "Painter",
  "Carpenter",
  "Mason",
  "AC technician",
  "Locksmith",
  "Gardener",
  "Plombier",
  "Electricien",
  "Électricien",
  "Peintre",
  "Menuisier",
  "Macon",
  "Maçon",
  "Climatisation",
  "Serrurier",
  "Jardinier",
  "Other",
];

export const canonicalDistricts = [
  "Port Louis",
  "Pamplemousses",
  "Riviere du Rempart",
  "Flacq",
  "Grand Port",
  "Savanne",
  "Plaines Wilhems",
  "Moka",
  "Black River",
  "Rodrigues",
];

const districtAliases: Record<string, string[]> = {
  "Port Louis": ["Port Louis", "Port-Louis"],
  Pamplemousses: ["Pamplemousses"],
  "Riviere du Rempart": ["Riviere du Rempart", "Rivière du Rempart", "Grand Baie"],
  Flacq: ["Flacq"],
  "Grand Port": ["Grand Port", "Mahebourg", "Mahébourg"],
  Savanne: ["Savanne", "Souillac"],
  "Plaines Wilhems": [
    "Plaines Wilhems",
    "Plaine Wilhems",
    "Curepipe",
    "Quatre Bornes",
    "Rose Hill",
    "Vacoas",
    "Phoenix",
    "Beau Bassin",
  ],
  Moka: ["Moka"],
  "Black River": ["Black River", "Riviere Noire", "Rivière Noire"],
  Rodrigues: ["Rodrigues", "Port Mathurin"],
};

export const allowedDistricts = Array.from(
  new Set([...canonicalDistricts, ...Object.values(districtAliases).flat()]),
);

export const allowedServiceTags = [
  "Emergency repair",
  "Same-day service",
  "Leak repair",
  "No power",
  "AC service",
  "Installation",
  "Maintenance",
  "Renovation",
  "Inspection",
  "After-hours",
  "Weekend jobs",
  "Small jobs",
  "Commercial work",
  "Home repairs",
];

export function tradeAliases(trade: string) {
  const aliases: Record<string, string[]> = {
    Plumber: ["Plumber", "Plombier"],
    Plombier: ["Plumber", "Plombier"],
    Electrician: ["Electrician", "Electricien", "Électricien"],
    Electricien: ["Electrician", "Electricien", "Électricien"],
    "Électricien": ["Electrician", "Electricien", "Électricien"],
    Painter: ["Painter", "Peintre"],
    Peintre: ["Painter", "Peintre"],
    Carpenter: ["Carpenter", "Menuisier"],
    Menuisier: ["Carpenter", "Menuisier"],
    Mason: ["Mason", "Macon", "Maçon"],
    Macon: ["Mason", "Macon", "Maçon"],
    "Maçon": ["Mason", "Macon", "Maçon"],
    "AC technician": ["AC technician", "Climatisation", "Technicien clim", "Aircon"],
    Climatisation: ["AC technician", "Climatisation", "Technicien clim", "Aircon"],
    Locksmith: ["Locksmith", "Serrurier"],
    Serrurier: ["Locksmith", "Serrurier"],
    Gardener: ["Gardener", "Jardinier"],
    Jardinier: ["Gardener", "Jardinier"],
    Other: [],
  };

  return aliases[trade] || [trade];
}

function keyFor(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function canonicalDistrict(value: string) {
  const candidateKey = keyFor(value);
  for (const [district, aliases] of Object.entries(districtAliases)) {
    if (aliases.some((alias) => keyFor(alias) === candidateKey)) return district;
  }

  return value;
}

export function matchingDistricts(district: string) {
  const canonical = canonicalDistrict(district);
  return districtAliases[canonical] || [canonical];
}

export function normalizeServiceTags(value: unknown, requireOne = false) {
  const rawItems = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[\n,;]+/)
      : [];
  const allowedByKey = new Map(allowedServiceTags.map((tag) => [keyFor(tag), tag]));
  const tags = Array.from(
    new Set(
      rawItems
        .map((item) => String(item).trim().replace(/\s+/g, " "))
        .map((item) => allowedByKey.get(keyFor(item)) || item)
        .filter((item) => item.length >= 2 && item.length <= 34),
    ),
  ).slice(0, 8);

  if (requireOne && !tags.length) {
    throw new HttpError(400, "missing_service_tags", "Choose at least one service tag.");
  }

  return tags;
}

export function safePhotoPath(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const path = value.trim();
  if (!/^job-photos\/[a-f0-9-]{36}\/\d{13}-[\w.-]+$/i.test(path)) {
    throw new HttpError(400, "invalid_photo_path", "Photo upload path is invalid.");
  }
  return path;
}

export function storagePublicUrl(bucket: string, path: string) {
  const url = Deno.env.get("SUPABASE_URL");

  if (!url) {
    throw new HttpError(500, "missing_supabase_config", "Supabase service configuration is missing.");
  }

  return `${url.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${path
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/")}`;
}
