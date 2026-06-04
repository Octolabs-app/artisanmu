import { HttpError, type PagesEnv } from "./http";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
let cachedKeySecret = "";
let cachedKeyPromise: Promise<CryptoKey> | null = null;

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function bytesToHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function contactSecret(env: PagesEnv) {
  const secret = env.CONTACT_ENCRYPTION_KEY || env.CONTACT_SECRET;
  if (!secret || secret.length < 16) {
    throw new HttpError(
      500,
      "missing_contact_secret",
      "Contact encryption secret must be configured.",
    );
  }
  return secret;
}

async function getAesKey(env: PagesEnv) {
  const secret = contactSecret(env);
  if (cachedKeyPromise && cachedKeySecret === secret) return cachedKeyPromise;

  cachedKeySecret = secret;
  cachedKeyPromise = crypto.subtle
    .importKey("raw", encoder.encode(secret), "PBKDF2", false, ["deriveKey"])
    .then((material) =>
      crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: encoder.encode("artisanmu-contact-v1"),
          iterations: 120000,
          hash: "SHA-256",
        },
        material,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"],
      ),
    );

  return cachedKeyPromise;
}

export function normalizeMauritiusWhatsapp(value: unknown) {
  const digits = String(value || "").replace(/\D/g, "");
  const local = digits.startsWith("230") ? digits.slice(3) : digits;

  if (!/^[24579]\d{7}$/.test(local)) {
    throw new HttpError(400, "invalid_whatsapp", "Use a valid Mauritius WhatsApp number.");
  }

  return `230${local}`;
}

export async function encryptPhone(env: PagesEnv, e164Phone: string) {
  const key = await getAesKey(env);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(e164Phone),
  );

  return {
    encrypted: bytesToBase64(new Uint8Array(encrypted)),
    iv: bytesToBase64(iv),
  };
}

export async function decryptPhone(env: PagesEnv, encrypted: string, iv: string) {
  const key = await getAesKey(env);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(iv) },
    key,
    base64ToBytes(encrypted),
  );

  return decoder.decode(decrypted);
}

export async function hashPhone(env: PagesEnv, e164Phone: string) {
  const salt = env.CONTACT_HASH_SALT || contactSecret(env);
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(`${salt}:${e164Phone}`));
  return bytesToHex(digest);
}

export function buildWhatsappDeepLink(e164Phone: string, trade: string, district: string) {
  const intro = encodeURIComponent(
    `Bonjour, mo finn aksepte ou demann ArtisanMU pou ${trade} dan ${district}.`,
  );
  return `https://wa.me/${e164Phone}?text=${intro}`;
}

export function customerDisplayName() {
  return "Client A.";
}
