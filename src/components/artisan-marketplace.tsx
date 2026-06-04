"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarCheck,
  ChevronRight,
  Clock,
  Images,
  Globe2,
  LogIn,
  MapPin,
  MessageCircle,
  Navigation,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  UserCheck,
  Wrench,
  Zap,
} from "lucide-react";
import { AdBanner } from "@/components/ad-banner";
import { ArtisanMuLogo } from "@/components/artisanmu-logo";
import { JobRequestForm } from "@/components/JobRequestForm";
import { districts, trades } from "@/lib/mock-data";
import type { Artisan } from "@/lib/types";

type ArtisanMarketplaceProps = {
  artisans: Artisan[];
};

const allTradesLabel = "Tout metier";
const allDistrictsLabel = "Toute l'ile";
const marketplaceCopy = {
  en: {
    eyebrow: "Same-day matching in Mauritius",
    headline: "Find the right artisan in minutes.",
    support:
      "Search by trade and location, compare verified profiles, then send a WhatsApp-ready request without calling around.",
    introTitle: "Welcome to ArtisanMU",
    introCopy:
      "Tell us what broke, pick a trusted profile, and send one clean request when you are ready.",
    stepSearch: "Describe the job",
    stepCompare: "Compare profiles",
    stepContact: "Contact on WhatsApp",
    quickTitle: "Quick starts",
    filterAction: "Filter results",
    resetAction: "Reset",
    hideIntro: "Hide",
    requestTitle: "Send one clean brief",
    details: "Job details",
    phone: "Your WhatsApp",
    action: "WhatsApp artisan",
  },
  fr: {
    eyebrow: "Mise en relation le jour meme a Maurice",
    headline: "Trouvez le bon artisan en quelques minutes.",
    support:
      "Cherchez par metier et region, comparez les profils verifies, puis envoyez une demande claire par WhatsApp.",
    introTitle: "Bienvenue sur ArtisanMU",
    introCopy:
      "Expliquez le travail, choisissez un profil de confiance, puis envoyez une demande claire quand vous etes pret.",
    stepSearch: "Decrire le travail",
    stepCompare: "Comparer les profils",
    stepContact: "Contacter sur WhatsApp",
    quickTitle: "Departs rapides",
    filterAction: "Filtrer",
    resetAction: "Reinitialiser",
    hideIntro: "Fermer",
    requestTitle: "Envoyer une demande claire",
    details: "Details du travail",
    phone: "Votre WhatsApp",
    action: "Contacter sur WhatsApp",
  },
  mfe: {
    eyebrow: "Gagn enn artizan zordi mem",
    headline: "Trouv bon artizan vit-vit.",
    support:
      "Rod par metie ek landrwa, get bann profil verifye, apre avoy enn demann prop lor WhatsApp.",
    introTitle: "Bienveni lor ArtisanMU",
    introCopy:
      "Dir ki travay ena, swazir enn profil serye, apre avoy enn demann prop kan ou pare.",
    stepSearch: "Dekrir travay-la",
    stepCompare: "Konpar profil",
    stepContact: "Koz lor WhatsApp",
    quickTitle: "Koumans vit",
    filterAction: "Filtre rezilta",
    resetAction: "Reset",
    hideIntro: "Kasiet",
    requestTitle: "Avoy enn demann kler",
    details: "Travay pou fer",
    phone: "Ou WhatsApp",
    action: "WhatsApp artizan",
  },
};

type Language = keyof typeof marketplaceCopy;
const tradeAliases: Record<string, string[]> = {
  Plombier: ["leak", "fuite", "water", "pipe", "sink", "drain", "robinet"],
  Electricien: ["wiring", "electric", "power", "light", "prise", "breaker", "circuit"],
  Macon: ["wall", "concrete", "block", "tiles", "renovation", "repair"],
  Menuisier: ["cabinet", "cupboard", "door", "wood", "kitchen", "shelf"],
  Climatisation: ["ac", "aircon", "clim", "split", "cooling", "maintenance"],
  Peintre: ["paint", "painting", "repaint", "wall finish", "color"],
  Jardinier: ["garden", "grass", "yard", "tree", "plants", "trim"],
  Serrurier: ["lock", "key", "door lock", "locked", "security"],
};

const quickFilters = [
  { label: "Pipe leak", query: "leak", trade: "Plombier" },
  { label: "No power", query: "wiring", trade: "Electricien" },
  { label: "AC service", query: "ac service", trade: "Climatisation" },
  { label: "Door lock", query: "door lock", trade: "Serrurier" },
  { label: "Paint room", query: "paint", trade: "Peintre" },
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
  if (selectedTrade !== allTradesLabel && artisan.trade === selectedTrade) score += 26;
  if (selectedDistrict !== allDistrictsLabel && artisan.district === selectedDistrict) score += 18;

  return score;
}

export function ArtisanMarketplace({ artisans }: ArtisanMarketplaceProps) {
  const [query, setQuery] = useState("");
  const [selectedTrade, setSelectedTrade] = useState(allTradesLabel);
  const [selectedDistrict, setSelectedDistrict] = useState(allDistrictsLabel);
  const [urgent, setUrgent] = useState(true);
  const [selectedArtisanId, setSelectedArtisanId] = useState(artisans[0]?.id || "");
  const [expandedArtisanId, setExpandedArtisanId] = useState("");
  const [language, setLanguage] = useState<Language>("en");
  const [showIntro, setShowIntro] = useState(true);
  const copy = marketplaceCopy[language];
  const jobNote = "";
  const clientPhone = "";

  const filteredArtisans = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return [...artisans]
      .filter((artisan) => {
        const searchText = [
          artisan.name,
          artisan.trade,
          artisan.town,
          artisan.district,
          artisan.bio,
          ...(tradeAliases[artisan.trade] || []),
          ...artisan.specialties,
        ]
          .join(" ")
          .toLowerCase();

        const matchesQuery = !normalizedQuery || searchText.includes(normalizedQuery);
        const matchesTrade =
          selectedTrade === allTradesLabel || artisan.trade === selectedTrade;
        const matchesDistrict =
          selectedDistrict === allDistrictsLabel || artisan.district === selectedDistrict;

        return matchesQuery && matchesTrade && matchesDistrict;
      })
      .sort(
        (a, b) =>
          scoreArtisan(b, selectedTrade, selectedDistrict, urgent) -
          scoreArtisan(a, selectedTrade, selectedDistrict, urgent),
      );
  }, [artisans, query, selectedDistrict, selectedTrade, urgent]);

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
    (selectedDistrict !== allDistrictsLabel ? 1 : 0);
  const filterSummary = activeFilterCount
    ? [
        query.trim() ? `"${query.trim()}"` : "",
        selectedTrade !== allTradesLabel ? selectedTrade : "",
        selectedDistrict !== allDistrictsLabel ? selectedDistrict : "",
      ]
        .filter(Boolean)
        .join(" - ")
    : "All verified artisans";

  function toggleArtisanCard(artisanId: string) {
    setSelectedArtisanId(artisanId);
    setExpandedArtisanId((current) => (current === artisanId ? "" : artisanId));
  }

  function applyQuickFilter(preset: (typeof quickFilters)[number]) {
    setQuery(preset.query);
    setSelectedTrade(preset.trade);
    setSelectedDistrict(allDistrictsLabel);
    setUrgent(true);
    setExpandedArtisanId("");
    document.getElementById("matches")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetFilters() {
    setQuery("");
    setSelectedTrade(allTradesLabel);
    setSelectedDistrict(allDistrictsLabel);
    setUrgent(true);
    setExpandedArtisanId("");
    setSelectedArtisanId(artisans[0]?.id || "");
  }

  function applyFilters() {
    setExpandedArtisanId("");
    document.getElementById("matches")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main id="top" className="min-h-screen bg-[#f6f4ef] pb-20 text-[#101410] sm:pb-0">
      <header className="sticky top-0 z-30 border-b border-[#ddd8cd] bg-[#f6f4ef]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <ArtisanMuLogo subtitle="Mauritius artisan dispatch" />

          <nav className="flex items-center gap-2">
            <label className="hidden h-10 items-center gap-2 rounded-md border border-[#ddd8cd] bg-[#fffdf8] px-2 text-sm text-[#0d1612] shadow-sm md:flex">
              <Globe2 className="size-4" aria-hidden="true" />
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
              className="hidden h-10 items-center gap-2 rounded-md border border-[#ddd8cd] bg-[#fffdf8] px-3 text-sm font-medium text-[#0d1612] shadow-sm sm:flex"
            >
              <LogIn className="size-4" aria-hidden="true" />
              Login
            </Link>
            <Link
              href="/artisan"
              className="hidden h-10 items-center gap-2 rounded-md border border-[#ddd8cd] bg-[#fffdf8] px-3 text-sm font-medium text-[#0d1612] shadow-sm sm:flex"
            >
              <UserCheck className="size-4" aria-hidden="true" />
              Artisan access
            </Link>
            <a
              href="#request"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0d8b66] px-3 text-sm font-semibold text-white shadow-sm hover:bg-[#0b7758]"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              <span>Post job</span>
            </a>
          </nav>
        </div>
      </header>

      <section className="border-b border-[#ddd8cd] bg-[#fffdf8]">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 md:py-7">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-md border border-[#c79b55]/35 bg-[#fff7e7] px-3 py-2 text-sm font-medium text-[#78511c]">
                <Zap className="size-4" aria-hidden="true" />
                {copy.eyebrow}
              </div>
              <h1 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight text-[#101410] sm:text-4xl lg:text-5xl">
                {copy.headline}
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[#5f6a64]">
                {copy.support}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {[copy.stepSearch, copy.stepCompare, copy.stepContact].map((step, index) => (
                  <span
                    key={step}
                    className="inline-flex min-h-9 items-center gap-2 rounded-md border border-[#ddd8cd] bg-white px-3 text-sm font-medium text-[#4d5651]"
                  >
                    <span className="flex size-5 items-center justify-center rounded-md bg-[#0d1612] text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    {step}
                  </span>
                ))}
              </div>
            </div>

            {showIntro ? (
              <aside className="rounded-lg border border-[#d8d1c3] bg-[#f8f4ea] p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#0d8b66] text-white">
                    <Sparkles className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-semibold text-[#101410]">{copy.introTitle}</h2>
                      <button
                        type="button"
                        onClick={() => setShowIntro(false)}
                        className="rounded-md px-2 py-1 text-xs font-semibold text-[#5f6a64] hover:bg-white"
                      >
                        {copy.hideIntro}
                      </button>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#5f6a64]">{copy.introCopy}</p>
                  </div>
                </div>
              </aside>
            ) : null}
          </div>

          <div className="mt-5 rounded-lg border border-[#d8d1c3] bg-[#f8f4ea] p-3 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-[#101410]">
                  <SlidersHorizontal className="size-4 text-[#234f7a]" aria-hidden="true" />
                  Filters
                  {activeFilterCount ? (
                    <span className="rounded-md bg-[#234f7a] px-2 py-0.5 text-xs text-white">
                      {activeFilterCount}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-[#6c756f]">{filterSummary}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex min-h-9 items-center gap-2 rounded-md bg-white px-3 text-xs font-semibold text-[#5f6a64]">
                  <Wrench className="size-3.5 text-[#0d8b66]" aria-hidden="true" />
                  {copy.quickTitle}
                </span>
                {quickFilters.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyQuickFilter(preset)}
                    className="inline-flex min-h-9 items-center rounded-md border border-[#ddd8cd] bg-white px-3 text-xs font-semibold text-[#0d1612] hover:border-[#0d8b66]"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1.1fr)_170px_170px_120px_130px_auto]">
              <label className="flex min-h-12 min-w-0 items-center gap-2 rounded-md border border-[#d8d1c3] bg-white px-3">
                <Search className="size-4 shrink-0 text-[#0d8b66]" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#8b928e]"
                  placeholder="Leak, wiring, AC, cabinet..."
                  aria-label="Search by job, town, or specialty"
                />
              </label>

              <label className="flex min-h-12 min-w-0 items-center gap-2 rounded-md border border-[#d8d1c3] bg-white px-3">
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

              <label className="flex min-h-12 min-w-0 items-center gap-2 rounded-md border border-[#d8d1c3] bg-white px-3">
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

              <button
                type="button"
                aria-pressed={urgent}
                onClick={() => setUrgent((value) => !value)}
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition ${
                  urgent
                    ? "bg-[#0d1612] text-white"
                    : "border border-[#d8d1c3] bg-white text-[#0d1612]"
                }`}
              >
                <Clock className="size-4" aria-hidden="true" />
                Fast first
              </button>

              <button
                type="button"
                onClick={applyFilters}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#0d8b66] px-4 text-sm font-semibold text-white transition hover:bg-[#0b7758]"
              >
                <SlidersHorizontal className="size-4" aria-hidden="true" />
                {copy.filterAction}
              </button>

              {activeFilterCount ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex min-h-12 items-center justify-center rounded-md border border-[#d8d1c3] bg-white px-4 text-sm font-semibold text-[#0d1612] transition hover:border-[#9f4a4a]"
                >
                  {copy.resetAction}
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-4 grid gap-3 text-sm text-[#5f6a64] sm:grid-cols-3">
            <div className="flex items-center gap-2 rounded-md border border-[#ddd8cd] bg-white/70 px-3 py-2">
              <ShieldCheck className="size-4 text-[#0d8b66]" aria-hidden="true" />
              <span>{availableCount ? `${availableCount} available now` : "No artisans online yet"}</span>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-[#ddd8cd] bg-white/70 px-3 py-2">
              <Navigation className="size-4 text-[#234f7a]" aria-hidden="true" />
              <span>{fastestEta ? `${fastestEta} min fastest ETA` : "ETA appears when matches are live"}</span>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-[#ddd8cd] bg-white/70 px-3 py-2">
              <CalendarCheck className="size-4 text-[#9f4a4a]" aria-hidden="true" />
              <span>Review request after job</span>
            </div>
          </div>

          <AdBanner
            className="mt-4"
            placement="public-search"
            slot={process.env.NEXT_PUBLIC_ADSENSE_SEARCH_SLOT}
            format="horizontal"
            fallbackTitle="Advertise to homeowners looking for local help"
            fallbackCopy="A quiet placement for banks, hardware shops, insurers, and home-service partners."
          />
        </div>
      </section>

      <section id="matches" className="mx-auto grid max-w-7xl scroll-mt-24 gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[#0d8b66]">Best matches</p>
              <h2 className="text-2xl font-semibold text-[#101410]">
                {filteredArtisans.length
                  ? `${filteredArtisans.length} artisans ready`
                  : "No verified artisans live yet"}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-[#5f6a64]">
              <span className="rounded-md border border-[#ddd8cd] bg-white px-2.5 py-1.5">
                Sorted by ETA
              </span>
              <span className="rounded-md border border-[#ddd8cd] bg-white px-2.5 py-1.5">
                Verified first
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-3">
            {filteredArtisans.map((artisan) => {
              const isSelected = selectedArtisan?.id === artisan.id;
              const isExpanded = expandedArtisanId === artisan.id;
              const artisanWhatsappLink = buildWhatsAppLink(artisan, jobNote, clientPhone);
              const hasPortfolio = artisan.portfolioImages.length > 0;
              const detailsId = `artisan-${artisan.id}-details`;

              return (
                <article
                  key={artisan.id}
                  onClick={() => toggleArtisanCard(artisan.id)}
                  className={`grid cursor-pointer overflow-hidden rounded-lg border bg-[#fffdf8] shadow-sm transition sm:grid-cols-[132px_minmax(0,1fr)] ${
                    isSelected
                      ? "border-[#0d8b66] ring-2 ring-[#0d8b66]/15"
                      : "border-[#ddd8cd] hover:border-[#cfc6b6]"
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
                      className={`absolute left-2 top-2 rounded-md px-2 py-1 text-xs font-semibold ${
                        artisan.available
                          ? "bg-[#0d8b66] text-white"
                          : "bg-white text-[#5f6a64]"
                      }`}
                    >
                      {artisan.available ? "Available" : "Later today"}
                    </span>
                  </div>

                  <div className="min-w-0 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="min-w-0 text-lg font-semibold text-[#101410]">
                            {artisan.name}
                          </h3>
                          {artisan.verified ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-[#e8f6f1] px-2 py-1 text-xs font-semibold text-[#0d7c5c]">
                              <ShieldCheck className="size-3.5" aria-hidden="true" />
                              Verified
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-[#5f6a64]">
                          {artisan.trade} - {artisan.town}, {artisan.district}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 rounded-md bg-[#fff7e7] px-2.5 py-1.5 text-sm font-semibold text-[#78511c]">
                        <Star className="size-4 fill-[#c79b55] text-[#c79b55]" aria-hidden="true" />
                        {artisan.rating}
                        <span className="font-normal text-[#8a7657]">({artisan.reviews})</span>
                      </div>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-[#5f6a64]">{artisan.bio}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {artisan.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="rounded-md border border-[#ddd8cd] bg-white px-2.5 py-1 text-xs text-[#4d5651]"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap gap-2 text-sm text-[#4d5651]">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-[#eef5f3] px-2.5 py-1.5">
                          <Clock className="size-4 text-[#0f766e]" aria-hidden="true" />
                          {artisan.etaMinutes} min
                        </span>
                        <span className="rounded-md bg-[#f2eee4] px-2.5 py-1.5">
                          {artisan.priceHint}
                        </span>
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
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0d1612] px-4 text-sm font-semibold text-white hover:bg-[#17251e]"
                      >
                        {isExpanded ? "Selected" : "View"}
                        <ChevronRight
                          className={`size-4 transition ${isExpanded ? "rotate-90" : ""}`}
                          aria-hidden="true"
                        />
                      </button>
                    </div>

                    {isExpanded ? (
                      <div
                        id={detailsId}
                        className="mt-4 grid gap-3 border-t border-[#eee8dc] pt-4"
                      >
                        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                          <section className="rounded-lg border border-[#ddd8cd] bg-[#f8f4ea] p-3">
                            <div className="flex items-center gap-2 font-semibold text-[#101410]">
                              <Images className="size-4 text-[#234f7a]" aria-hidden="true" />
                              Portfolio
                            </div>
                            {hasPortfolio ? (
                              <div className="mt-3 grid grid-cols-2 gap-2">
                                {artisan.portfolioImages.slice(0, 4).map((image, index) => (
                                  <div
                                    key={`${artisan.id}-portfolio-${index}`}
                                    className="relative aspect-[4/3] overflow-hidden rounded-md bg-[#ddd8cd]"
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
                              <p className="mt-2 text-sm leading-5 text-[#5f6a64]">
                                Portfolio photos will appear here after this artisan uploads verified work.
                              </p>
                            )}
                          </section>

                          <section className="grid gap-3">
                            <div className="rounded-lg border border-[#ddd8cd] bg-white p-3">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 font-semibold text-[#101410]">
                                  <Star className="size-4 fill-[#c79b55] text-[#c79b55]" aria-hidden="true" />
                                  Reviews
                                </div>
                                <span className="rounded-md bg-[#fff7e7] px-2 py-1 text-xs font-semibold text-[#78511c]">
                                  {artisan.rating}/5
                                </span>
                              </div>
                              <p className="mt-2 text-sm leading-5 text-[#5f6a64]">
                                {artisan.reviews
                                  ? `${artisan.reviews} public reviews recorded. Detailed comments will appear after review storage is connected.`
                                  : "No public reviews yet."}
                              </p>
                            </div>

                            <div className="rounded-lg border border-[#ddd8cd] bg-white p-3">
                              <div className="flex items-center gap-2 font-semibold text-[#101410]">
                                <Clock className="size-4 text-[#0d8b66]" aria-hidden="true" />
                                Availability
                              </div>
                              <p className="mt-2 text-sm leading-5 text-[#5f6a64]">
                                {artisan.available
                                  ? `Available today. Estimated response: ${artisan.etaMinutes} min.`
                                  : "Not marked available right now. You can still prepare a request for later."}
                              </p>
                            </div>
                          </section>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                          <p className="text-sm leading-5 text-[#5f6a64]">
                            Select this profile to keep it in the request panel, then send a WhatsApp-ready brief.
                          </p>
                          <a
                            href={artisanWhatsappLink}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className={`inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold ${
                              artisan.phone
                                ? "bg-[#0d8b66] text-white hover:bg-[#0b7758]"
                                : "pointer-events-none bg-[#ddd8cd] text-[#6c756f]"
                            }`}
                          >
                            <MessageCircle className="size-4" aria-hidden="true" />
                            WhatsApp contact
                          </a>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}

            {!filteredArtisans.length ? (
              <div className="rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-5 text-[#4d5651] shadow-sm">
                <h3 className="text-lg font-semibold text-[#101410]">No approved profiles yet</h3>
                <p className="mt-2 text-sm leading-6">
                  Verified artisans will appear here as soon as real profiles are approved.
                  You can still prepare a clean job brief and come back once matching is live.
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <aside id="request" className="scroll-mt-20 min-w-0 lg:sticky lg:top-20 lg:self-start">
          <JobRequestForm />

          <AdBanner
            className="mt-4"
            placement="request-sidebar"
            slot={process.env.NEXT_PUBLIC_ADSENSE_REQUEST_SLOT}
            fallbackTitle="Reach people ready to book a repair"
            fallbackCopy="This placement stays outside the request form so it does not interrupt job submission."
            compact
          />
        </aside>
      </section>

      <footer className="mt-auto border-t border-[#ddd8cd] bg-[#0d1612] text-[#f6f4ef]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="font-semibold">ArtisanMu by Octolabs</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[#cbd4ce]">
            <a href="mailto:hello@octolabs.app" className="hover:text-white">
              hello@octolabs.app
            </a>
            <span>Mauritius</span>
            <span>Built for local service discovery</span>
          </div>
        </div>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[#ddd8cd] bg-[#fffdf8] px-2 py-2 shadow-lg sm:hidden">
        <a
          href="#top"
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-xs font-semibold text-[#5f6a64]"
        >
          <Search className="size-4" aria-hidden="true" />
          Search
        </a>
        <a
          href="#request"
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-md bg-[#0d1612] text-xs font-semibold text-white"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          Request
        </a>
        <Link
          href="/artisan"
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-xs font-semibold text-[#5f6a64]"
        >
          <UserCheck className="size-4" aria-hidden="true" />
          Artisan
        </Link>
        <Link
          href="/login"
          className="flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-xs font-semibold text-[#5f6a64]"
        >
          <LogIn className="size-4" aria-hidden="true" />
          Login
        </Link>
      </nav>
    </main>
  );
}
