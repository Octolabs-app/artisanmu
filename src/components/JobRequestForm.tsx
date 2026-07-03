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
import { useLanguage } from "@/components/language-context";
import { invokePublicFunction } from "@/lib/artisanmu-functions";
import { districtOptions, tradeOptions } from "@/lib/service-options";
import { getBrowserSupabase } from "@/lib/supabase-browser";

type Urgency = "urgent" | "planned";
type ContactMethod = "whatsapp" | "call";

type FormState = {
  urgency: Urgency | "";
  description: string;
  trade: string;
  district: string;
  contactMethod: ContactMethod;
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

const stepLabels = ["Urgency", "Problem", "Location", "Contact"];

const initialForm: FormState = {
  urgency: "",
  description: "",
  trade: "Plumber",
  district: "",
  contactMethod: "whatsapp",
  whatsappNumber: "",
  photoFile: null,
};

function normalizedLocalPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("230") ? digits.slice(3) : digits;
}

async function uploadPhoto(file: File) {
  const supabase = getBrowserSupabase();

  if (!supabase) {
    throw new Error("Photo upload is not configured for this build.");
  }

  const signPayload = await invokePublicFunction<{
    signedUrl?: string;
    token?: string;
    path?: string;
    message?: string;
  }>("artisanmu-sign-upload", {
    filename: file.name,
    content_type: file.type || "image/jpeg",
    size: file.size,
  });

  if (!signPayload.signedUrl || !signPayload.token || !signPayload.path) {
    throw new Error(signPayload.message || "Photo upload could not start.");
  }

  const { error } = await supabase.storage
    .from("job-photos")
    .uploadToSignedUrl(signPayload.path, signPayload.token, file);

  if (error) throw new Error(error.message || "Photo upload failed. Try again without the photo.");

  return signPayload.path;
}

type JobRequestFormProps = {
  /**
   * Trade to preselect (e.g. when a "Popular trades" tile is clicked). The
   * parent remounts the form (via a changing `key`) so this is read once as
   * the initial trade — no in-effect state updates required.
   */
  initialTrade?: string;
};

export function JobRequestForm({ initialTrade }: JobRequestFormProps = {}) {
  const { copy } = useLanguage();
  const t = copy.jobForm;
  // Starting at the "Problem" step when a trade was preselected keeps the flow
  // short: the visitor has already signalled what they need by tapping a tile.
  const [step, setStep] = useState(initialTrade ? 1 : 0);
  const [form, setForm] = useState<FormState>(() => ({
    ...initialForm,
    trade: initialTrade || initialForm.trade,
    urgency: initialTrade ? "planned" : "",
  }));
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
    if (targetStep === 0 && !form.urgency) return t.errUrgency;
    if (targetStep === 1 && form.description.trim().length < 10) {
      return t.errDescription;
    }
    if (targetStep === 2 && !form.district) return t.errDistrict;
    if (targetStep === 3 && !/^[24579]\d{7}$/.test(localPhone)) {
      return t.errPhone;
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
      setLocationNote(t.locUnavailable);
      return;
    }

    setLocating(true);
    setLocationNote("");
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocating(false);
        setLocationNote(t.locShared);
      },
      () => {
        setLocating(false);
        setLocationNote(t.locDenied);
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
      const payload = await invokePublicFunction<{
        id?: string;
        artisan_count_nearby?: number;
        estimated_response_minutes?: number;
        message?: string;
      }>("artisanmu-job-requests", {
        urgency: form.urgency,
        description: form.description.trim(),
        trade: form.trade,
        district: form.district,
        contact_method: form.contactMethod,
        whatsapp_number: `+230${localPhone}`,
        photo_url: photoPath,
      });

      if (!payload.id || !form.urgency) {
        throw new Error(payload.message || t.errPost);
      }

      setConfirmation({
        id: payload.id,
        district: form.district,
        artisanCount: payload.artisan_count_nearby || 0,
        responseMinutes: payload.estimated_response_minutes || 30,
        urgency: form.urgency,
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t.errFailed);
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
        <p className="mt-4 text-sm font-medium text-[#0d8b66]">
          {t.reqPrefix} #{confirmation.id.slice(0, 8)}
        </p>
        <h2 className="mt-1 text-2xl font-semibold text-[#101410]">{t.confTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-[#5f6a64]">
          {t.confNotifying(confirmation.artisanCount, confirmation.district)}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-[#ddd8cd] bg-[#f8f4ea] p-3">
            <p className="text-2xl font-semibold text-[#101410]">{confirmation.artisanCount}</p>
            <p className="mt-1 text-xs font-medium text-[#5f6a64]">{t.confTargeted}</p>
          </div>
          <div className="rounded-lg border border-[#ddd8cd] bg-[#f8f4ea] p-3">
            <p className="text-2xl font-semibold text-[#101410]">{confirmation.responseMinutes}m</p>
            <p className="mt-1 text-xs font-medium text-[#5f6a64]">{t.confResponse}</p>
          </div>
        </div>

        <div className="mt-4 flex gap-3 rounded-lg border border-[#c8d9f2] bg-[#eef5ff] p-3 text-sm leading-5 text-[#234f7a]">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{t.confAccept}</p>
        </div>

        <button
          type="button"
          onClick={resetForm}
          className="mt-4 inline-flex min-h-12 w-full items-center justify-center rounded-md bg-[#0d1612] px-4 text-sm font-semibold text-white hover:bg-[#17251e]"
        >
          {t.postAnother}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#d8d1c3] bg-[#fffdf8] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[#0d8b66]">{t.eyebrow}</p>
          <h2 className="text-xl font-semibold text-[#101410]">{t.title}</h2>
        </div>
        <span className="rounded-md bg-[#eef5f3] px-2 py-1 text-xs font-semibold text-[#0d7c5c]">
          {t.badge}
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-2 text-xs font-semibold text-[#5f6a64]">
          {t.steps.map((label, index) => (
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
                <span className="block font-semibold text-[#101410]">{t.urgentTitle}</span>
                <span className="mt-1 block text-sm text-[#5f6a64]">{t.urgentDesc}</span>
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
                <span className="block font-semibold text-[#101410]">{t.plannedTitle}</span>
                <span className="mt-1 block text-sm text-[#5f6a64]">{t.plannedDesc}</span>
              </span>
            </span>
          </button>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="mt-4 grid gap-4">
          <label className="block text-sm font-medium text-[#101410]">
            {t.describeLabel}
            <textarea
              value={form.description}
              onChange={(event) => updateForm({ description: event.target.value })}
              rows={6}
              className="mt-2 w-full resize-none rounded-md border border-[#d8d1c3] bg-white px-3 py-3 text-sm leading-6 outline-none focus:border-[#0d8b66]"
              placeholder={t.describePlaceholder}
            />
          </label>
          <label className="block text-sm font-medium text-[#101410]">
            {t.tradeLabel}
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
            {t.useLocation}
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
          <fieldset>
            <legend className="text-sm font-medium text-[#101410]">{t.contactMethodLabel}</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-pressed={form.contactMethod === "whatsapp"}
                onClick={() => updateForm({ contactMethod: "whatsapp" })}
                className={`rounded-md border p-3 text-left transition ${
                  form.contactMethod === "whatsapp"
                    ? "border-[#0d8b66] bg-[#e8f6f1] ring-2 ring-[#0d8b66]/15"
                    : "border-[#ddd8cd] bg-white hover:border-[#0d8b66]/60"
                }`}
              >
                <span className="block text-sm font-semibold text-[#101410]">{t.contactWhatsapp}</span>
                <span className="mt-0.5 block text-xs leading-4 text-[#5f6a64]">{t.contactWhatsappHint}</span>
              </button>
              <button
                type="button"
                aria-pressed={form.contactMethod === "call"}
                onClick={() => updateForm({ contactMethod: "call" })}
                className={`rounded-md border p-3 text-left transition ${
                  form.contactMethod === "call"
                    ? "border-[#0d8b66] bg-[#e8f6f1] ring-2 ring-[#0d8b66]/15"
                    : "border-[#ddd8cd] bg-white hover:border-[#0d8b66]/60"
                }`}
              >
                <span className="block text-sm font-semibold text-[#101410]">{t.contactCall}</span>
                <span className="mt-0.5 block text-xs leading-4 text-[#5f6a64]">{t.contactCallHint}</span>
              </button>
            </div>
          </fieldset>

          <label className="block text-sm font-medium text-[#101410]">
            {form.contactMethod === "whatsapp" ? t.whatsappLabel : t.phoneLabel}
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
            <p>{t.privacy}</p>
          </div>

          <label className="block cursor-pointer rounded-lg border border-dashed border-[#c9c2b6] bg-[#f8f4ea] p-4 text-center text-sm text-[#4d5651] hover:border-[#0d8b66]">
            <ImagePlus className="mx-auto size-6 text-[#0d8b66]" aria-hidden="true" />
            <span className="mt-2 block font-semibold text-[#101410]">
              {form.photoFile ? form.photoFile.name : t.addPhoto}
            </span>
            <span className="mt-1 block text-xs text-[#6c756f]">{t.photoHint}</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0] || null;
                if (file && !file.type.startsWith("image/")) {
                  setForm((current) => ({ ...current, photoFile: null }));
                  setError(t.errPhotoType);
                  return;
                }
                if (file && file.size > 5 * 1024 * 1024) {
                  setForm((current) => ({ ...current, photoFile: null }));
                  setError(t.errPhotoSize);
                  return;
                }
                updateForm({ photoFile: file });
              }}
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
          {t.back}
        </button>
        {step < stepLabels.length - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#0d1612] px-4 text-sm font-semibold text-white hover:bg-[#17251e]"
          >
            {t.continue}
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
            {form.urgency === "urgent" ? t.submitUrgent : t.submitPlanned}
          </button>
        )}
      </div>
    </div>
  );
}
