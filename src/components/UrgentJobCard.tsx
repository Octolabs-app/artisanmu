"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Lock, MessageCircle, MessageSquareText, ShieldCheck } from "lucide-react";

type UrgentJob = {
  id: string;
  trade: string;
  district: string;
  description: string;
  distanceLabel?: string;
  customerDisplayName?: string;
};

type ClaimContact = {
  display_name: string;
  whatsapp_deep_link: string;
};

type UrgentJobCardProps = {
  artisanId: string;
  job: UrgentJob;
  onTaken?: (jobId: string) => void;
  onOpenThread?: (jobId: string) => void;
};

function excerpt(value: string) {
  return value.length > 120 ? `${value.slice(0, 117)}...` : value;
}

export function UrgentJobCard({ artisanId, job, onTaken, onOpenThread }: UrgentJobCardProps) {
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [claiming, setClaiming] = useState(false);
  const [taken, setTaken] = useState(false);
  const [contact, setContact] = useState<ClaimContact | null>(null);
  const [error, setError] = useState("");
  const customerName = job.customerDisplayName || "Client A.";

  useEffect(() => {
    if (contact || taken) return undefined;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setTaken(true);
          onTaken?.(job.id);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [contact, job.id, onTaken, taken]);

  const countdownLabel = useMemo(() => `${secondsLeft}s`, [secondsLeft]);

  async function claimJob() {
    setClaiming(true);
    setError("");

    try {
      const response = await fetch(`/api/job-requests/${job.id}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artisan_id: artisanId }),
      });
      const payload = (await response.json()) as {
        success?: boolean;
        reason?: string;
        contact?: ClaimContact;
        message?: string;
      };

      if (!response.ok || !payload.success || !payload.contact) {
        if (payload.reason === "already_claimed") {
          setTaken(true);
          onTaken?.(job.id);
          return;
        }
        throw new Error(payload.message || "Could not claim this job.");
      }

      setContact(payload.contact);
    } catch (claimError) {
      setError(claimError instanceof Error ? claimError.message : "Claim failed.");
    } finally {
      setClaiming(false);
    }
  }

  if (taken && !contact) {
    return (
      <div className="rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-4 text-sm font-semibold text-[#5f6a64] shadow-sm opacity-80">
        Taken
      </div>
    );
  }

  return (
    <article className="overflow-hidden rounded-lg border border-[#E24B4A]/35 bg-[#fffdf8] shadow-lg">
      <div className="flex items-center justify-between gap-3 bg-[#E24B4A] px-4 py-3 text-white">
        <div className="flex items-center gap-2 font-semibold">
          <span className="size-2 rounded-full bg-white shadow-[0_0_0_6px_rgba(255,255,255,0.2)]" />
          Urgent job - {job.district}
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-white/18 px-2 py-1 text-sm font-semibold">
          <Clock3 className="size-4" aria-hidden="true" />
          {countdownLabel}
        </span>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-[#f2eee4] px-2.5 py-1.5 text-sm font-semibold text-[#101410]">
            {job.trade}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md bg-[#E24B4A]/10 px-2.5 py-1.5 text-sm font-semibold text-[#b33c3b]">
            <span className="size-2 animate-pulse rounded-full bg-[#E24B4A]" />
            Urgent
          </span>
          <span className="rounded-md bg-[#eef5f3] px-2.5 py-1.5 text-sm font-semibold text-[#0d7c5c]">
            {job.distanceLabel || "Nearby district"}
          </span>
        </div>

        <p className="mt-3 text-sm leading-6 text-[#4d5651]">{excerpt(job.description)}</p>

        <div className="mt-4 flex items-center gap-3 rounded-lg border border-[#ddd8cd] bg-[#f8f4ea] p-3 text-sm">
          <span className="flex size-9 items-center justify-center rounded-md bg-white text-[#234f7a]">
            <Lock className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold text-[#101410]">{contact?.display_name || customerName}</p>
            <p className="text-[#5f6a64]">Contact revealed after claim</p>
          </div>
        </div>

        {error ? (
          <div className="mt-3 rounded-md border border-[#E24B4A]/30 bg-[#E24B4A]/10 px-3 py-2 text-sm text-[#9f2f2e]">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={claimJob}
          disabled={claiming || Boolean(contact)}
          className={`mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold ${
            contact
              ? "bg-[#e8f6f1] text-[#0d7c5c]"
              : "bg-[#E24B4A] text-white hover:bg-[#cf3f3e]"
          } disabled:cursor-default disabled:opacity-90`}
        >
          {contact ? (
            <>
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Claimed
            </>
          ) : (
            <>
              <ShieldCheck className="size-4" aria-hidden="true" />
              {claiming ? "Accepting..." : "Accept this job"}
            </>
          )}
        </button>

        {contact ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => window.open(contact.whatsapp_deep_link, "_blank", "noopener,noreferrer")}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#0d8b66] px-4 text-sm font-semibold text-white hover:bg-[#0b7758]"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              WhatsApp
            </button>
            <button
              type="button"
              onClick={() => onOpenThread?.(job.id)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#ddd8cd] bg-white px-4 text-sm font-semibold text-[#0d1612]"
            >
              <MessageSquareText className="size-4" aria-hidden="true" />
              In-app message
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
