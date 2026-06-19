export const tradeOptions = [
  "Plumber",
  "Electrician",
  "Painter",
  "Carpenter",
  "Mason",
  "AC technician",
  "Locksmith",
  "Gardener",
  "Other",
];

export const districtOptions = [
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

export const serviceTagOptions = [
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

// Localized labels for the preset service tags (EN / FR / Morisien). The stored
// value stays the canonical English key; only the display label is translated.
// Custom tags an artisan types fall through unchanged.
export const serviceTagLabels: Record<string, { en: string; fr: string; mfe: string }> = {
  "Emergency repair": { en: "Emergency repair", fr: "Réparation d'urgence", mfe: "Reparasion irzan" },
  "Same-day service": { en: "Same-day service", fr: "Service le jour même", mfe: "Servis mem zour" },
  "Leak repair": { en: "Leak repair", fr: "Réparation de fuite", mfe: "Repar fwit" },
  "No power": { en: "No power", fr: "Panne de courant", mfe: "Pena kouran" },
  "AC service": { en: "AC service", fr: "Service climatisation", mfe: "Servis lerkondisyoner" },
  Installation: { en: "Installation", fr: "Installation", mfe: "Instalasion" },
  Maintenance: { en: "Maintenance", fr: "Entretien", mfe: "Antretien" },
  Renovation: { en: "Renovation", fr: "Rénovation", mfe: "Renovasion" },
  Inspection: { en: "Inspection", fr: "Inspection", mfe: "Inspeksion" },
  "After-hours": { en: "After-hours", fr: "Après les heures", mfe: "Apre ler travay" },
  "Weekend jobs": { en: "Weekend jobs", fr: "Travaux le week-end", mfe: "Travay wikenn" },
  "Small jobs": { en: "Small jobs", fr: "Petits travaux", mfe: "Ti travay" },
  "Commercial work": { en: "Commercial work", fr: "Travaux commerciaux", mfe: "Travay komersial" },
  "Home repairs": { en: "Home repairs", fr: "Réparations maison", mfe: "Reparasion lakaz" },
};

export function localizeTag(tag: string, language: "en" | "fr" | "mfe"): string {
  return serviceTagLabels[tag]?.[language] || tag;
}

const tradeAliases: Record<string, string[]> = {
  Plumber: ["Plumber", "Plombier"],
  Plombier: ["Plumber", "Plombier"],
  Electrician: ["Electrician", "Electricien", "Électricien"],
  Electricien: ["Electrician", "Electricien", "Électricien"],
  "Électricien": ["Electrician", "Electricien", "Électricien"],
  Painter: ["Painter", "Peintre"],
  Peintre: ["Painter", "Peintre"],
  Carpenter: ["Carpenter", "Menuisier"],
  Menuisier: ["Carpenter", "Menuisier"],
  Mason: ["Mason", "Macon", "Maçon", "Maconnerie", "Maçonnerie"],
  Macon: ["Mason", "Macon", "Maçon", "Maconnerie", "Maçonnerie"],
  "Maçon": ["Mason", "Macon", "Maçon", "Maconnerie", "Maçonnerie"],
  "AC technician": ["AC technician", "Climatisation", "Aircon", "AC"],
  Climatisation: ["AC technician", "Climatisation", "Aircon", "AC"],
  Locksmith: ["Locksmith", "Serrurier"],
  Serrurier: ["Locksmith", "Serrurier"],
  Gardener: ["Gardener", "Jardinier"],
  Jardinier: ["Gardener", "Jardinier"],
  Other: ["Other"],
};

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

export function tradeMatchesSelection(artisanTrade: string, selectedTrade: string) {
  if (!selectedTrade || selectedTrade === "All trades" || selectedTrade === "Tout metier") return true;
  const aliases = tradeAliases[selectedTrade] || [selectedTrade];
  return aliases.includes(artisanTrade);
}

export function districtMatchesSelection(artisanDistrict: string, selectedDistrict: string) {
  if (!selectedDistrict || selectedDistrict === "All districts" || selectedDistrict === "Toute l'ile") return true;
  const aliases = districtAliases[selectedDistrict] || [selectedDistrict];
  return aliases.includes(artisanDistrict);
}
