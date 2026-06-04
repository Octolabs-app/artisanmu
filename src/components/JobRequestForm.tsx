"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ImagePlus,
  Loader2,
  Lock,
  MapPin,
  Navigation,
  Send,
  ShieldCheck,
} from "lucide-react";

type Urgency = "urgent" | "planned";

type FormState = {
  urgency: Urgency | "";
  description: string;
  trade: string;
  district: string;
  whatsappNumber: string;
  photoFile: File | null;
};

type Confirmation = {
  id: string;
  district: string;
  artisanCount: number;
  responseMinutes: number;
  urgency: Urgency;
};

const tradeOptions = [
  "Plumber",
  "Electrician",
  "Painter",
  "Carpenter",
  "AC technician",
  "Locksmith",
  "Other",
];

const districtOptions = [
  "Port Louis",
  "Curepipe",
  "Quatre Bornes",
  "Rose Hill",
  "Mahébourg",
  "Flacq",
  "Rivière du Rempart",
  "Vacoas",
  "Phoenix",
  "Beau Bassin",
  "Grand Baie",
  "Souillac",
];

const stepLabels = ["Urgency", "Problem", "Location", "Contact"];

const initialForm: FormState = {
  urgency: "",
  description: "",
  trade: "Plumber",
  district: "",
  whatsappNumber: "",
  photoFile: null,
};

function normalizedLocalPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("230") ? digits.slice(3) : digits;
}

async function uploadPhoto(file: File) {
  const signResponse = await fetch("/api/job-photos/sign-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      content_type: file.type || "image/jpeg",
      size: file.size,
    }),
  });

  const signPayload = (await signResponse.json()) as {
    signedUrl?: string;
    path?: string;
    message?: string;
  };

  if (!signResponse.ok || !signPayload.signedUrl || !signPayload.path) {
    throw new Error(signPayload.message || "Photo upload could not start.");
  }

  const uploadBody = new FormData();
  uploadBody.append("cacheControl", "3600");
  uploadBody.append("", file);

  const uploadResponse = await fetch(signPayload.signedUrl, {
    method: "PUT",
    headers: { "x-upsert": "false" },
    body: uploadBody,
  });

  if (!uploadResponse.ok) {
    throw new Error("Photo upload failed. Try again without the photo.");
  }

  return signPayload.path;
}

export function JobRequestForm() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState("");
  const [locationNote, setLocationNote] = useState("");
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const progress = useMemo(() => ((step + 1) / stepLabels.length) * 100, [step]);
  const localPhone = normalizedLocalPhone(form.whatsappNumber);

  function updateForm(next: Partial<FormState>) {
    setForm((current) => ({ ...current, ...next }));
    setError("");
  }

  function validateStep(targetStep = step) {
    if (targetStep === 0 && !form.urgency) return "Choose how soon you need help.";
    if (targetStep === 1 && form.description.trim().length < 10) {
      return "Add at least 10 characters so artisans understand the job.";
    }
    if (targetStep === 2 && !form.district) return "Choose the closest area.";
    if (targetStep === 3 && !/^[24579]\d{7}$/.test(localPhone)) {
      return "Enter a valid Mauritius WhatsApp number.";
    }
    return "";
  }

  function goNext() {
    const stepError = validateStep();
    if (stepError) {
      setError(stepError);
      return;
    }
    setStep((current) => Math.min(current + 1, stepLabels.length - 1));
  }

  function goBack() {
    setError("");
    setStep((current) => Math.max(current - 1, 0));
  }

  function useLocation() {
    if (!navigator.geolocation) {
      setLocationNote("GPS is not available here. Pick the closest area.");
      return;
    }

    setLocating(true);
    setLocationNote("");
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocating(false);
        setLocationNote("Location shared. Choose the closest area so artisans can match faster.");
      },
      () => {
        setLocating(false);
        setLocationNote("Location denied. No problem, pick the closest area.");
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  async function submitRequest() {
    const firstError = [0, 1, 2, 3].map((item) => validateStep(item)).find(Boolean);
    if (firstError) {
      setError(firstError);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const photoPath = form.photoFile ? await uploadPhoto(form.photoFile) : null;
      const response = await fetch("/api/job-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urgency: form.urgency,
          description: form.description.trim(),
          trade: form.trade,
          district: form.district,
          whatsapp_number: `+230${localPhone}`,
          photo_url: photoPath,
        }),
      });
      const payload = (await response.json()) as {
        id?: string;
        artisan_count_nearby?: number;
        estimated_response_minutes?: number;
        message?: string;
      };

      if (!response.ok || !payload.id || !form.urgency) {
        throw new Error(payload.message || "Request could not be posted.");
      }

      setConfirmation({
        id: payload.id,
        district: form.district,
        artisanCount: payload.artisan_count_nearby || 0,
        responseMinutes: payload.estimated_response_minutes || 30,
        urgency: form.urgency,
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Request failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setForm(initialForm);
    setStep(0);
    setError("");
    setLocationNote("");
    setConfirmation(null);
  }

  if (confirmation) {
    return (
      <div className="rounded-lg border border-[#d8d1c3] bg-[#fffdf8] p-4 shadow-sm">
        <div className="flex size-12 items-center justify-center rounded-lg bg-[#e8f6f1] text-[#0d7c5c]">
          <CheckCircle2 className="size-6" aria-hidden="true" />
        </div>
        <p className="mt-4 text-sm font-medium text-[#0d8b66]">Request #{confirmation.id.slice(0, 8)}</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#101410]">Your request is live</h2>
        <p className="mt-2 text-sm leading-6 text-[#5f6a64]">
          Notifying {confirmation.artisanCount} verified artisans in {confirmation.district} now
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-[#ddd8cd] bg-[#f8f4ea] p-3">
            <p className="text-2xl font-semibold text-[#101410]">{confirmation.artisanCount}</p>
            <p className="mt-1 text-xs font-medium text-[#5f6a64]">artisans nearby</p>
          </div>
          <div className="rounded-lg border border-[#ddd8cd] bg-[#f8f4ea] p-3">
            <p className="text-2xl font-semibold text-[#101410]">{confirmation.responseMinutes}m</p>
            <p className="mt-1 text-xs font-medium text-[#5f6a64]">avg response time</p>
          </div>
        </div>

        <div className="mt-4 flex gap-3 rounded-lg border border-[#c8d9f2] bg-[#eef5ff] p-3 text-sm leading-5 text-[#234f7a]">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>We&apos;ll send you a message when an artisan accepts</p>
        </div>

        <button
          type="button"
          onClick={resetForm}
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-[#0d1612] px-4 text-sm font-semibold text-white hover:bg-[#17251e]"
        >
          Post another request
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#d8d1c3] bg-[#fffdf8] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#0d8b66]">Request</p>
          <h2 className="text-xl font-semibold text-[#101410]">Find an artisan</h2>
        </div>
        <span className="rounded-md bg-[#eef5f3] px-2 py-1 text-xs font-semibold text-[#0d7c5c]">
          Auto-match
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#5f6a64]">
          {stepLabels.map((label, index) => (
            <span key={label} className={index === step ? "text-[#101410]" : ""}>
              {label}
            </span>
          ))}
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eee8dc]">
          <div
            className="h-full rounded-full bg-[#0d8b66] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {step === 0 ? (
        <div className="mt-4 grid gap-3">
          <button
            type="button"
            onClick={() => updateForm({ urgency: "urgent" })}
            className={`min-h-24 rounded-lg border p-4 text-left transition ${
              form.urgency === "urgent"
                ? "border-[#E24B4A] bg-[#E24B4A]/10 ring-2 ring-[#E24B4A]/15"
                : "border-[#ddd8cd] bg-[#f8f4ea] hover:border-[#E24B4A]/70"
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-[#E24B4A] text-white">
                <Clock3 className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-semibold text-[#101410]">I need help today</span>
                <span className="mt-1 block text-sm text-[#5f6a64]">Urgent matching for same-day problems.</span>
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => updateForm({ urgency: "planned" })}
            className={`min-h-24 rounded-lg border p-4 text-left transition ${
              form.urgency === "planned"
                ? "border-[#0d8b66] bg-[#e8f6f1] ring-2 ring-[#0d8b66]/15"
                : "border-[#ddd8cd] bg-[#f8f4ea] hover:border-[#0d8b66]/70"
            }`}
          >
            <span className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-[#0d1612] text-white">
                <CalendarDays className="size-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-semibold text-[#101410]">I&apos;m planning ahead</span>
                <span className="mt-1 block text-sm text-[#5f6a64]">Post it and let verified artisans reply.</span>
              </span>
            </span>
          </button>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="mt-4 grid gap-4">
          <label className="block text-sm font-medium text-[#101410]">
            Describe the problem in your own words
            <textarea
              value={form.description}
              onChange={(event) => updateForm({ description: event.target.value })}
              rows={6}
              className="mt-2 w-full resize-none rounded-md border border-[#d8d1c3] bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-[#0d8b66]"
              placeholder="Explik problem-la: robine pe koule, kouran koupe, laport bloke..."
            />
          </label>
          <label className="block text-sm font-medium text-[#101410]">
            Trade - tap to change
            <select
              value={form.trade}
              onChange={(event) => updateForm({ trade: event.target.value })}
              className="mt-2 h-12 w-full rounded-md border border-[#d8d1c3] bg-white px-3 text-sm outline-none focus:border-[#0d8b66]"
            >
              {tradeOptions.map((trade) => (
                <option key={trade}>{trade}</option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-4 grid gap-4">
          <div className="grid grid-cols-2 gap-2">
            {districtOptions.map((district) => (
              <button
                key={district}
                type="button"
                onClick={() => updateForm({ district })}
                className={`min-h-12 rounded-md border px-2 text-sm font-semibold transition ${
                  form.district === district
                    ? "border-[#0d8b66] bg-[#e8f6f1] text-[#0d7c5c]"
                    : "border-[#ddd8cd] bg-white text-[#4d5651] hover:border-[#0d8b66]/60"
                }`}
              >
                {district}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={useLocation}
            disabled={locating}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[#d8d1c3] bg-[#f8f4ea] px-4 text-sm font-semibold text-[#0d1612] disabled:cursor-wait disabled:opacity-70"
          >
            {locating ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Navigation className="size-4 text-[#234f7a]" aria-hidden="true" />
            )}
            Use my location
          </button>
          {locationNote ? (
            <p className="flex gap-2 text-xs leading-5 text-[#5f6a64]">
              <MapPin className="mt-0.5 size-4 shrink-0 text-[#9f4a4a]" aria-hidden="true" />
              {locationNote}
            </p>
          ) : null}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="mt-4 grid gap-4">
          <label className="block text-sm font-medium text-[#101410]">
            WhatsApp number
            <span className="mt-2 flex h-12 overflow-hidden rounded-md border border-[#d8d1c3] bg-white focus-within:border-[#0d8b66]">
              <span className="flex items-center border-r border-[#eee8dc] bg-[#f8f4ea] px-3 text-sm font-semibold text-[#4d5651]">
                +230
              </span>
              <input
                value={form.whatsappNumber}
                onChange={(event) => updateForm({ whatsappNumber: event.target.value })}
                inputMode="tel"
                className="min-w-0 flex-1 px-3 text-sm outline-none"
                placeholder="5812 3456"
              />
            </span>
          </label>

          <div className="flex gap-3 rounded-lg border border-[#c8d9f2] bg-[#eef5ff] p-3 text-sm leading-5 text-[#234f7a]">
            <Lock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>Your number is never shown directly. Artisans contact you only through the app or a protected link.</p>
          </div>

          <label className="block cursor-pointer rounded-lg border border-dashed border-[#c9c2b6] bg-[#f8f4ea] p-4 text-center text-sm text-[#4d5651] hover:border-[#0d8b66]">
            <ImagePlus className="mx-auto size-6 text-[#0d8b66]" aria-hidden="true" />
            <span className="mt-2 block font-semibold text-[#101410]">
              {form.photoFile ? form.photoFile.name : "Add a photo"}
            </span>
            <span className="mt-1 block text-xs text-[#6c756f]">Optional, image under 5 MB</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => updateForm({ photoFile: event.target.files?.[0] || null })}
            />
          </label>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-md border border-[#E24B4A]/30 bg-[#E24B4A]/10 px-3 py-2 text-sm text-[#9f2f2e]">
          {error}
        </div>
      ) : null}

      <div className="mt-5 grid gap-2 sm:grid-cols-[auto_minmax(0,1fr)]">
        <button
          type="button"
          onClick={goBack}
          disabled={step === 0 || submitting}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[#d8d1c3] bg-white px-4 text-sm font-semibold text-[#0d1612] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </button>
        {step < stepLabels.length - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#0d1612] px-4 text-sm font-semibold text-white hover:bg-[#17251e]"
          >
            Continue
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            onClick={submitRequest}
            disabled={submitting}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#0d8b66] px-4 text-sm font-semibold text-white hover:bg-[#0b7758] disabled:cursor-wait disabled:opacity-75"
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-4" aria-hidden="true" />
            )}
            {form.urgency === "urgent" ? "Find artisans now" : "Post my request"}
          </button>
        )}
      </div>
    </div>
  );
}
