"use client";

import { useState } from "react";
import { CheckCircle2, Clock3, Loader2, Lock, MessageCircle, MessageSquareText, Phone, ShieldCheck } from "lucide-react";
import { ArtisanMuFunctionError, invokeUserFunction } from "@/lib/artisanmu-functions";

type UrgentJob = {
  id: string;
  trade: string;
  district: string;
  description: string;
  urgency?: "urgent" | "planned";
  distanceLabel?: string;
  customerDisplayName?: string;
};

type ClaimContact = {
  display_name: string;
  method?: "whatsapp" | "call";
  whatsapp_deep_link?: string | null;
  phone_link?: string | null;
};

type UrgentJobCardProps = {
  job: UrgentJob;
  onTaken?: (jobId: string) => void;
  onClaimed?: (jobId: string) => void;
  onOpenThread?: (jobId: string) => void;
  /** Edge function used to claim. Defaults to the targeted-notification flow. */
  claimFn?: string;
  /** Extra body fields merged into the claim request (e.g. { action: "claim" }). */
  claimExtraBody?: Record<string, unknown>;
};

function excerpt(value: string) {
  return value.length > 120 ? `${value.slice(0, 117)}...` : value;
}

export function UrgentJobCard({
  job,
  onTaken,
  onClaimed,
  onOpenThread,
  claimFn = "artisanmu-claim-job",
  claimExtraBody,
}: UrgentJobCardProps) {
  const [claiming, setClaiming] = useState(false);
  const [taken, setTaken] = useState(false);
  const [contact, setContact] = useState<ClaimContact | null>(null);
  const [error, setError] = useState("");
  const customerName = job.customerDisplayName || "Client A.";
  const isUrgent = job.urgency === "urgent";
  const accentClass = isUrgent
    ? "border border-[var(--urgent)]/35 shadow-lg"
    : "border border-[var(--green)]/25 shadow-sm";
  const headerClass = isUrgent ? "bg-[var(--urgent)] text-white" : "bg-[var(--ink)] text-white";
  const statusClass = isUrgent
    ? "bg-[var(--urgent-soft)] text-[var(--urgent)]"
    : "bg-[var(--green-soft)] text-[var(--green-strong)]";

  async function claimJob() {
    setClaiming(true);
    setError("");

    try {
      const payload = await invokeUserFunction<{
        success?: boolean;
        reason?: string;
        contact?: ClaimContact;
        message?: string;
      }>(claimFn, { job_id: job.id, ...(claimExtraBody ?? {}) });

      if (!payload.success || !payload.contact) {
        if (payload.reason === "already_claimed") {
          setTaken(true);
          onTaken?.(job.id);
          return;
        }
        throw new Error(payload.message || "Could not claim this job.");
      }

      setContact(payload.contact);
      onClaimed?.(job.id);
    } catch (claimError) {
      if (
        claimError instanceof ArtisanMuFunctionError &&
        (claimError.reason === "already_claimed" || claimError.code === "already_handled")
      ) {
        setTaken(true);
        onTaken?.(job.id);
        return;
      }
      setError(claimError instanceof Error ? claimError.message : "Claim failed.");
    } finally {
      setClaiming(false);
    }
  }

  if (taken && !contact) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 text-sm font-semibold text-[var(--muted)] opacity-80 shadow-sm">
        Taken
      </div>
    );
  }

  return (
    <article className={`card-hover overflow-hidden rounded-2xl bg-[var(--surface)] ${accentClass}`}>
      <div className={`flex items-center justify-between gap-3 px-4 py-3 ${headerClass}`}>
        <div className="flex items-center gap-2 font-semibold">
          <span className="size-2 rounded-full bg-white shadow-[0_0_0_6px_rgba(255,255,255,0.2)]" />
          {isUrgent ? "Urgent job" : "Planned request"} - {job.district}
        </div>
        <span className="inline-flex items-center gap-1 rounded-md bg-white/18 px-2 py-1 text-sm font-semibold">
          <Clock3 className="size-4" aria-hidden="true" />
          {isUrgent ? "Today" : "Open"}
        </span>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--surface-soft)] px-2.5 py-1.5 text-sm font-semibold text-[var(--ink)]">
            {job.trade}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-sm font-semibold ${statusClass}`}>
            <span className={`size-2 rounded-full ${isUrgent ? "animate-pulse bg-[var(--urgent)]" : "bg-[var(--green)]"}`} />
            {isUrgent ? "Urgent" : "Planned"}
          </span>
          <span className="rounded-full bg-[var(--green-soft)] px-2.5 py-1.5 text-sm font-semibold text-[var(--green-strong)]">
            {job.distanceLabel || "Nearby district"}
          </span>
        </div>

        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{excerpt(job.description)}</p>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-3 text-sm">
          <span className="flex size-9 items-center justify-center rounded-lg bg-white text-[var(--blue)]">
            <Lock className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold text-[var(--ink)]">{contact?.display_name || customerName}</p>
            {!contact && (
              <p className="text-[var(--muted)]">Contact revealed after claim</p>
            )}
          </div>
        </div>

        {error ? (
          <div role="alert" className="mt-3 rounded-xl border border-[var(--urgent)]/30 bg-[var(--urgent-soft)] px-3 py-2 text-sm text-[var(--urgent)]">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={claimJob}
          disabled={claiming || Boolean(contact)}
          className={`mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all duration-200 ${
            contact
              ? "bg-[var(--green-soft)] text-[var(--green-strong)]"
              : isUrgent
                ? "bg-[var(--urgent)] text-white hover:bg-[#cf3f3e] hover:-translate-y-px"
                : "bg-[var(--ink)] text-white hover:bg-[#17251e] hover:-translate-y-px"
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {contact ? (
            <>
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Claimed
            </>
          ) : (
            <>
              {claiming ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <ShieldCheck className="size-4" aria-hidden="true" />
              )}
              {claiming ? "Accepting..." : "Accept this job"}
            </>
          )}
        </button>

        {contact ? (
          <div className={`mt-3 grid gap-2 ${onOpenThread ? "sm:grid-cols-2" : ""}`}>
            <button
              type="button"
              onClick={() =>
                window.open(
                  contact.whatsapp_deep_link || contact.phone_link || "#",
                  "_blank",
                  "noopener,noreferrer",
                )
              }
              className="btn btn-primary min-h-11 px-4 text-sm"
            >
              {contact.whatsapp_deep_link ? (
                <MessageCircle className="size-4" aria-hidden="true" />
              ) : (
                <Phone className="size-4" aria-hidden="true" />
              )}
              {contact.whatsapp_deep_link ? "WhatsApp" : "Call client"}
            </button>
            {onOpenThread ? (
              <button
                type="button"
                onClick={() => onOpenThread(job.id)}
                className="btn btn-secondary min-h-11 px-4 text-sm"
              >
                <MessageSquareText className="size-4" aria-hidden="true" />
                In-app message
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
