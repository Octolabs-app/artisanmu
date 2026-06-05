"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
  UserRoundPlus,
} from "lucide-react";
import { invokePublicFunction, invokeUserFunction } from "@/lib/artisanmu-functions";
import { districtOptions, serviceTagOptions, tradeOptions } from "@/lib/service-options";
import { getBrowserSupabase } from "@/lib/supabase-browser";

type RegistrationState = {
  name: string;
  email: string;
  password: string;
  whatsapp: string;
  trade: string;
  district: string;
  town: string;
  bio: string;
  specialties: string;
  serviceTags: string[];
  files: File[];
};

const initialForm: RegistrationState = {
  name: "",
  email: "",
  password: "",
  whatsapp: "",
  trade: "Plumber",
  district: "",
  town: "",
  bio: "",
  specialties: "",
  serviceTags: [],
  files: [],
};

const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const maxBytes = 5 * 1024 * 1024;

function localWhatsapp(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.startsWith("230") ? digits.slice(3) : digits;
}

function validateFiles(files: File[]) {
  if (!files.length) return "Upload at least one portfolio or work photo.";
  if (files.length > 6) return "Upload up to 6 work photos.";

  const invalid = files.find((file) => !allowedTypes.includes(file.type) || file.size <= 0 || file.size > maxBytes);
  if (invalid) return "Use JPG, PNG, WebP, or GIF images under 5 MB.";

  return "";
}

async function uploadApplicationPhoto(file: File) {
  const supabase = getBrowserSupabase();
  if (!supabase) {
    throw new Error("Photo upload is not configured for this build.");
  }

  const signPayload = await invokeUserFunction<{
    signedUrl?: string;
    token?: string;
    path?: string;
    bucket?: string;
    message?: string;
  }>("artisanmu-sign-upload", {
    purpose: "artisan-application",
    filename: file.name,
    content_type: file.type,
    size: file.size,
  });

  if (!signPayload.token || !signPayload.path || signPayload.bucket !== "portfolios") {
    throw new Error(signPayload.message || "Photo upload could not start.");
  }

  const { error } = await supabase.storage
    .from("portfolios")
    .uploadToSignedUrl(signPayload.path, signPayload.token, file);

  if (error) throw new Error(error.message || "Photo upload failed.");
  return signPayload.path;
}

export function ArtisanRegistrationForm() {
  const [form, setForm] = useState<RegistrationState>(initialForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [success, setSuccess] = useState("");
  const [photoStatus, setPhotoStatus] = useState("");

  const localPhone = localWhatsapp(form.whatsapp);
  const fileSummary = useMemo(() => {
    if (!form.files.length) return "Add work photos";
    if (form.files.length === 1) return form.files[0].name;
    return `${form.files.length} photos selected`;
  }, [form.files]);

  function updateForm(next: Partial<RegistrationState>) {
    setForm((current) => ({ ...current, ...next }));
    setError("");
  }

  function toggleServiceTag(tag: string) {
    setForm((current) => {
      const selected = current.serviceTags.includes(tag);
      const nextTags = selected
        ? current.serviceTags.filter((item) => item !== tag)
        : [...current.serviceTags, tag].slice(0, 8);
      return { ...current, serviceTags: nextTags };
    });
    setError("");
  }

  function validateForm() {
    if (form.name.trim().length < 2) return "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Enter a valid email address.";
    if (form.password.length < 8) return "Use a password with at least 8 characters.";
    if (!/^[24579]\d{7}$/.test(localPhone)) return "Enter a valid Mauritius WhatsApp number.";
    if (!form.district) return "Choose your district.";
    if (form.town.trim().length < 2) return "Enter your town or village.";
    if (form.bio.trim().length < 30) return "Add a bio of at least 30 characters.";
    if (!form.specialties.split(/[\n,;]+/).map((item) => item.trim()).filter(Boolean).length) {
      return "Add at least one specialty.";
    }
    if (!form.serviceTags.length) return "Choose at least one service tag.";

    return validateFiles(form.files);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formError = validateForm();
    if (formError) {
      setError(formError);
      return;
    }

    setSubmitting(true);
    setError("");
    setPhotoStatus("");
    let applicationCreated = false;

    try {
      const filesToUpload = form.files;
      const email = form.email.trim();
      const password = form.password;
      const payload = await invokePublicFunction<{ success?: boolean; message?: string }>("artisanmu-register-artisan", {
        name: form.name.trim(),
        email,
        password,
        whatsapp: `+230${localPhone}`,
        trade: form.trade,
        district: form.district,
        town: form.town.trim(),
        bio: form.bio.trim(),
        specialties: form.specialties,
        service_tags: form.serviceTags,
      });

      if (!payload.success) {
        throw new Error(payload.message || "Application could not be submitted.");
      }

      setSubmitting(false);
      setUploadingPhotos(true);
      applicationCreated = true;
      setSuccess(payload.message || "Application received. Uploading work photos for admin review.");

      const supabase = getBrowserSupabase();
      if (!supabase) {
        throw new Error("Application was created, but photo upload is not configured for this build.");
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        throw new Error(`Application was created, but photos could not attach yet: ${signInError.message}`);
      }

      const portfolioPaths = await Promise.all(filesToUpload.map((file) => uploadApplicationPhoto(file)));
      const attachPayload = await invokeUserFunction<{ success?: boolean; message?: string }>("artisanmu-artisan-profile", {
        action: "add_application_photos",
        paths: portfolioPaths,
      });

      if (!attachPayload.success) {
        throw new Error(attachPayload.message || "Application was created, but photos could not attach yet.");
      }

      setSuccess("Application received with work photos. You can open the status dashboard while admin reviews it.");
      setPhotoStatus("Work photos uploaded for review.");
      setForm(initialForm);
    } catch (submitError) {
      if (applicationCreated) {
        setPhotoStatus(submitError instanceof Error ? submitError.message : "Application was created, but photo upload needs retry.");
      } else {
        setError(submitError instanceof Error ? submitError.message : "Application failed. Try again.");
      }
    } finally {
      setSubmitting(false);
      setUploadingPhotos(false);
    }
  }

  return (
    <article className="rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[#e8f6f1] text-[#0d7c5c]">
          <UserRoundPlus className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-semibold text-[#101410]">New artisan</h2>
          <p className="mt-1 text-sm leading-5 text-[#5f6a64]">
            Apply with your trade details and recent work photos.
          </p>
        </div>
      </div>

      {success ? (
        <div className="mt-4 rounded-md border border-[#b9dfcf] bg-[#e8f6f1] p-3 text-sm text-[#0d7c5c]">
          <div className="flex gap-2 font-semibold">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {success}
          </div>
        </div>
      ) : null}

      {photoStatus ? (
        <p className="mt-3 rounded-md border border-[#d7c292] bg-[#fff8e8] px-3 py-2 text-sm font-medium text-[#78511c]">
          {photoStatus}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3" noValidate>
        <label className="block text-sm font-medium text-[#101410]">
          Full name
          <input
            value={form.name}
            onChange={(event) => updateForm({ name: event.target.value })}
            autoComplete="name"
            className="mt-2 h-11 w-full rounded-md border border-[#d8d1c3] bg-white px-3 text-sm outline-none focus:border-[#0d8b66]"
            placeholder="Your name"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <label className="block text-sm font-medium text-[#101410]">
            Email
            <span className="mt-2 flex h-11 items-center gap-2 rounded-md border border-[#d8d1c3] bg-white px-3 focus-within:border-[#0d8b66]">
              <Mail className="size-4 shrink-0 text-[#0d8b66]" aria-hidden="true" />
              <input
                value={form.email}
                onChange={(event) => updateForm({ email: event.target.value })}
                type="email"
                autoComplete="email"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                placeholder="you@example.com"
              />
            </span>
          </label>
          <label className="block text-sm font-medium text-[#101410]">
            Password
            <input
              value={form.password}
              onChange={(event) => updateForm({ password: event.target.value })}
              type="password"
              autoComplete="new-password"
              className="mt-2 h-11 w-full rounded-md border border-[#d8d1c3] bg-white px-3 text-sm outline-none focus:border-[#0d8b66]"
              placeholder="8+ characters"
            />
          </label>
        </div>

        <label className="block text-sm font-medium text-[#101410]">
          WhatsApp
          <span className="mt-2 flex h-11 overflow-hidden rounded-md border border-[#d8d1c3] bg-white focus-within:border-[#0d8b66]">
            <span className="flex items-center border-r border-[#eee8dc] bg-[#f8f4ea] px-3 text-sm font-semibold text-[#4d5651]">
              +230
            </span>
            <input
              value={form.whatsapp}
              onChange={(event) => updateForm({ whatsapp: event.target.value })}
              inputMode="tel"
              autoComplete="tel"
              className="min-w-0 flex-1 px-3 text-sm outline-none"
              placeholder="5812 3456"
            />
          </span>
        </label>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <label className="block text-sm font-medium text-[#101410]">
            Trade
            <span className="mt-2 flex h-11 items-center gap-2 rounded-md border border-[#d8d1c3] bg-white px-3">
              <BriefcaseBusiness className="size-4 shrink-0 text-[#234f7a]" aria-hidden="true" />
              <select
                value={form.trade}
                onChange={(event) => updateForm({ trade: event.target.value })}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              >
                {tradeOptions.map((trade) => (
                  <option key={trade}>{trade}</option>
                ))}
              </select>
            </span>
          </label>
          <label className="block text-sm font-medium text-[#101410]">
            District
            <span className="mt-2 flex h-11 items-center gap-2 rounded-md border border-[#d8d1c3] bg-white px-3">
              <MapPin className="size-4 shrink-0 text-[#0d8b66]" aria-hidden="true" />
              <select
                value={form.district}
                onChange={(event) => updateForm({ district: event.target.value })}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              >
                <option value="">Choose district</option>
                {districtOptions.map((district) => (
                  <option key={district}>{district}</option>
                ))}
              </select>
            </span>
          </label>
        </div>

        <label className="block text-sm font-medium text-[#101410]">
          Town or village
          <input
            value={form.town}
            onChange={(event) => updateForm({ town: event.target.value })}
            className="mt-2 h-11 w-full rounded-md border border-[#d8d1c3] bg-white px-3 text-sm outline-none focus:border-[#0d8b66]"
            placeholder="Curepipe, Flacq, Grand Baie..."
          />
        </label>

        <label className="block text-sm font-medium text-[#101410]">
          Bio
          <textarea
            value={form.bio}
            onChange={(event) => updateForm({ bio: event.target.value })}
            rows={4}
            className="mt-2 w-full resize-none rounded-md border border-[#d8d1c3] bg-white px-3 py-2 text-sm leading-6 outline-none focus:border-[#0d8b66]"
            placeholder="Tell clients what kind of work you do..."
          />
        </label>

        <label className="block text-sm font-medium text-[#101410]">
          Specialties
          <input
            value={form.specialties}
            onChange={(event) => updateForm({ specialties: event.target.value })}
            className="mt-2 h-11 w-full rounded-md border border-[#d8d1c3] bg-white px-3 text-sm outline-none focus:border-[#0d8b66]"
            placeholder="Leak repair, rewiring, cabinets"
          />
        </label>

        <fieldset className="grid gap-2 rounded-lg border border-[#ddd8cd] bg-white p-3">
          <legend className="px-1 text-sm font-medium text-[#101410]">Service tags</legend>
          <p className="text-xs leading-5 text-[#5f6a64]">
            Tags help clients filter by the kind of help they need.
          </p>
          <div className="flex flex-wrap gap-2">
            {serviceTagOptions.map((tag) => {
              const selected = form.serviceTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleServiceTag(tag)}
                  aria-pressed={selected}
                  className={`inline-flex min-h-10 items-center rounded-md px-3 text-xs font-semibold transition ${
                    selected
                      ? "bg-[#0d8b66] text-white"
                      : "border border-[#ddd8cd] bg-[#f8f4ea] text-[#4d5651] hover:border-[#0d8b66]"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </fieldset>

        <label className="block cursor-pointer rounded-lg border border-dashed border-[#c9c2b6] bg-[#f8f4ea] p-4 text-center text-sm text-[#4d5651] hover:border-[#0d8b66]">
          <ImagePlus className="mx-auto size-6 text-[#0d8b66]" aria-hidden="true" />
          <span className="mt-2 block font-semibold text-[#101410]">{fileSummary}</span>
          <span className="mt-1 block text-xs text-[#6c756f]">JPG, PNG, WebP, or GIF. Max 6 photos.</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="sr-only"
            onChange={(event) => updateForm({ files: Array.from(event.target.files || []).slice(0, 6) })}
          />
        </label>

        {error ? (
          <p role="status" className="rounded-md border border-[#e4bbb4] bg-[#fff4f2] px-3 py-2 text-sm font-medium text-[#9f4a4a]">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting || uploadingPhotos}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#0d8b66] px-4 text-sm font-semibold text-white hover:bg-[#0b7758] disabled:cursor-wait disabled:opacity-75"
        >
          {submitting || uploadingPhotos ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <ShieldCheck className="size-4" aria-hidden="true" />
          )}
          {submitting ? "Creating account..." : uploadingPhotos ? "Uploading photos..." : "Submit application"}
        </button>

        <p className="flex gap-2 rounded-md border border-[#c8d9f2] bg-[#eef5ff] px-3 py-2 text-xs leading-5 text-[#234f7a]">
          <MessageCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Pending accounts can log in, but job leads open only after approval.
        </p>
      </form>
    </article>
  );
}
