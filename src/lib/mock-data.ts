import type { Artisan } from "./types";

export const trades = [
  "Plombier",
  "Electricien",
  "Macon",
  "Menuisier",
  "Climatisation",
  "Peintre",
  "Jardinier",
  "Serrurier",
];

export const districts = [
  "Port-Louis",
  "Plaines Wilhems",
  "Moka",
  "Grand Port",
  "Riviere du Rempart",
  "Flacq",
  "Savanne",
  "Black River",
  "Pamplemousses",
];

export const tradeImages: Record<string, string> = {
  Plombier:
    "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=900&q=80",
  Electricien:
    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=900&q=80",
  Climatisation:
    "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=900&q=80",
  Menuisier:
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=900&q=80",
  Macon:
    "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=80",
  Peintre:
    "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=900&q=80",
  Jardinier:
    "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=900&q=80",
  Serrurier:
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80",
  default:
    "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=80",
};

export const fallbackArtisans: Artisan[] = [
  {
    id: "1",
    name: "Ravi Choonum",
    trade: "Plombier",
    town: "Quatre Bornes",
    district: "Plaines Wilhems",
    rating: 4.8,
    reviews: 42,
    available: true,
    etaMinutes: 18,
    priceHint: "Quote in chat",
    verified: true,
    specialties: ["Fuites", "Chauffe-eau", "Urgence"],
    bio: "Intervention rapide pour petites reparations, installations et depannage maison.",
    phone: "58289431",
    image: tradeImages.Plombier,
  },
  {
    id: "2",
    name: "Asha Ramdin",
    trade: "Electricien",
    town: "Moka",
    district: "Moka",
    rating: 4.9,
    reviews: 31,
    available: true,
    etaMinutes: 24,
    priceHint: "Quote after brief",
    verified: true,
    specialties: ["Tableau", "Prises", "Diagnostic"],
    bio: "Electricite domestique, securisation et diagnostic avant travaux.",
    phone: "57123456",
    image: tradeImages.Electricien,
  },
  {
    id: "3",
    name: "Kevin Bissessur",
    trade: "Climatisation",
    town: "Grand Baie",
    district: "Riviere du Rempart",
    rating: 4.7,
    reviews: 28,
    available: false,
    etaMinutes: 55,
    priceHint: "Quote after brief",
    verified: true,
    specialties: ["Nettoyage", "Pose", "Maintenance"],
    bio: "Maintenance et installation de climatiseurs split pour maisons et commerces.",
    phone: "59001122",
    image: tradeImages.Climatisation,
  },
  {
    id: "4",
    name: "Nawaz Peerun",
    trade: "Menuisier",
    town: "Rose Hill",
    district: "Plaines Wilhems",
    rating: 4.6,
    reviews: 19,
    available: true,
    etaMinutes: 35,
    priceHint: "Quote in chat",
    verified: true,
    specialties: ["Placards", "Portes", "Cuisine"],
    bio: "Menuiserie sur mesure, reparations et finitions propres.",
    phone: "57667788",
    image: tradeImages.Menuisier,
  },
];
