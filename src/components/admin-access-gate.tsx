"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { ArtisanMuLogo } from "@/components/artisanmu-logo";
import { AdminConsole } from "@/components/admin-console";
import { invokePublicFunction } from "@/lib/artisanmu-functions";

// Tab-scoped session so a page refresh doesn't force a re-login. Closing the
// tab clears it. The password itself is only ever verified server-side.
const SESSION_KEY = "artizan-admin-session";

export function AdminAccessGate() {
  const [unlocked, setUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [restoring, setRestoring] = useState(true);

  // Restore a previous session for this tab (re-verified server-side).
  useEffect(() => {
    let stored = "";
    try {
      stored = window.sessionStorage.getItem(SESSION_KEY) || "";
    } catch {
      stored = "";
    }
    if (!stored) {
      setRestoring(false);
      return;
    }
    invokePublicFunction("artisanmu-admin-artisans", { admin_password: stored, action: "list" })
      .then(() => {
        setAdminPassword(stored);
        setUnlocked(true);
      })
      .catch(() => {
        try {
          window.sessionStorage.removeItem(SESSION_KEY);
        } catch {
          // ignore
        }
      })
      .finally(() => setRestoring(false));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setChecking(true);

    // Verify the admin password server-side (the Edge Function checks it against
    // the server-only ADMIN_PASSWORD_HASH). No hash is bundled in the client.
    const candidate = password.trim();
    try {
      await invokePublicFunction("artisanmu-admin-artisans", { admin_password: candidate, action: "list" });
      try {
        window.sessionStorage.setItem(SESSION_KEY, candidate);
      } catch {
        // Private mode — session simply won't survive a refresh.
      }
      setAdminPassword(candidate);
      setUnlocked(true);
      setPassword("");
    } catch {
      setError("Wrong password. Check capitalization and punctuation.");
    } finally {
      setChecking(false);
    }
  }

  function handleLogout() {
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
    setAdminPassword("");
    setUnlocked(false);
  }

  if (unlocked) {
    return <AdminConsole adminPassword={adminPassword} onLogout={handleLogout} />;
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0d1612] px-4 py-6 text-[#f6f4ef]">
      {/* Ambient brand glow */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(50% 60% at 50% 0%, rgba(13,139,102,0.25), transparent 70%), radial-gradient(40% 50% at 85% 90%, rgba(198,168,124,0.12), transparent 70%)",
        }}
      />

      <section className="relative w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl backdrop-blur-sm sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <ArtisanMuLogo subtitle="Admin" />
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#C6A87C]/15 text-[#C6A87C]">
              <LockKeyhole className="size-5" aria-hidden="true" />
            </div>
          </div>

          <h1 className="mt-7 text-2xl font-semibold text-white">Admin access</h1>
          <p className="mt-2 text-sm leading-6 text-[#9aa79f]">
            Artisan validation, job monitoring, content moderation and ads — one password away.
          </p>

          {restoring ? (
            <div className="mt-6 flex items-center gap-2 text-sm text-[#9aa79f]">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Restoring session…
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
              <label className="block text-sm font-semibold text-white" htmlFor="admin-password">
                Password
                <span className="mt-2 flex h-12 items-center overflow-hidden rounded-xl border border-white/15 bg-white/5 focus-within:border-[#0d8b66]">
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    className="min-w-0 flex-1 bg-transparent px-3 text-base text-white outline-none placeholder:text-[#6c7a72]"
                    placeholder="Enter admin password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="flex h-full items-center px-3 text-[#9aa79f] transition hover:text-white"
                  >
                    {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                  </button>
                </span>
              </label>

              {error ? (
                <p role="alert" className="rounded-xl border border-[#E24B4A]/40 bg-[#E24B4A]/10 px-3 py-2 text-sm font-medium text-[#f3a19e]">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={checking || !password.trim()}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#0d8b66] px-4 text-sm font-semibold text-white transition hover:bg-[#0b7758] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {checking ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ShieldCheck className="size-4" aria-hidden="true" />
                )}
                {checking ? "Checking…" : "Unlock admin"}
              </button>
            </form>
          )}

          <Link
            href="/"
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-transparent px-4 text-sm font-semibold text-[#cbd4ce] transition hover:border-white/30 hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to site
          </Link>
        </div>

        <p className="mt-4 text-center text-xs text-[#6c7a72]">
          Session lasts for this tab only. All admin actions are audit-logged.
        </p>
      </section>
    </main>
  );
}
