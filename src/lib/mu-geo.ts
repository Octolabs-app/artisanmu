// Static coordinates for Mauritius districts and common towns, so artisan and
// job locations can be pinned on a map without any geocoding service. Values
// are approximate centroids — location detail on the platform is town-level
// by design (exact addresses are never collected).

export type LatLng = { lat: number; lng: number };

export const districtCoords: Record<string, LatLng> = {
  "port louis": { lat: -20.1609, lng: 57.5012 },
  pamplemousses: { lat: -20.1039, lng: 57.5705 },
  "riviere du rempart": { lat: -20.056, lng: 57.6552 },
  flacq: { lat: -20.2042, lng: 57.7148 },
  "grand port": { lat: -20.385, lng: 57.671 },
  savanne: { lat: -20.4746, lng: 57.487 },
  "plaines wilhems": { lat: -20.308, lng: 57.485 },
  moka: { lat: -20.24, lng: 57.576 },
  "black river": { lat: -20.36, lng: 57.39 },
  rodrigues: { lat: -19.7245, lng: 63.4272 },
};

const townCoords: Record<string, LatLng> = {
  "port louis": { lat: -20.1609, lng: 57.5012 },
  curepipe: { lat: -20.3162, lng: 57.5166 },
  "quatre bornes": { lat: -20.2654, lng: 57.4791 },
  vacoas: { lat: -20.2984, lng: 57.4783 },
  phoenix: { lat: -20.2758, lng: 57.4896 },
  "rose hill": { lat: -20.2333, lng: 57.4667 },
  "beau bassin": { lat: -20.2231, lng: 57.468 },
  ebene: { lat: -20.2447, lng: 57.4864 },
  "grand baie": { lat: -20.0064, lng: 57.581 },
  "grande baie": { lat: -20.0064, lng: 57.581 },
  triolet: { lat: -20.0547, lng: 57.5457 },
  goodlands: { lat: -20.035, lng: 57.6428 },
  "centre de flacq": { lat: -20.1897, lng: 57.7143 },
  mahebourg: { lat: -20.4081, lng: 57.7 },
  "rose belle": { lat: -20.399, lng: 57.5959 },
  souillac: { lat: -20.5167, lng: 57.5167 },
  "chemin grenier": { lat: -20.4869, lng: 57.4657 },
  tamarin: { lat: -20.3256, lng: 57.3708 },
  "flic en flac": { lat: -20.2744, lng: 57.3631 },
  bambous: { lat: -20.2564, lng: 57.4048 },
  "saint pierre": { lat: -20.2189, lng: 57.5219 },
  "st pierre": { lat: -20.2189, lng: 57.5219 },
  pamplemousses: { lat: -20.1039, lng: 57.5705 },
  "terre rouge": { lat: -20.1392, lng: 57.5314 },
  "riviere du rempart": { lat: -20.0961, lng: 57.6864 },
  "grand gaube": { lat: -20.0064, lng: 57.6608 },
  "cap malheureux": { lat: -19.9842, lng: 57.6142 },
  "bel air": { lat: -20.2589, lng: 57.7469 },
  "quartier militaire": { lat: -20.2447, lng: 57.6417 },
  moka: { lat: -20.2333, lng: 57.5 },
  "baie du tombeau": { lat: -20.1147, lng: 57.5106 },
  "petite riviere": { lat: -20.1975, lng: 57.4344 },
  "grand bois": { lat: -20.4181, lng: 57.5444 },
  "riviere des anguilles": { lat: -20.4853, lng: 57.5497 },
  "bois cheri": { lat: -20.4272, lng: 57.5306 },
  "case noyale": { lat: -20.4342, lng: 57.3639 },
  "grande riviere noire": { lat: -20.3606, lng: 57.3661 },
  "le morne": { lat: -20.4547, lng: 57.3183 },
  "port mathurin": { lat: -19.6833, lng: 63.4167 },
  "pointe aux sables": { lat: -20.1667, lng: 57.4667 },
  "montagne blanche": { lat: -20.2894, lng: 57.6631 },
  lalmatie: { lat: -20.1908, lng: 57.6597 },
  "bon accueil": { lat: -20.1697, lng: 57.6531 },
  "plaine magnien": { lat: -20.4267, lng: 57.6653 },
  "new grove": { lat: -20.4106, lng: 57.6153 },
  "surinam": { lat: -20.5097, lng: 57.5028 },
  "albion": { lat: -20.2086, lng: 57.4058 },
  "pointe aux piments": { lat: -20.0642, lng: 57.5203 },
};

function normalizePlace(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[-']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Deterministic small offset so pins in the same town don't stack exactly. */
function jitter(seed: string): LatLng {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const a = ((hash & 0xffff) / 0xffff - 0.5) * 0.012;
  const b = (((hash >> 16) & 0x7fff) / 0x7fff - 0.5) * 0.012;
  return { lat: a, lng: b };
}

/**
 * Town first, district centroid as fallback. Returns null when neither is
 * known (the caller should just omit the pin).
 */
export function resolveCoords(town: string | null | undefined, district: string | null | undefined, seed = ""): LatLng | null {
  const base =
    (town && townCoords[normalizePlace(town)]) ||
    (district && districtCoords[normalizePlace(district)]) ||
    null;
  if (!base) return null;

  const offset = seed ? jitter(seed) : { lat: 0, lng: 0 };
  return { lat: base.lat + offset.lat, lng: base.lng + offset.lng };
}

/** Main-island default view (Rodrigues pins widen the bounds automatically). */
export const mauritiusCenter: LatLng = { lat: -20.25, lng: 57.55 };
