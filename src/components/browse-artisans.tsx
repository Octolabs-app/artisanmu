"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Clock,
  HeartHandshake,
  Images,
  MapPin,
  MessageCircle,
  Phone,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { useLanguage } from "@/components/language-context";
import { useReveal } from "@/components/use-reveal";
import {
  allDistrictsLabel,
  allTagsLabel,
  allTradesLabel,
  popularTrades,
  quickFilters,
  tradeSearchAliases,
} from "@/lib/copy";
import { mapSupabaseArtisan, publicArtisanSelect, type SupabaseArtisanProfile } from "@/lib/artisan-profile";
import { districts, trades } from "@/lib/mock-data";
import { districtMatchesSelection, serviceTagOptions, tradeMatchesSelection } from "@/lib/service-options";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import type { Artisan } from "@/lib/types";

function buildWhatsAppLink(artisan: Artisan | null) {
  if (!artisan?.phone) return "#";
  const cleaned = artisan.phone.replace(/\D/g, "");
  const phoneNumber = cleaned.startsWith("230") ? cleaned : `230${cleaned}`;
  const message = encodeURIComponent(
    `Bonjour ${artisan.name}, je vous contacte via Artisan Moris. J'ai un travail a faire.`,
  );
  return `https://wa.me/${phoneNumber}?text=${message}`;
}

function scoreArtisan(artisan: Artisan, selectedTrade: string, selectedDistrict: string, urgent: boolean) {
  let score = artisan.rating * 10 + artisan.reviews / 8 - artisan.etaMinutes / 3;
  if (artisan.available) score += urgent ? 44 : 16;
  if (artisan.verified) score += 12;
  if (selectedTrade !== allTradesLabel && tradeMatchesSelection(artisan.trade, selectedTrade)) score += 26;
  if (selectedDistrict !== allDistrictsLabel && districtMatchesSelection(artisan.district, selectedDistrict)) score += 18;
  return score;
}

export function BrowseArtisans({ artisans }: { artisans: Artisan[] }) {
  const { language, copy } = useLanguage();
  const [refreshedArtisans, setRefreshedArtisans] = useState<Artisan[] | null>(null);
  const [query, setQuery] = useState("");
  const [selectedTrade, setSelectedTrade] = useState(allTradesLabel);
  const [selectedDistrict, setSelectedDistrict] = useState(allDistrictsLabel);
  const [selectedTag, setSelectedTag] = useState(allTagsLabel);
  const [urgent, setUrgent] = useState(true);
  const [selectedArtisanId, setSelectedArtisanId] = useState(artisans[0]?.id || "");
  const [expandedArtisanId, setExpandedArtisanId] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const displayArtisans = refreshedArtisans || artisans;
  const hasAnyArtisans = displayArtisans.length > 0;

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
          ...(tradeSearchAliases[artisan.trade] || []),
          ...artisan.specialties,
          ...artisan.serviceTags,
        ]
          .join(" ")
          .toLowerCase();

        const matchesQuery = !normalizedQuery || searchText.includes(normalizedQuery);
        const matchesTrade = selectedTrade === allTradesLabel || tradeMatchesSelection(artisan.trade, selectedTrade);
        const matchesDistrict =
          selectedDistrict === allDistrictsLabel || districtMatchesSelection(artisan.district, selectedDistrict);
        const matchesTag = selectedTag === allTagsLabel || artisan.serviceTags.includes(selectedTag);
        return matchesQuery && matchesTrade && matchesDistrict && matchesTag;
      })
      .sort(
        (a, b) =>
          scoreArtisan(b, selectedTrade, selectedDistrict, urgent) -
          scoreArtisan(a, selectedTrade, selectedDistrict, urgent),
      );
  }, [displayArtisans, query, selectedDistrict, selectedTag, selectedTrade, urgent]);

  useReveal([filteredArtisans.length]);

  const selectedArtisan =
    filteredArtisans.find((artisan) => artisan.id === selectedArtisanId) || filteredArtisans[0] || null;
  const availableCount = filteredArtisans.filter((artisan) => artisan.available).length;
  const activeFilterCount =
    (query.trim() ? 1 : 0) +
    (selectedTrade !== allTradesLabel ? 1 : 0) +
    (selectedDistrict !== allDistrictsLabel ? 1 : 0) +
    (selectedTag !== allTagsLabel ? 1 : 0);

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

  return (
    <main className="text-[#16201b]">
      <section className="border-b border-[#e3ddd1]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
          <div className="reveal max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#0d8b66]">{copy.browse.eyebrow}</p>
            <h1 className="font-display mt-2 text-4xl text-[#101410] sm:text-5xl">{copy.browse.title}</h1>
            <p className="mt-3 text-lg text-[#5d6863]">{copy.browse.subtitle}</p>
          </div>

          {/* Search + filters — only when there are artisans to filter */}
          {hasAnyArtisans ? (
            <div className="reveal reveal-d1 mt-7">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="flex min-h-[52px] flex-1 items-center gap-2 rounded-2xl border border-[#e3ddd1] bg-white px-4 shadow-sm focus-within:border-[#0d8b66]">
                  <Search className="size-5 shrink-0 text-[#0d8b66]" aria-hidden="true" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent py-3 text-base outline-none placeholder:text-[#8b928e]"
                    placeholder={copy.browse.searchPlaceholder}
                    aria-label="Search by job, town, or specialty"
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      aria-label="Clear search"
                      className="rounded-full p-1 text-[#8b928e] transition hover:text-[#0d1612]"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  ) : null}
                </label>
                <button
                  type="button"
                  aria-expanded={showFilters}
                  onClick={() => setShowFilters((value) => !value)}
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-[#e3ddd1] bg-white px-4 text-sm font-semibold text-[#0d1612] shadow-sm transition hover:border-[#0d8b66]"
                >
                  <SlidersHorizontal className="size-4 text-[#234f7a]" aria-hidden="true" />
                  {copy.browse.filters}
                  {activeFilterCount ? (
                    <span className="rounded-full bg-[#0d8b66] px-2 py-0.5 text-xs text-white">{activeFilterCount}</span>
                  ) : null}
                  <ChevronDown className={`size-4 transition ${showFilters ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>
              </div>

              {/* Quick starts — always one tap away */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {quickFilters.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyQuickFilter(preset)}
                    className="inline-flex min-h-9 items-center rounded-full border border-[#e3ddd1] bg-white px-3 text-xs font-semibold text-[#0d1612] transition hover:border-[#0d8b66] hover:bg-[#e7f5ef]"
                  >
                    {preset.label}
                  </button>
                ))}
                {activeFilterCount ? (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-[#9f4a4a] transition hover:bg-[#fdecec]"
                  >
                    <RotateCcw className="size-3.5" aria-hidden="true" />
                    {copy.browse.resetAction}
                  </button>
                ) : null}
              </div>

              {/* Advanced filters — collapsed by default */}
              {showFilters ? (
                <div className="mt-3 grid gap-3 rounded-2xl border border-[#e3ddd1] bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
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
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Results header — only when there are matches */}
          {filteredArtisans.length ? (
            <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium text-[#0d8b66]">{copy.browse.eyebrow}</p>
                <h2 className="font-display text-2xl text-[#101410]">
                  {copy.browse.readyHeading(filteredArtisans.length)}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-[#5d6863]">
                {availableCount ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e3ddd1] bg-white px-2.5 py-1.5">
                    <ShieldCheck className="size-3.5 text-[#0d8b66]" aria-hidden="true" />
                    {copy.browse.availableNow(availableCount)}
                  </span>
                ) : null}
                <span className="rounded-full border border-[#e3ddd1] bg-white px-2.5 py-1.5">{copy.browse.sortedEta}</span>
                <span className="rounded-full border border-[#e3ddd1] bg-white px-2.5 py-1.5">{copy.browse.verifiedFirst}</span>
              </div>
            </div>
          ) : null}

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {filteredArtisans.map((artisan) => {
              const isSelected = selectedArtisan?.id === artisan.id;
              const isExpanded = expandedArtisanId === artisan.id;
              const artisanWhatsappLink = buildWhatsAppLink(artisan);
              const hasPortfolio = artisan.portfolioImages.length > 0;
              const detailsId = `artisan-${artisan.id}-details`;
              const visibleTags = artisan.serviceTags.slice(0, 3);
              const hiddenTagCount = Math.max(0, artisan.serviceTags.length - visibleTags.length);

              return (
                <article
                  key={artisan.id}
                  className={`group hover-lift grid overflow-hidden rounded-2xl border bg-white shadow-sm sm:grid-cols-[132px_minmax(0,1fr)] ${
                    isSelected
                      ? "border-[#0d8b66] ring-2 ring-[#0d8b66]/15"
                      : "border-[#e3ddd1] hover:border-[#0d8b66]/40 hover:shadow-lg"
                  }`}
                >
                  <div className="relative aspect-[16/9] min-h-36 overflow-hidden sm:aspect-auto sm:min-h-full">
                    <Image
                      src={artisan.image}
                      alt={`${artisan.trade} work`}
                      fill
                      sizes="(min-width: 640px) 132px, 100vw"
                      className="object-cover transition duration-500 group-hover:scale-105"
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
                          {artisan.contactPreference === "whatsapp" && artisan.phone ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#dcfce7] px-2 py-1 text-xs font-semibold text-[#166534]">
                              <MessageCircle className="size-3.5" aria-hidden="true" />
                              {copy.browse.whatsappBadge}
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
                        onClick={() => toggleArtisanCard(artisan.id)}
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
                                {artisan.available ? copy.browse.availableToday(artisan.etaMinutes) : copy.browse.notAvailable}
                              </p>
                            </div>
                          </section>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                          <p className="text-sm leading-5 text-[#5d6863]">{copy.browse.selectHint}</p>
                          {artisan.contactPreference === "call" ? (
                            <a
                              href={artisan.phone ? `tel:${artisan.phone.replace(/[^\d+]/g, "")}` : "#"}
                              onClick={(event) => event.stopPropagation()}
                              className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold ${
                                artisan.phone
                                  ? "bg-[#0d1612] text-white hover:bg-[#17251e]"
                                  : "pointer-events-none bg-[#ddd8cd] text-[#6c756f]"
                              }`}
                            >
                              <Phone className="size-4" aria-hidden="true" />
                              {copy.browse.callContact}
                            </a>
                          ) : (
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
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}

            {!filteredArtisans.length ? (
              !hasAnyArtisans ? (
                <div className="reveal rounded-3xl border border-dashed border-[#cfc6b6] bg-white p-8 text-center shadow-sm sm:p-12 lg:col-span-2">
                  <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#e7f5ef] text-[#0a5e46]">
                    <HeartHandshake className="size-7" aria-hidden="true" />
                  </span>
                  <h3 className="font-display mt-4 text-2xl text-[#101410]">{copy.browse.emptyTitle}</h3>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#5d6863]">{copy.browse.emptyCopy}</p>
                  <div className="mx-auto mt-6 flex max-w-lg flex-wrap justify-center gap-2">
                    {popularTrades.map((trade) => {
                      const TileIcon = trade.icon;
                      return (
                        <Link
                          key={trade.value}
                          href={`/post?trade=${encodeURIComponent(trade.value)}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#e3ddd1] bg-white px-3 py-1.5 text-xs font-semibold text-[#4d5651] transition hover:-translate-y-0.5 hover:border-[#0d8b66] hover:text-[#0a5e46]"
                        >
                          <TileIcon className="size-3.5 text-[#0d8b66]" aria-hidden="true" />
                          {trade.labels[language]}
                        </Link>
                      );
                    })}
                  </div>
                  <Link href="/post" className="btn btn-primary mt-6">
                    <MessageCircle className="size-4" aria-hidden="true" />
                    {copy.browse.emptyCta}
                  </Link>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[#cfc6b6] bg-white p-8 text-center shadow-sm lg:col-span-2">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#f2eee4] text-[#5d6863]">
                    <Search className="size-6" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-[#101410]">{copy.browse.noMatch}</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#5d6863]">{copy.browse.noMatchHint}</p>
                  <button type="button" onClick={resetFilters} className="btn btn-secondary mt-5">
                    <RotateCcw className="size-4" aria-hidden="true" />
                    {copy.browse.resetAction}
                  </button>
                </div>
              )
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
