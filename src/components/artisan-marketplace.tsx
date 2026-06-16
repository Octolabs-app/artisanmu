"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  Clock,
  Globe2,
  Hammer,
  HardHat,
  HeartHandshake,
  Images,
  KeyRound,
  Leaf,
  LogIn,
  MapPin,
  MapPinned,
  MessageCircle,
  Navigation,
  PaintRoller,
  PhoneCall,
  PlugZap,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Snowflake,
  Sparkles,
  Star,
  UserCheck,
  Wallet,
  Wrench,
} from "lucide-react";
import { ArtisanMuLogo } from "@/components/artisanmu-logo";
import { JobRequestForm } from "@/components/JobRequestForm";
import {
  mapSupabaseArtisan,
  publicArtisanSelect,
  type SupabaseArtisanProfile,
} from "@/lib/artisan-profile";
import { districts, trades } from "@/lib/mock-data";
import { districtMatchesSelection, serviceTagOptions, tradeMatchesSelection } from "@/lib/service-options";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import type { Artisan } from "@/lib/types";

type ArtisanMarketplaceProps = {
  artisans: Artisan[];
};

const allTradesLabel = "All trades";
const allDistrictsLabel = "All districts";
const allTagsLabel = "All tags";

const marketplaceCopy = {
  en: {
    nav: { postJob: "Post a job", login: "Login", artisan: "Artisan access" },
    hero: {
      location: "Made in Mauritius",
      eyebrow: "Same-day matching across the island",
      headlineLead: "Get it fixed by a",
      headlineEm: "trusted local pro",
      headlineTail: ".",
      support:
        "Tell us what broke, get matched with verified artisans near you, then chat and book on WhatsApp — no more calling around.",
      ctaPrimary: "Post a job — get matched on WhatsApp",
      ctaSecondary: "How it works",
      chips: ["Verified pros", "WhatsApp-ready", "EN / FR / Morisien", "Same-day"],
      visualBadge: "Verified",
      visualCaption: "Trusted trades, one tap away",
    },
    how: {
      title: "How ArtisanMU works",
      subtitle: "Three simple steps, no phone tag.",
      steps: [
        { title: "Describe the job", desc: "A sentence or two and a photo — that's all we need to start." },
        { title: "Get matched with verified pros", desc: "We notify artisans near you who do exactly that kind of work." },
        { title: "Chat & book on WhatsApp", desc: "Talk directly, agree a time, and get it done — all on WhatsApp." },
      ],
    },
    tradesSection: {
      title: "Popular trades",
      subtitle: "Tap a trade to start a request in seconds.",
    },
    request: {
      eyebrow: "Start here",
      title: "Tell us what you need",
      subtitle: "Post your job once and let verified artisans come to you on WhatsApp. Free to post.",
    },
    why: {
      title: "Why ArtisanMU",
      items: [
        { title: "Verified artisans", desc: "Every pro is identity-checked before they can be matched." },
        { title: "Local to Mauritius", desc: "Built for the island — districts, trades and WhatsApp habits we all know." },
        { title: "No more calling around", desc: "One clean request reaches the right artisans for you." },
        { title: "Free to post", desc: "Posting a job costs nothing. You only deal with pros you choose." },
      ],
    },
    browse: {
      eyebrow: "Browse artisans",
      title: "Verified artisans",
      subtitle: "Filter by trade, area and service. Verified profiles appear first.",
      filters: "Filters",
      quickTitle: "Quick starts",
      filterAction: "Filter results",
      resetAction: "Reset",
      searchPlaceholder: "Leak, wiring, AC, cabinet...",
      fastFirst: "Fast first",
      readyHeading: (n: number) => `${n} ${n === 1 ? "artisan" : "artisans"} ready`,
      sortedEta: "Sorted by ETA",
      verifiedFirst: "Verified first",
      availableNow: (n: number) => `${n} available now`,
      onboarding: "We're onboarding verified artisans across Mauritius",
      fastestEta: (n: number) => `${n} min fastest ETA`,
      etaSoon: "ETA appears when matches are live",
      reviewAfter: "Review your artisan after the job",
      allVerified: "All verified artisans",
      emptyTitle: "Verified artisans are coming online",
      emptyCopy:
        "We're onboarding trusted pros across the island. Post your job now and you'll be matched the moment one comes online.",
      emptyCta: "Post your job",
      view: "View",
      selected: "Selected",
      available: "Available",
      later: "Later today",
      verified: "Verified",
      portfolio: "Portfolio",
      portfolioEmpty: "Portfolio photos will appear here after this artisan uploads verified work.",
      reviews: "Reviews",
      reviewsCount: (n: number) =>
        n
          ? `${n} public reviews recorded. Detailed comments appear once review storage is connected.`
          : "No public reviews yet.",
      availability: "Availability",
      availableToday: (n: number) => `Available today. Estimated response: ${n} min.`,
      notAvailable: "Not marked available right now. You can still prepare a request for later.",
      selectHint: "Send a WhatsApp-ready brief directly to this artisan.",
      whatsapp: "WhatsApp contact",
    },
    faq: {
      title: "Good to know",
      items: [
        { q: "Is it free to post a job?", a: "Yes. Posting a job on ArtisanMU is completely free. You only arrange payment directly with the artisan you choose." },
        { q: "How do artisans reach me?", a: "Your WhatsApp number stays protected. Matched artisans contact you through the app or a protected link once they accept your job." },
        { q: "Are the artisans verified?", a: "Every artisan is identity-checked before they can be matched to a job, and verified profiles are clearly badged." },
        { q: "Which areas do you cover?", a: "All of Mauritius — every district from Port Louis to Rodrigues. Pick the closest area when you post." },
        { q: "What if no one is online yet?", a: "We're still onboarding artisans in some areas. Post your job anyway and we'll match you as soon as a verified pro comes online." },
      ],
    },
    footer: {
      tagline: "Trusted local artisans for every Mauritian home.",
      cols: { product: "Product", company: "Company" },
      links: { post: "Post a job", browse: "Browse artisans", artisan: "Become an artisan", login: "Login" },
      contact: "Contact",
      builtFor: "Built for local service discovery",
    },
    bottomNav: { browse: "Browse", request: "Post job", artisan: "Artisan", login: "Login" },
  },
  fr: {
    nav: { postJob: "Poster un travail", login: "Connexion", artisan: "Espace artisan" },
    hero: {
      location: "Fait a Maurice",
      eyebrow: "Mise en relation le jour meme partout sur l'ile",
      headlineLead: "Faites reparer par un",
      headlineEm: "artisan local de confiance",
      headlineTail: ".",
      support:
        "Dites-nous ce qui ne va pas, soyez mis en relation avec des artisans verifies pres de chez vous, puis discutez et reservez sur WhatsApp.",
      ctaPrimary: "Poster un travail — mise en relation sur WhatsApp",
      ctaSecondary: "Comment ca marche",
      chips: ["Artisans verifies", "Pret pour WhatsApp", "EN / FR / Morisien", "Le jour meme"],
      visualBadge: "Verifie",
      visualCaption: "Des artisans de confiance, en un clic",
    },
    how: {
      title: "Comment fonctionne ArtisanMU",
      subtitle: "Trois etapes simples, sans courir apres le telephone.",
      steps: [
        { title: "Decrivez le travail", desc: "Une ou deux phrases et une photo — c'est tout ce qu'il faut." },
        { title: "Mise en relation avec des pros verifies", desc: "Nous prevenons les artisans proches qui font exactement ce travail." },
        { title: "Discutez et reservez sur WhatsApp", desc: "Parlez directement, fixez un rendez-vous et c'est regle." },
      ],
    },
    tradesSection: {
      title: "Metiers populaires",
      subtitle: "Touchez un metier pour lancer une demande en quelques secondes.",
    },
    request: {
      eyebrow: "Commencez ici",
      title: "Dites-nous ce dont vous avez besoin",
      subtitle: "Postez votre travail une fois et laissez les artisans verifies venir a vous sur WhatsApp. Gratuit.",
    },
    why: {
      title: "Pourquoi ArtisanMU",
      items: [
        { title: "Artisans verifies", desc: "Chaque pro est verifie avant d'etre propose." },
        { title: "Local a Maurice", desc: "Pense pour l'ile — districts, metiers et habitudes WhatsApp que l'on connait." },
        { title: "Fini les appels en boucle", desc: "Une seule demande claire atteint les bons artisans." },
        { title: "Gratuit a poster", desc: "Poster un travail ne coute rien. Vous choisissez les pros." },
      ],
    },
    browse: {
      eyebrow: "Parcourir les artisans",
      title: "Artisans verifies",
      subtitle: "Filtrez par metier, region et service. Les profils verifies apparaissent en premier.",
      filters: "Filtres",
      quickTitle: "Departs rapides",
      filterAction: "Filtrer",
      resetAction: "Reinitialiser",
      searchPlaceholder: "Fuite, electricite, clim, meuble...",
      fastFirst: "Plus rapides",
      readyHeading: (n: number) => `${n} ${n === 1 ? "artisan pret" : "artisans prets"}`,
      sortedEta: "Tries par delai",
      verifiedFirst: "Verifies en premier",
      availableNow: (n: number) => `${n} disponibles`,
      onboarding: "Nous integrons des artisans verifies partout a Maurice",
      fastestEta: (n: number) => `${n} min de delai le plus court`,
      etaSoon: "Le delai s'affiche des qu'il y a des correspondances",
      reviewAfter: "Notez votre artisan apres le travail",
      allVerified: "Tous les artisans verifies",
      emptyTitle: "Les artisans verifies arrivent",
      emptyCopy:
        "Nous integrons des pros de confiance partout sur l'ile. Postez votre travail maintenant et soyez mis en relation des qu'un artisan est en ligne.",
      emptyCta: "Poster votre travail",
      view: "Voir",
      selected: "Selectionne",
      available: "Disponible",
      later: "Plus tard",
      verified: "Verifie",
      portfolio: "Portfolio",
      portfolioEmpty: "Les photos apparaitront ici une fois que l'artisan aura ajoute ses travaux verifies.",
      reviews: "Avis",
      reviewsCount: (n: number) =>
        n
          ? `${n} avis publics enregistres. Les commentaires detailles s'afficheront bientot.`
          : "Pas encore d'avis publics.",
      availability: "Disponibilite",
      availableToday: (n: number) => `Disponible aujourd'hui. Reponse estimee : ${n} min.`,
      notAvailable: "Pas disponible pour le moment. Vous pouvez quand meme preparer une demande.",
      selectHint: "Envoyez une demande prete pour WhatsApp directement a cet artisan.",
      whatsapp: "Contacter sur WhatsApp",
    },
    faq: {
      title: "Bon a savoir",
      items: [
        { q: "Est-ce gratuit de poster un travail ?", a: "Oui. Poster un travail sur ArtisanMU est totalement gratuit. Vous reglez le paiement directement avec l'artisan choisi." },
        { q: "Comment les artisans me contactent ?", a: "Votre numero WhatsApp reste protege. Les artisans vous contactent via l'app ou un lien protege une fois qu'ils acceptent." },
        { q: "Les artisans sont-ils verifies ?", a: "Chaque artisan est verifie avant d'etre propose, et les profils verifies sont clairement identifies." },
        { q: "Quelles regions couvrez-vous ?", a: "Tout Maurice — chaque district, de Port-Louis a Rodrigues. Choisissez la region la plus proche." },
        { q: "Et si personne n'est en ligne ?", a: "Nous integrons encore des artisans dans certaines regions. Postez quand meme et nous vous mettrons en relation des qu'un pro est en ligne." },
      ],
    },
    footer: {
      tagline: "Des artisans locaux de confiance pour chaque foyer mauricien.",
      cols: { product: "Produit", company: "Entreprise" },
      links: { post: "Poster un travail", browse: "Parcourir les artisans", artisan: "Devenir artisan", login: "Connexion" },
      contact: "Contact",
      builtFor: "Concu pour la recherche de services locaux",
    },
    bottomNav: { browse: "Artisans", request: "Poster", artisan: "Artisan", login: "Connexion" },
  },
  mfe: {
    nav: { postJob: "Poste enn travay", login: "Konekte", artisan: "Espas artizan" },
    hero: {
      location: "Fer dan Moris",
      eyebrow: "Gagn enn artizan zordi mem partou dan lil",
      headlineLead: "Fer repare par enn",
      headlineEm: "artizan lokal serye",
      headlineTail: ".",
      support:
        "Dir nou ki finn kase, nou met ou an kontak ar bann artizan verifye pre kot ou, apre koz ek rezerv lor WhatsApp.",
      ctaPrimary: "Poste enn travay — kontak lor WhatsApp",
      ctaSecondary: "Kouma sa marse",
      chips: ["Artizan verifye", "Pare pou WhatsApp", "EN / FR / Morisien", "Zordi mem"],
      visualBadge: "Verifye",
      visualCaption: "Bann artizan serye, enn tap lwin",
    },
    how: {
      title: "Kouma ArtisanMU marse",
      subtitle: "Trwa step fasil, pa bizin galoup deryer telefonn.",
      steps: [
        { title: "Dekrir travay-la", desc: "Enn-de fraz ek enn foto — samem tou seki bizin." },
        { title: "Gagn bann pro verifye", desc: "Nou averti bann artizan pre kot ou ki fer sa kalite travay-la." },
        { title: "Koz ek rezerv lor WhatsApp", desc: "Koz direk, fixe enn ler, ek travay fini." },
      ],
    },
    tradesSection: {
      title: "Metie popiler",
      subtitle: "Tap enn metie pou koumans enn demann dan de segonn.",
    },
    request: {
      eyebrow: "Koumans isi",
      title: "Dir nou ki ou bizin",
      subtitle: "Poste ou travay enn sel fwa ek les bann artizan verifye vinn get ou lor WhatsApp. Gratis.",
    },
    why: {
      title: "Kifer ArtisanMU",
      items: [
        { title: "Artizan verifye", desc: "Sak pro verifye avan ki li kapav gagn enn travay." },
        { title: "Lokal pou Moris", desc: "Fer pou lil — distrik, metie ek labitid WhatsApp ki nou tou konn." },
        { title: "Nepli bizin telefonn partou", desc: "Enn sel demann prop ariv kot bann bon artizan." },
        { title: "Gratis pou poste", desc: "Poste enn travay pa kout nanye. Ou swazir bann pro." },
      ],
    },
    browse: {
      eyebrow: "Get bann artizan",
      title: "Artizan verifye",
      subtitle: "Filtre par metie, landrwa ek servis. Bann profil verifye paret avan.",
      filters: "Filtre",
      quickTitle: "Koumans vit",
      filterAction: "Filtre rezilta",
      resetAction: "Reset",
      searchPlaceholder: "Fuit, kouran, klim, plakar...",
      fastFirst: "Pli vit avan",
      readyHeading: (n: number) => `${n} artizan pare`,
      sortedEta: "Trie par dele",
      verifiedFirst: "Verifye avan",
      availableNow: (n: number) => `${n} disponib la`,
      onboarding: "Nou pe azout bann artizan verifye partou dan Moris",
      fastestEta: (n: number) => `${n} min dele pli kourt`,
      etaSoon: "Dele paret kan ena bann korespondans",
      reviewAfter: "Note ou artizan apre travay",
      allVerified: "Tou bann artizan verifye",
      emptyTitle: "Bann artizan verifye pe vini",
      emptyCopy:
        "Nou pe azout bann pro serye partou dan lil. Poste ou travay aster ek nou pou met ou an kontak deswit ki enn pro verifye an liyn.",
      emptyCta: "Poste ou travay",
      view: "Get",
      selected: "Swazir",
      available: "Disponib",
      later: "Plitar",
      verified: "Verifye",
      portfolio: "Portfolio",
      portfolioEmpty: "Bann foto pou paret isi kan artizan-la inn azout so travay verifye.",
      reviews: "Komanter",
      reviewsCount: (n: number) =>
        n
          ? `${n} komanter piblik. Bann detay pou paret biento.`
          : "Pena komanter piblik ankor.",
      availability: "Disponibilite",
      availableToday: (n: number) => `Disponib zordi. Repons estime: ${n} min.`,
      notAvailable: "Pa disponib la. Ou kapav prepar enn demann pou plitar.",
      selectHint: "Avoy enn demann pare pou WhatsApp direk ar sa artizan-la.",
      whatsapp: "Kontak lor WhatsApp",
    },
    faq: {
      title: "Bon pou kone",
      items: [
        { q: "Eski gratis pou poste enn travay?", a: "Wi. Poste enn travay lor ArtisanMU net gratis. Ou aranz peyman direk ar artizan ki ou swazir." },
        { q: "Kouma bann artizan kontak mwa?", a: "Ou nimero WhatsApp res protze. Bann artizan kontak ou via lapp ou enn lien protze enn fwa ki zot aksepte." },
        { q: "Eski bann artizan verifye?", a: "Sak artizan verifye avan ki li kapav gagn enn travay, ek bann profil verifye ena enn badz kler." },
        { q: "Ki landrwa zot kouver?", a: "Tou Moris — sak distrik, depi Port-Louis ziska Rodrig. Swazir landrwa pli pre kan ou poste." },
        { q: "Ki arive si personn pa an liyn?", a: "Nou ankor pe azout bann artizan dan sertin landrwa. Poste kanmem ek nou pou met ou an kontak deswit ki enn pro an liyn." },
      ],
    },
    footer: {
      tagline: "Bann artizan lokal serye pou sak lakaz Morisien.",
      cols: { product: "Prodwi", company: "Konpani" },
      links: { post: "Poste enn travay", browse: "Get bann artizan", artisan: "Vinn enn artizan", login: "Konekte" },
      contact: "Kontak",
      builtFor: "Fer pou trouv servis lokal",
    },
    bottomNav: { browse: "Artizan", request: "Poste", artisan: "Artizan", login: "Konekte" },
  },
};

type Language = keyof typeof marketplaceCopy;

const popularTrades: { value: string; icon: typeof Wrench; labels: Record<Language, string> }[] = [
  { value: "Plumber", icon: Wrench, labels: { en: "Plumber", fr: "Plombier", mfe: "Plonbie" } },
  { value: "Electrician", icon: PlugZap, labels: { en: "Electrician", fr: "Electricien", mfe: "Elektrisien" } },
  { value: "Painter", icon: PaintRoller, labels: { en: "Painter", fr: "Peintre", mfe: "Pintur" } },
  { value: "Carpenter", icon: Hammer, labels: { en: "Carpenter", fr: "Menuisier", mfe: "Menwizie" } },
  { value: "Mason", icon: HardHat, labels: { en: "Mason", fr: "Macon", mfe: "Mason" } },
  { value: "AC technician", icon: Snowflake, labels: { en: "AC technician", fr: "Climatisation", mfe: "Klimatizasion" } },
  { value: "Locksmith", icon: KeyRound, labels: { en: "Locksmith", fr: "Serrurier", mfe: "Serurie" } },
  { value: "Gardener", icon: Leaf, labels: { en: "Gardener", fr: "Jardinier", mfe: "Zardinie" } },
];

const tradeAliases: Record<string, string[]> = {
  Plumber: ["plumber", "plombier", "leak", "fuite", "water", "pipe", "sink", "drain", "robinet"],
  Plombier: ["leak", "fuite", "water", "pipe", "sink", "drain", "robinet"],
  Electrician: ["electrician", "electricien", "wiring", "electric", "power", "light", "prise", "breaker", "circuit"],
  Electricien: ["wiring", "electric", "power", "light", "prise", "breaker", "circuit"],
  Mason: ["mason", "macon", "wall", "concrete", "block", "tiles", "renovation", "repair"],
  Macon: ["wall", "concrete", "block", "tiles", "renovation", "repair"],
  Carpenter: ["carpenter", "menuisier", "cabinet", "cupboard", "door", "wood", "kitchen", "shelf"],
  Menuisier: ["cabinet", "cupboard", "door", "wood", "kitchen", "shelf"],
  "AC technician": ["ac", "aircon", "clim", "split", "cooling", "maintenance"],
  Climatisation: ["ac", "aircon", "clim", "split", "cooling", "maintenance"],
  Painter: ["painter", "peintre", "paint", "painting", "repaint", "wall finish", "color"],
  Peintre: ["paint", "painting", "repaint", "wall finish", "color"],
  Gardener: ["gardener", "jardinier", "garden", "grass", "yard", "tree", "plants", "trim"],
  Jardinier: ["garden", "grass", "yard", "tree", "plants", "trim"],
  Locksmith: ["locksmith", "serrurier", "lock", "key", "door lock", "locked", "security"],
  Serrurier: ["lock", "key", "door lock", "locked", "security"],
};

const quickFilters = [
  { label: "Pipe leak", query: "leak", trade: "Plumber", tag: "Leak repair" },
  { label: "No power", query: "wiring", trade: "Electrician", tag: "No power" },
  { label: "Emergency repair", query: "urgent repair", trade: allTradesLabel, tag: "Emergency repair" },
  { label: "AC service", query: "ac service", trade: "AC technician", tag: "AC service" },
  { label: "Door lock", query: "door lock", trade: "Locksmith", tag: allTagsLabel },
  { label: "Paint room", query: "paint", trade: "Painter", tag: "Renovation" },
];

function buildWhatsAppLink(artisan: Artisan | null, note: string, clientPhone: string) {
  if (!artisan?.phone) return "#";

  const cleaned = artisan.phone.replace(/\D/g, "");
  const phoneNumber = cleaned.startsWith("230") ? cleaned : `230${cleaned}`;
  const message = encodeURIComponent(
    `Bonjour ${artisan.name}, je vous contacte via ArtisanMu. ${note || "J'ai un travail a faire."} Mon numero: ${clientPhone || ""}`,
  );

  return `https://wa.me/${phoneNumber}?text=${message}`;
}

function scoreArtisan(
  artisan: Artisan,
  selectedTrade: string,
  selectedDistrict: string,
  urgent: boolean,
) {
  let score = artisan.rating * 10 + artisan.reviews / 8 - artisan.etaMinutes / 3;

  if (artisan.available) score += urgent ? 44 : 16;
  if (artisan.verified) score += 12;
  if (selectedTrade !== allTradesLabel && tradeMatchesSelection(artisan.trade, selectedTrade)) score += 26;
  if (selectedDistrict !== allDistrictsLabel && districtMatchesSelection(artisan.district, selectedDistrict)) score += 18;

  return score;
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function ArtisanMarketplace({ artisans }: ArtisanMarketplaceProps) {
  const [refreshedArtisans, setRefreshedArtisans] = useState<Artisan[] | null>(null);
  const [query, setQuery] = useState("");
  const [selectedTrade, setSelectedTrade] = useState(allTradesLabel);
  const [selectedDistrict, setSelectedDistrict] = useState(allDistrictsLabel);
  const [selectedTag, setSelectedTag] = useState(allTagsLabel);
  const [urgent, setUrgent] = useState(true);
  const [selectedArtisanId, setSelectedArtisanId] = useState(artisans[0]?.id || "");
  const [expandedArtisanId, setExpandedArtisanId] = useState("");
  const [language, setLanguage] = useState<Language>("en");
  const [requestTrade, setRequestTrade] = useState<string | undefined>(undefined);
  const [prefillSignal, setPrefillSignal] = useState(0);
  const [openFaq, setOpenFaq] = useState(0);
  const copy = marketplaceCopy[language];
  const jobNote = "";
  const clientPhone = "";
  const displayArtisans = refreshedArtisans || artisans;

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) return;
    const client = supabase;

    let cancelled = false;

    async function loadLiveArtisans() {
      const { data, error } = await client
        .from("artisans")
        .select(publicArtisanSelect)
        .eq("is_verified", true)
        .eq("verification_status", "approved")
        .order("created_at", { ascending: false });

      if (!cancelled && !error && data) {
        setRefreshedArtisans((data as SupabaseArtisanProfile[]).map(mapSupabaseArtisan));
      }
    }

    void loadLiveArtisans();
    const interval = window.setInterval(loadLiveArtisans, 15000);
    const onFocus = () => void loadLiveArtisans();
    window.addEventListener("focus", onFocus);
    const channel = client
      .channel("public-approved-artisans")
      .on("postgres_changes", { event: "*", schema: "public", table: "artisans" }, () => {
        void loadLiveArtisans();
      })
      .subscribe();

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      void client.removeChannel(channel);
    };
  }, []);

  const filteredArtisans = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...displayArtisans]
      .filter((artisan) => {
        const searchText = [
          artisan.name,
          artisan.trade,
          artisan.town,
          artisan.district,
          artisan.bio,
          ...(tradeAliases[artisan.trade] || []),
          ...artisan.specialties,
          ...artisan.serviceTags,
        ]
          .join(" ")
          .toLowerCase();

        const matchesQuery = !normalizedQuery || searchText.includes(normalizedQuery);
        const matchesTrade =
          selectedTrade === allTradesLabel || tradeMatchesSelection(artisan.trade, selectedTrade);
        const matchesDistrict =
          selectedDistrict === allDistrictsLabel || districtMatchesSelection(artisan.district, selectedDistrict);
        const matchesTag =
          selectedTag === allTagsLabel || artisan.serviceTags.includes(selectedTag);

        return matchesQuery && matchesTrade && matchesDistrict && matchesTag;
      })
      .sort(
        (a, b) =>
          scoreArtisan(b, selectedTrade, selectedDistrict, urgent) -
          scoreArtisan(a, selectedTrade, selectedDistrict, urgent),
      );
  }, [displayArtisans, query, selectedDistrict, selectedTag, selectedTrade, urgent]);

  const selectedArtisan =
    filteredArtisans.find((artisan) => artisan.id === selectedArtisanId) ||
    filteredArtisans[0] ||
    null;

  const availableCount = filteredArtisans.filter((artisan) => artisan.available).length;
  const fastestEta = filteredArtisans.length
    ? Math.min(...filteredArtisans.map((artisan) => artisan.etaMinutes))
    : 0;
  const activeFilterCount =
    (query.trim() ? 1 : 0) +
    (selectedTrade !== allTradesLabel ? 1 : 0) +
    (selectedDistrict !== allDistrictsLabel ? 1 : 0) +
    (selectedTag !== allTagsLabel ? 1 : 0);
  const filterSummary = activeFilterCount
    ? [
        query.trim() ? `"${query.trim()}"` : "",
        selectedTrade !== allTradesLabel ? selectedTrade : "",
        selectedDistrict !== allDistrictsLabel ? selectedDistrict : "",
        selectedTag !== allTagsLabel ? selectedTag : "",
      ]
        .filter(Boolean)
        .join(" - ")
    : copy.browse.allVerified;

  function toggleArtisanCard(artisanId: string) {
    setSelectedArtisanId(artisanId);
    setExpandedArtisanId((current) => (current === artisanId ? "" : artisanId));
  }

  function applyQuickFilter(preset: (typeof quickFilters)[number]) {
    setQuery(preset.query);
    setSelectedTrade(preset.trade);
    setSelectedDistrict(allDistrictsLabel);
    setSelectedTag(preset.tag);
    setUrgent(true);
    setExpandedArtisanId("");
    scrollToId("browse");
  }

  function resetFilters() {
    setQuery("");
    setSelectedTrade(allTradesLabel);
    setSelectedDistrict(allDistrictsLabel);
    setSelectedTag(allTagsLabel);
    setUrgent(true);
    setExpandedArtisanId("");
    setSelectedArtisanId(displayArtisans[0]?.id || "");
  }

  function applyFilters() {
    setExpandedArtisanId("");
    scrollToId("browse");
  }

  function startRequestWithTrade(trade: string) {
    setRequestTrade(trade);
    setPrefillSignal((value) => value + 1);
    scrollToId("request");
  }

  const howIcons = [Sparkles, BadgeCheck, MessageCircle];
  const whyIcons = [ShieldCheck, MapPinned, PhoneCall, Wallet];

  return (
    <main id="top" className="min-h-screen pb-20 text-[#16201b] sm:pb-0">
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-30 border-b border-[#e3ddd1] bg-[#f7f4ee]/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="#top" className="rounded-lg">
            <ArtisanMuLogo subtitle="Mauritius home services" />
          </Link>

          <nav className="flex items-center gap-2">
            <label className="hidden h-10 items-center gap-2 rounded-xl border border-[#e3ddd1] bg-white px-2.5 text-sm text-[#0d1612] shadow-sm md:flex">
              <Globe2 className="size-4 text-[#0d8b66]" aria-hidden="true" />
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as Language)}
                className="bg-transparent text-sm font-medium outline-none"
                aria-label="Language"
              >
                <option value="en">EN</option>
                <option value="fr">FR</option>
                <option value="mfe">Morisien</option>
              </select>
            </label>
            <Link
              href="/login"
              className="hidden h-10 items-center gap-2 rounded-xl border border-[#e3ddd1] bg-white px-3 text-sm font-medium text-[#0d1612] shadow-sm transition hover:border-[#0d8b66] sm:flex"
            >
              <LogIn className="size-4" aria-hidden="true" />
              {copy.nav.login}
            </Link>
            <Link
              href="/artisan"
              className="hidden h-10 items-center gap-2 rounded-xl border border-[#e3ddd1] bg-white px-3 text-sm font-medium text-[#0d1612] shadow-sm transition hover:border-[#0d8b66] lg:flex"
            >
              <UserCheck className="size-4" aria-hidden="true" />
              {copy.nav.artisan}
            </Link>
            <button type="button" onClick={() => scrollToId("request")} className="btn btn-primary h-10 px-4 text-sm">
              <MessageCircle className="size-4" aria-hidden="true" />
              <span>{copy.nav.postJob}</span>
            </button>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b border-[#e3ddd1]">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(60% 60% at 85% 10%, rgba(13,139,102,0.10), transparent 60%), radial-gradient(50% 50% at 5% 0%, rgba(199,155,85,0.12), transparent 55%)",
          }}
          aria-hidden="true"
        />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:py-16">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#0d8b66]/25 bg-[#e7f5ef] px-3 py-1.5 text-xs font-semibold text-[#0a5e46]">
              <MapPinned className="size-3.5" aria-hidden="true" />
              {copy.hero.location}
            </span>
            <p className="mt-5 text-sm font-semibold uppercase tracking-wide text-[#0d8b66]">{copy.hero.eyebrow}</p>
            <h1 className="font-display mt-2 max-w-2xl text-4xl leading-[1.05] text-[#101410] sm:text-5xl lg:text-6xl">
              {copy.hero.headlineLead} <span className="text-[#0d8b66]">{copy.hero.headlineEm}</span>
              {copy.hero.headlineTail}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[#5d6863]">{copy.hero.support}</p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button type="button" onClick={() => scrollToId("request")} className="btn btn-primary text-base">
                <MessageCircle className="size-5" aria-hidden="true" />
                {copy.hero.ctaPrimary}
              </button>
              <button type="button" onClick={() => scrollToId("how")} className="btn btn-secondary text-base">
                {copy.hero.ctaSecondary}
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>

            <ul className="mt-7 flex flex-wrap gap-2">
              {copy.hero.chips.map((chip, index) => {
                const ChipIcon = [ShieldCheck, MessageCircle, Globe2, Clock][index] || Sparkles;
                return (
                  <li
                    key={chip}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#e3ddd1] bg-white/80 px-3 py-1.5 text-sm font-medium text-[#4d5651]"
                  >
                    <ChipIcon className="size-4 text-[#0d8b66]" aria-hidden="true" />
                    {chip}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Original illustrative visual: floating trade tiles (no stock imagery) */}
          <div className="relative mx-auto hidden w-full max-w-md lg:block" aria-hidden="true">
            <div
              className="absolute inset-0 -z-10 rounded-[2.5rem]"
              style={{ background: "linear-gradient(135deg, #0d1612 0%, #114a39 60%, #0d8b66 100%)" }}
            />
            <div className="rounded-[2.5rem] p-7">
              <div className="grid grid-cols-2 gap-4">
                {popularTrades.slice(0, 6).map((trade, index) => {
                  const TileIcon = trade.icon;
                  const rotations = ["-rotate-2", "rotate-1", "rotate-2", "-rotate-1", "rotate-1", "-rotate-2"];
                  const offsets = ["", "translate-y-3", "", "translate-y-3", "", "translate-y-3"];
                  return (
                    <div
                      key={trade.value}
                      className={`flex items-center gap-3 rounded-2xl bg-white/95 p-4 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.6)] backdrop-blur ${rotations[index]} ${offsets[index]}`}
                    >
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#e7f5ef] text-[#0a5e46]">
                        <TileIcon className="size-5" aria-hidden="true" />
                      </span>
                      <span className="text-sm font-semibold text-[#101410]">{trade.labels.en}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 flex items-center justify-between rounded-2xl bg-white/95 px-4 py-3 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.6)]">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#0a5e46]">
                  <ShieldCheck className="size-5" aria-hidden="true" />
                  {copy.hero.visualBadge}
                </span>
                <span className="text-xs font-medium text-[#5d6863]">{copy.hero.visualCaption}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="scroll-mt-20 border-b border-[#e3ddd1]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl text-[#101410] sm:text-4xl">{copy.how.title}</h2>
            <p className="mt-3 text-lg text-[#5d6863]">{copy.how.subtitle}</p>
          </div>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {copy.how.steps.map((step, index) => {
              const StepIcon = howIcons[index] || Sparkles;
              return (
                <li
                  key={step.title}
                  className="relative rounded-2xl border border-[#e3ddd1] bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-[#e7f5ef] text-[#0a5e46]">
                      <StepIcon className="size-6" aria-hidden="true" />
                    </span>
                    <span className="font-display text-3xl text-[#d6cdb9]">{index + 1}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-[#101410]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#5d6863]">{step.desc}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ── Popular trades ── */}
      <section id="trades" className="scroll-mt-20 border-b border-[#e3ddd1]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl text-[#101410] sm:text-4xl">{copy.tradesSection.title}</h2>
            <p className="mt-3 text-lg text-[#5d6863]">{copy.tradesSection.subtitle}</p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {popularTrades.map((trade) => {
              const TileIcon = trade.icon;
              return (
                <button
                  key={trade.value}
                  type="button"
                  onClick={() => startRequestWithTrade(trade.value)}
                  className="group flex items-center gap-3 rounded-2xl border border-[#e3ddd1] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#0d8b66] hover:shadow-md"
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[#e7f5ef] text-[#0a5e46] transition group-hover:bg-[#0d8b66] group-hover:text-white">
                    <TileIcon className="size-6" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[#101410]">{trade.labels[language]}</span>
                    <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-[#0d8b66]">
                      {copy.request.eyebrow}
                      <ChevronRight className="size-3.5 transition group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Request a job (centerpiece) ── */}
      <section id="request" className="scroll-mt-20 border-b border-[#e3ddd1] bg-[#fbf8f1]">
        <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:py-16">
          <div className="lg:sticky lg:top-24">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#e7f5ef] px-3 py-1.5 text-xs font-semibold text-[#0a5e46]">
              <Sparkles className="size-3.5" aria-hidden="true" />
              {copy.request.eyebrow}
            </span>
            <h2 className="font-display mt-4 text-3xl text-[#101410] sm:text-4xl lg:text-5xl">{copy.request.title}</h2>
            <p className="mt-4 max-w-md text-lg leading-8 text-[#5d6863]">{copy.request.subtitle}</p>

            <ul className="mt-6 grid gap-3">
              {copy.how.steps.map((step, index) => {
                const StepIcon = howIcons[index] || Sparkles;
                return (
                  <li key={step.title} className="flex items-center gap-3 text-sm font-medium text-[#4d5651]">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#0a5e46] shadow-sm">
                      <StepIcon className="size-4" aria-hidden="true" />
                    </span>
                    {step.title}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-3xl border border-[#e3ddd1] bg-white p-2 shadow-[0_30px_60px_-40px_rgba(13,22,18,0.4)]">
            <JobRequestForm key={`req-${requestTrade ?? "default"}-${prefillSignal}`} initialTrade={requestTrade} />
          </div>
        </div>
      </section>

      {/* ── Why ArtisanMU ── */}
      <section id="why" className="scroll-mt-20 border-b border-[#e3ddd1]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl text-[#101410] sm:text-4xl">{copy.why.title}</h2>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {copy.why.items.map((item, index) => {
              const WhyIcon = whyIcons[index] || HeartHandshake;
              return (
                <div key={item.title} className="rounded-2xl border border-[#e3ddd1] bg-white p-6 shadow-sm">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-[#e7f5ef] text-[#0a5e46]">
                    <WhyIcon className="size-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-[#101410]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#5d6863]">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Browse verified artisans ── */}
      <section id="browse" className="scroll-mt-20 border-b border-[#e3ddd1]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#0d8b66]">{copy.browse.eyebrow}</p>
            <h2 className="font-display mt-2 text-3xl text-[#101410] sm:text-4xl">{copy.browse.title}</h2>
            <p className="mt-3 text-lg text-[#5d6863]">{copy.browse.subtitle}</p>
          </div>

          {/* Filters */}
          <div className="mt-7 rounded-2xl border border-[#e3ddd1] bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#101410]">
                  <SlidersHorizontal className="size-4 text-[#234f7a]" aria-hidden="true" />
                  {copy.browse.filters}
                  {activeFilterCount ? (
                    <span className="rounded-full bg-[#234f7a] px-2 py-0.5 text-xs text-white">{activeFilterCount}</span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-[#6c756f]">{filterSummary}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex min-h-9 items-center gap-2 rounded-full bg-[#f2eee4] px-3 text-xs font-semibold text-[#5f6a64]">
                  <Wrench className="size-3.5 text-[#0d8b66]" aria-hidden="true" />
                  {copy.browse.quickTitle}
                </span>
                {quickFilters.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyQuickFilter(preset)}
                    className="inline-flex min-h-9 items-center rounded-full border border-[#e3ddd1] bg-white px-3 text-xs font-semibold text-[#0d1612] transition hover:border-[#0d8b66]"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.1fr)_150px_170px_170px_120px_130px_auto]">
              <label className="flex min-h-12 min-w-0 items-center gap-2 rounded-xl border border-[#e3ddd1] bg-[#fbf8f1] px-3">
                <Search className="size-4 shrink-0 text-[#0d8b66]" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#8b928e]"
                  placeholder={copy.browse.searchPlaceholder}
                  aria-label="Search by job, town, or specialty"
                />
              </label>

              <label className="flex min-h-12 min-w-0 items-center gap-2 rounded-xl border border-[#e3ddd1] bg-[#fbf8f1] px-3">
                <SlidersHorizontal className="size-4 shrink-0 text-[#234f7a]" aria-hidden="true" />
                <select
                  value={selectedTrade}
                  onChange={(event) => {
                    setSelectedTrade(event.target.value);
                    setExpandedArtisanId("");
                  }}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  aria-label="Filter by trade"
                >
                  <option>{allTradesLabel}</option>
                  {trades.map((trade) => (
                    <option key={trade}>{trade}</option>
                  ))}
                </select>
              </label>

              <label className="flex min-h-12 min-w-0 items-center gap-2 rounded-xl border border-[#e3ddd1] bg-[#fbf8f1] px-3">
                <MapPin className="size-4 shrink-0 text-[#9f4a4a]" aria-hidden="true" />
                <select
                  value={selectedDistrict}
                  onChange={(event) => {
                    setSelectedDistrict(event.target.value);
                    setExpandedArtisanId("");
                  }}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  aria-label="Filter by district"
                >
                  <option>{allDistrictsLabel}</option>
                  {districts.map((district) => (
                    <option key={district}>{district}</option>
                  ))}
                </select>
              </label>

              <label className="flex min-h-12 min-w-0 items-center gap-2 rounded-xl border border-[#e3ddd1] bg-[#fbf8f1] px-3">
                <Sparkles className="size-4 shrink-0 text-[#78511c]" aria-hidden="true" />
                <select
                  value={selectedTag}
                  onChange={(event) => {
                    setSelectedTag(event.target.value);
                    setExpandedArtisanId("");
                  }}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  aria-label="Filter by service tag"
                >
                  <option>{allTagsLabel}</option>
                  {serviceTagOptions.map((tag) => (
                    <option key={tag}>{tag}</option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                aria-pressed={urgent}
                onClick={() => setUrgent((value) => !value)}
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
                  urgent ? "bg-[#0d1612] text-white" : "border border-[#e3ddd1] bg-white text-[#0d1612]"
                }`}
              >
                <Clock className="size-4" aria-hidden="true" />
                {copy.browse.fastFirst}
              </button>

              <button type="button" onClick={applyFilters} className="btn btn-primary min-h-12">
                <SlidersHorizontal className="size-4" aria-hidden="true" />
                {copy.browse.filterAction}
              </button>

              {activeFilterCount ? (
                <button type="button" onClick={resetFilters} className="btn btn-secondary min-h-12">
                  {copy.browse.resetAction}
                </button>
              ) : null}
            </div>

            <div className="mt-4 grid gap-3 text-sm text-[#5d6863] sm:grid-cols-3">
              <div className="flex items-center gap-2 rounded-xl border border-[#e3ddd1] bg-[#fbf8f1] px-3 py-2">
                <ShieldCheck className="size-4 text-[#0d8b66]" aria-hidden="true" />
                <span>{availableCount ? copy.browse.availableNow(availableCount) : copy.browse.onboarding}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-[#e3ddd1] bg-[#fbf8f1] px-3 py-2">
                <Navigation className="size-4 text-[#234f7a]" aria-hidden="true" />
                <span>{fastestEta ? copy.browse.fastestEta(fastestEta) : copy.browse.etaSoon}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-[#e3ddd1] bg-[#fbf8f1] px-3 py-2">
                <Star className="size-4 fill-[#c79b55] text-[#c79b55]" aria-hidden="true" />
                <span>{copy.browse.reviewAfter}</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[#0d8b66]">{copy.browse.eyebrow}</p>
              <h3 className="font-display text-2xl text-[#101410]">
                {filteredArtisans.length ? copy.browse.readyHeading(filteredArtisans.length) : copy.browse.emptyTitle}
              </h3>
            </div>
            {filteredArtisans.length ? (
              <div className="flex flex-wrap gap-2 text-xs text-[#5d6863]">
                <span className="rounded-full border border-[#e3ddd1] bg-white px-2.5 py-1.5">{copy.browse.sortedEta}</span>
                <span className="rounded-full border border-[#e3ddd1] bg-white px-2.5 py-1.5">{copy.browse.verifiedFirst}</span>
              </div>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {filteredArtisans.map((artisan) => {
              const isSelected = selectedArtisan?.id === artisan.id;
              const isExpanded = expandedArtisanId === artisan.id;
              const artisanWhatsappLink = buildWhatsAppLink(artisan, jobNote, clientPhone);
              const hasPortfolio = artisan.portfolioImages.length > 0;
              const detailsId = `artisan-${artisan.id}-details`;
              const visibleTags = artisan.serviceTags.slice(0, 3);
              const hiddenTagCount = Math.max(0, artisan.serviceTags.length - visibleTags.length);

              return (
                <article
                  key={artisan.id}
                  onClick={() => toggleArtisanCard(artisan.id)}
                  className={`grid cursor-pointer overflow-hidden rounded-2xl border bg-white shadow-sm transition sm:grid-cols-[132px_minmax(0,1fr)] ${
                    isSelected ? "border-[#0d8b66] ring-2 ring-[#0d8b66]/15" : "border-[#e3ddd1] hover:border-[#cfc6b6]"
                  }`}
                >
                  <div className="relative aspect-[16/9] min-h-36 sm:aspect-auto sm:min-h-full">
                    <Image
                      src={artisan.image}
                      alt={`${artisan.trade} work`}
                      fill
                      sizes="(min-width: 640px) 132px, 100vw"
                      className="object-cover"
                    />
                    <span
                      className={`absolute left-2 top-2 rounded-full px-2 py-1 text-xs font-semibold ${
                        artisan.available ? "bg-[#0d8b66] text-white" : "bg-white text-[#5f6a64]"
                      }`}
                    >
                      {artisan.available ? copy.browse.available : copy.browse.later}
                    </span>
                  </div>

                  <div className="min-w-0 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="min-w-0 text-lg font-semibold text-[#101410]">{artisan.name}</h3>
                          {artisan.verified ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#e7f5ef] px-2 py-1 text-xs font-semibold text-[#0d7c5c]">
                              <ShieldCheck className="size-3.5" aria-hidden="true" />
                              {copy.browse.verified}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-[#5d6863]">
                          {artisan.trade} - {artisan.town}, {artisan.district}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 rounded-full bg-[#fff4e0] px-2.5 py-1.5 text-sm font-semibold text-[#78511c]">
                        <Star className="size-4 fill-[#c79b55] text-[#c79b55]" aria-hidden="true" />
                        {artisan.rating}
                        <span className="font-normal text-[#8a7657]">({artisan.reviews})</span>
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-[#5d6863]">{artisan.bio}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {visibleTags.map((tag) => (
                        <span
                          key={`${artisan.id}-${tag}`}
                          className="rounded-full bg-[#e7f5ef] px-2.5 py-1 text-xs font-semibold text-[#0d7c5c]"
                        >
                          {tag}
                        </span>
                      ))}
                      {hiddenTagCount ? (
                        <span className="rounded-full bg-[#f2eee4] px-2.5 py-1 text-xs font-semibold text-[#4d5651]">
                          +{hiddenTagCount}
                        </span>
                      ) : null}
                      {artisan.specialties.slice(0, 3).map((specialty) => (
                        <span
                          key={specialty}
                          className="rounded-full border border-[#e3ddd1] bg-white px-2.5 py-1 text-xs text-[#4d5651]"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap gap-2 text-sm text-[#4d5651]">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef5f3] px-2.5 py-1.5">
                          <Clock className="size-4 text-[#0f766e]" aria-hidden="true" />
                          {artisan.etaMinutes} min
                        </span>
                        <span className="rounded-full bg-[#f2eee4] px-2.5 py-1.5">{artisan.priceHint}</span>
                      </div>
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-controls={detailsId}
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedArtisanId(artisan.id);
                          setExpandedArtisanId(artisan.id);
                        }}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#0d1612] px-4 text-sm font-semibold text-white transition hover:bg-[#17251e]"
                      >
                        {isExpanded ? copy.browse.selected : copy.browse.view}
                        <ChevronRight className={`size-4 transition ${isExpanded ? "rotate-90" : ""}`} aria-hidden="true" />
                      </button>
                    </div>

                    {isExpanded ? (
                      <div id={detailsId} className="mt-4 grid gap-3 border-t border-[#eee8dc] pt-4">
                        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                          <section className="rounded-2xl border border-[#e3ddd1] bg-[#fbf8f1] p-3">
                            <div className="flex items-center gap-2 font-semibold text-[#101410]">
                              <Images className="size-4 text-[#234f7a]" aria-hidden="true" />
                              {copy.browse.portfolio}
                            </div>
                            {hasPortfolio ? (
                              <div className="mt-3 grid grid-cols-2 gap-2">
                                {artisan.portfolioImages.slice(0, 4).map((image, index) => (
                                  <div
                                    key={`${artisan.id}-portfolio-${index}`}
                                    className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#ddd8cd]"
                                  >
                                    <Image
                                      src={image}
                                      alt={`${artisan.name} portfolio ${index + 1}`}
                                      fill
                                      sizes="(min-width: 1024px) 180px, 45vw"
                                      className="object-cover"
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-2 text-sm leading-5 text-[#5d6863]">{copy.browse.portfolioEmpty}</p>
                            )}
                          </section>

                          <section className="grid gap-3">
                            <div className="rounded-2xl border border-[#e3ddd1] bg-white p-3">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 font-semibold text-[#101410]">
                                  <Star className="size-4 fill-[#c79b55] text-[#c79b55]" aria-hidden="true" />
                                  {copy.browse.reviews}
                                </div>
                                <span className="rounded-full bg-[#fff4e0] px-2 py-1 text-xs font-semibold text-[#78511c]">
                                  {artisan.rating}/5
                                </span>
                              </div>
                              <p className="mt-2 text-sm leading-5 text-[#5d6863]">{copy.browse.reviewsCount(artisan.reviews)}</p>
                            </div>

                            <div className="rounded-2xl border border-[#e3ddd1] bg-white p-3">
                              <div className="flex items-center gap-2 font-semibold text-[#101410]">
                                <Clock className="size-4 text-[#0d8b66]" aria-hidden="true" />
                                {copy.browse.availability}
                              </div>
                              <p className="mt-2 text-sm leading-5 text-[#5d6863]">
                                {artisan.available
                                  ? copy.browse.availableToday(artisan.etaMinutes)
                                  : copy.browse.notAvailable}
                              </p>
                            </div>
                          </section>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                          <p className="text-sm leading-5 text-[#5d6863]">{copy.browse.selectHint}</p>
                          <a
                            href={artisanWhatsappLink}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold ${
                              artisan.phone
                                ? "bg-[#0d8b66] text-white hover:bg-[#0b7758]"
                                : "pointer-events-none bg-[#ddd8cd] text-[#6c756f]"
                            }`}
                          >
                            <MessageCircle className="size-4" aria-hidden="true" />
                            {copy.browse.whatsapp}
                          </a>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}

            {!filteredArtisans.length ? (
              <div className="rounded-2xl border border-dashed border-[#cfc6b6] bg-white p-8 text-center shadow-sm lg:col-span-2">
                <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#e7f5ef] text-[#0a5e46]">
                  <HeartHandshake className="size-7" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-xl font-semibold text-[#101410]">{copy.browse.emptyTitle}</h3>
                <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#5d6863]">{copy.browse.emptyCopy}</p>
                <button type="button" onClick={() => scrollToId("request")} className="btn btn-primary mt-5">
                  <MessageCircle className="size-4" aria-hidden="true" />
                  {copy.browse.emptyCta}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="scroll-mt-20 border-b border-[#e3ddd1]">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
          <h2 className="font-display text-3xl text-[#101410] sm:text-4xl">{copy.faq.title}</h2>
          <div className="mt-8 grid gap-3">
            {copy.faq.items.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={item.q} className="overflow-hidden rounded-2xl border border-[#e3ddd1] bg-white shadow-sm">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                  >
                    <span className="text-base font-semibold text-[#101410]">{item.q}</span>
                    <ChevronDown
                      className={`size-5 shrink-0 text-[#0d8b66] transition ${isOpen ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen ? <p className="px-5 pb-5 text-sm leading-6 text-[#5d6863]">{item.a}</p> : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-auto bg-[#0d1612] text-[#f6f4ef]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <p className="font-display text-xl">
              Artisan<span className="text-[#3fbf95]">MU</span>
            </p>
            <p className="mt-3 max-w-xs text-sm leading-6 text-[#cbd4ce]">{copy.footer.tagline}</p>
            <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-[#cbd4ce]">
              <MapPinned className="size-3.5 text-[#3fbf95]" aria-hidden="true" />
              Mauritius
            </span>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8a978f]">{copy.footer.cols.product}</p>
            <ul className="mt-4 grid gap-2.5 text-sm text-[#cbd4ce]">
              <li>
                <button type="button" onClick={() => scrollToId("request")} className="transition hover:text-white">
                  {copy.footer.links.post}
                </button>
              </li>
              <li>
                <button type="button" onClick={() => scrollToId("browse")} className="transition hover:text-white">
                  {copy.footer.links.browse}
                </button>
              </li>
              <li>
                <Link href="/artisan" className="transition hover:text-white">
                  {copy.footer.links.artisan}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8a978f]">{copy.footer.cols.company}</p>
            <ul className="mt-4 grid gap-2.5 text-sm text-[#cbd4ce]">
              <li>
                <Link href="/login" className="transition hover:text-white">
                  {copy.footer.links.login}
                </Link>
              </li>
              <li>
                <a href="mailto:hello@octolabs.app" className="transition hover:text-white">
                  hello@octolabs.app
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-[#8a978f] sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>ArtisanMu by Octolabs</p>
            <p>{copy.footer.builtFor}</p>
          </div>
        </div>
      </footer>

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[#e3ddd1] bg-white px-2 py-2 shadow-lg sm:hidden">
        <button
          type="button"
          onClick={() => scrollToId("browse")}
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold text-[#5d6863]"
        >
          <Search className="size-4" aria-hidden="true" />
          {copy.bottomNav.browse}
        </button>
        <button
          type="button"
          onClick={() => scrollToId("request")}
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl bg-[#0d8b66] text-xs font-semibold text-white"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          {copy.bottomNav.request}
        </button>
        <Link
          href="/artisan"
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold text-[#5d6863]"
        >
          <UserCheck className="size-4" aria-hidden="true" />
          {copy.bottomNav.artisan}
        </Link>
        <Link
          href="/login"
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-xs font-semibold text-[#5d6863]"
        >
          <LogIn className="size-4" aria-hidden="true" />
          {copy.bottomNav.login}
        </Link>
      </nav>
    </main>
  );
}
