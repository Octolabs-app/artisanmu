"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import { ArtisanMuLogo } from "@/components/artisanmu-logo";
import { AdminConsole } from "@/components/admin-console";

const ADMIN_PASSWORD_HASH =
  process.env.NEXT_PUBLIC_ADMIN_PASSWORD_HASH ??
  "fe3ffd2d9a9aaced48c32c451afd6c81ca0a68beb6873dbcb3717755a0150bd9";

async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function AdminAccessGate() {
  const [unlocked, setUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setChecking(true);

    if (!crypto.subtle) {
      setChecking(false);
      setError("This browser cannot verify the admin password. Please use an updated browser.");
      return;
    }

    const candidateHash = await sha256Hex(password.trim());

    if (candidateHash === ADMIN_PASSWORD_HASH) {
      setAdminPassword(password.trim());
      setUnlocked(true);
      setPassword("");
      setChecking(false);
      return;
    }

    setError("Wrong password. Check capitalization and punctuation.");
    setChecking(false);
  }

  if (unlocked) {
    return <AdminConsole adminPassword={adminPassword} />;
  }

  return (
    <main className="min-h-screen bg-[#f6f4ef] px-4 py-6 text-[#101410]">
      <section className="mx-auto grid min-h-[calc(100vh-48px)] max-w-xl place-items-center">
        <div className="w-full rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <ArtisanMuLogo subtitle="Admin" />
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[#0d1612] text-[#f6f4ef]">
              <LockKeyhole className="size-5" aria-hidden="true" />
            </div>
          </div>

          <h1 className="mt-6 text-2xl font-semibold">Admin access</h1>
          <p className="mt-2 text-sm leading-6 text-[#5f6a64]">
            Unlock artisan validation, ad placements, review moderation, and cleanup controls.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
            <label className="block text-sm font-semibold text-[#101410]" htmlFor="admin-password">
              Password
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="mt-2 h-12 w-full rounded-md border border-[#d8d1c3] bg-white px-3 text-base outline-none focus:border-[#0d8b66]"
                placeholder="Enter admin password"
              />
            </label>

            {error ? (
              <p className="rounded-md border border-[#e4bbb4] bg-[#fff4f2] px-3 py-2 text-sm font-medium text-[#9f4a4a]">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={checking || !password.trim()}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#0d1612] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#93a198]"
            >
              <ShieldCheck className="size-4" aria-hidden="true" />
              {checking ? "Checking..." : "Unlock admin"}
            </button>
          </form>

          <Link
            href="/"
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#ddd8cd] bg-white px-4 text-sm font-semibold text-[#0d1612]"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to site
          </Link>
        </div>
      </section>
    </main>
  );
}
