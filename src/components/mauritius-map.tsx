"use client";

import { MapPin, Navigation } from "lucide-react";

type MauritiusMapProps = {
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
};

const districtMarkers = [
  { district: "Pamplemousses", x: "45%", y: "18%" },
  { district: "Riviere du Rempart", x: "61%", y: "11%" },
  { district: "Port-Louis", x: "32%", y: "30%" },
  { district: "Moka", x: "50%", y: "38%" },
  { district: "Plaines Wilhems", x: "43%", y: "51%" },
  { district: "Flacq", x: "68%", y: "39%" },
  { district: "Grand Port", x: "62%", y: "72%" },
  { district: "Savanne", x: "43%", y: "79%" },
  { district: "Black River", x: "27%", y: "65%" },
];

export function MauritiusMap({ selectedDistrict, onSelectDistrict }: MauritiusMapProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-[#24342b] bg-[#0d1612] p-4 text-white shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-white/70">Dispatch map</p>
          <h2 className="text-xl font-semibold">Tap a district</h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-xs font-semibold text-white">
          <Navigation className="size-4 text-[#c79b55]" aria-hidden="true" />
          Mauritius
        </span>
      </div>

      <div className="relative mt-4 h-72 overflow-hidden rounded-lg bg-[#eef5f3]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(35,79,122,0.16),rgba(13,139,102,0.1))]" />
        <div className="absolute left-[23%] top-[7%] h-[86%] w-[54%] rounded-[46%_54%_45%_55%] border-2 border-[#0d8b66]/40 bg-[#fffdf8] shadow-xl" />
        <div className="absolute left-[36%] top-[22%] h-[55%] w-[28%] rounded-[54%_46%_48%_52%] border border-[#d8d1c3] bg-[#f8f4ea]" />

        {districtMarkers.map((marker) => {
          const isSelected =
            selectedDistrict === marker.district ||
            (selectedDistrict === "Toute l'ile" && marker.district === "Moka");

          return (
            <button
              key={marker.district}
              type="button"
              onClick={() => onSelectDistrict(marker.district)}
              className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold shadow-sm transition ${
                isSelected
                  ? "bg-[#0d1612] text-white"
                  : "bg-white text-[#0d1612] hover:bg-[#fff7e7]"
              }`}
              style={{ left: marker.x, top: marker.y }}
            >
              <MapPin className="size-3.5" aria-hidden="true" />
              <span className="max-w-24 truncate">{marker.district}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/75">
        <span className="rounded-md bg-white/10 px-2.5 py-1.5">
          Selected: {selectedDistrict}
        </span>
        <button
          type="button"
          onClick={() => onSelectDistrict("Toute l'ile")}
          className="rounded-md bg-white/10 px-2.5 py-1.5 font-semibold text-white"
        >
          Reset island
        </button>
      </div>
    </section>
  );
}
