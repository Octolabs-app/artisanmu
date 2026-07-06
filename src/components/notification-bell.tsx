"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, BellRing, Zap } from "lucide-react";

export type BellItem = {
  id: string;
  title: string;
  meta: string;
  urgent: boolean;
  unread: boolean;
  createdAt: string;
};

const NOTIFY_PREF_KEY = "artizan-notify-leads";

export function browserAlertsEnabled() {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  return Notification.permission === "granted" && window.localStorage.getItem(NOTIFY_PREF_KEY) === "on";
}

/** Fire a browser notification for a new lead when the artisan opted in. */
export function notifyLead(title: string, body: string) {
  if (!browserAlertsEnabled()) return;
  try {
    new Notification(title, { body, icon: "/artizan-moris-logo-192.png" });
  } catch {
    // Some webviews (e.g. Android Capacitor) expose Notification but throw on use.
  }
}

function timeAgo(iso: string) {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function NotificationBell({
  items,
  onOpen,
  onItemClick,
}: {
  items: BellItem[];
  onOpen: () => void;
  onItemClick: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [alertsOn, setAlertsOn] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const unreadCount = items.filter((item) => item.unread).length;

  useEffect(() => {
    queueMicrotask(() => setAlertsOn(browserAlertsEnabled()));
  }, []);

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("pointerdown", handlePointer);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("pointerdown", handlePointer);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  function toggleOpen() {
    const next = !open;
    setOpen(next);
    if (next && unreadCount) onOpen();
  }

  async function toggleBrowserAlerts() {
    if (typeof window === "undefined" || !("Notification" in window)) return;

    if (alertsOn) {
      window.localStorage.setItem(NOTIFY_PREF_KEY, "off");
      setAlertsOn(false);
      return;
    }

    const permission =
      Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (permission === "granted") {
      window.localStorage.setItem(NOTIFY_PREF_KEY, "on");
      setAlertsOn(true);
    }
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        aria-label={unreadCount ? `Notifications: ${unreadCount} new` : "Notifications"}
        aria-expanded={open}
        className="relative inline-flex size-11 items-center justify-center rounded-md border border-[var(--line)] bg-white text-[#0d1612] transition-colors duration-150 hover:border-[var(--green)]"
      >
        {unreadCount ? (
          <BellRing className="size-5 text-[var(--green-strong)]" aria-hidden="true" />
        ) : (
          <Bell className="size-5" aria-hidden="true" />
        )}
        {unreadCount ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--urgent)] px-1 text-[11px] font-bold leading-5 text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[0_24px_50px_-24px_rgba(13,22,18,0.4)]">
          <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--ink)]">Job leads</p>
            <span className="text-xs text-[var(--muted)]">{items.length ? `Last ${items.length}` : ""}</span>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length ? (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onItemClick(item.id);
                  }}
                  className="flex w-full items-start gap-3 border-b border-[var(--line)]/60 px-4 py-3 text-left transition-colors duration-150 hover:bg-[var(--surface-soft)]"
                >
                  <span
                    className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md ${
                      item.urgent ? "bg-[var(--urgent-soft)] text-[var(--urgent)]" : "bg-[var(--green-soft)] text-[var(--green-strong)]"
                    }`}
                  >
                    <Zap className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-[var(--ink)]">{item.title}</span>
                      {item.unread ? (
                        <span className="rounded-full bg-[var(--green)] px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                          New
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-[var(--muted)]">{item.meta}</span>
                  </span>
                  <span className="shrink-0 text-xs text-[var(--muted)]">{timeAgo(item.createdAt)}</span>
                </button>
              ))
            ) : (
              <p className="px-4 py-6 text-center text-sm text-[var(--muted)]">
                No leads yet. New matching requests appear here the moment clients post them.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={toggleBrowserAlerts}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-medium text-[var(--muted)] transition-colors duration-150 hover:bg-[var(--surface-soft)]"
          >
            Browser alerts for new leads
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                alertsOn ? "bg-[var(--green-soft)] text-[var(--green-strong)]" : "bg-[#f2eee4] text-[var(--muted)]"
              }`}
            >
              {alertsOn ? "On" : "Off"}
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
