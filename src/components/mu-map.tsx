"use client";

import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { mauritiusCenter } from "@/lib/mu-geo";

export type MapPin = {
  id: string;
  lat: number;
  lng: number;
  title: string;
  subtitle?: string;
  /** CSS color for the pin head; defaults to the brand green. */
  color?: string;
  /** Label of the popup action button; omit for an info-only popup. */
  actionLabel?: string;
};

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * OpenStreetMap view of Mauritius (plain Leaflet, imported on demand so the
 * map bundle is only fetched when a map is actually shown).
 */
export function MuMap({
  pins,
  onPinAction,
  className = "h-[420px]",
}: {
  pins: MapPin[];
  onPinAction?: (id: string) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LayerGroup | null>(null);
  const actionRef = useRef(onPinAction);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    actionRef.current = onPinAction;
  }, [onPinAction]);

  useEffect(() => {
    let disposed = false;
    const container = containerRef.current;
    if (!container) return;

    // Popup action buttons are plain HTML, so wire them via delegation.
    function handleActionClick(event: Event) {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-pin-id]");
      if (target?.dataset.pinId) actionRef.current?.(target.dataset.pinId);
    }
    container.addEventListener("click", handleActionClick);

    import("leaflet").then(({ default: L }) => {
      if (disposed || mapRef.current) return;

      const map = L.map(container, { scrollWheelZoom: false });
      map.setView([mauritiusCenter.lat, mauritiusCenter.lng], 10);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      }).addTo(map);

      mapRef.current = map;
      markersRef.current = L.layerGroup().addTo(map);
      setReady(true);
    });

    return () => {
      disposed = true;
      container.removeEventListener("click", handleActionClick);
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    let disposed = false;

    import("leaflet").then(({ default: L }) => {
      const map = mapRef.current;
      const layer = markersRef.current;
      if (disposed || !map || !layer) return;

      layer.clearLayers();

      pins.forEach((pin) => {
        const icon = L.divIcon({
          className: "",
          html: `<span class="mu-pin" style="--pin:${pin.color || "var(--green)"}"></span>`,
          iconSize: [24, 24],
          iconAnchor: [12, 22],
          popupAnchor: [0, -20],
        });

        const popupHtml = `
          <div class="mu-popup">
            <p class="mu-popup-title">${escapeHtml(pin.title)}</p>
            ${pin.subtitle ? `<p class="mu-popup-sub">${escapeHtml(pin.subtitle)}</p>` : ""}
            ${pin.actionLabel ? `<button type="button" class="mu-popup-btn" data-pin-id="${escapeHtml(pin.id)}">${escapeHtml(pin.actionLabel)}</button>` : ""}
          </div>`;

        L.marker([pin.lat, pin.lng], { icon }).bindPopup(popupHtml, { closeButton: false }).addTo(layer);
      });

      if (pins.length) {
        map.fitBounds(
          L.latLngBounds(pins.map((pin) => [pin.lat, pin.lng] as [number, number])).pad(0.25),
          { maxZoom: 12 },
        );
      }
    });

    return () => {
      disposed = true;
    };
  }, [pins, ready]);

  return (
    <div
      ref={containerRef}
      className={`w-full overflow-hidden rounded-2xl border border-[#e3ddd1] shadow-sm ${className}`}
    />
  );
}
