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
