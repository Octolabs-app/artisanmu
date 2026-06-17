"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, LockKeyhole, LogIn, Mail, ShieldCheck, UserRoundPlus } from "lucide-react";
import { ArtisanRegistrationForm } from "@/components/artisan-registration-form";
import { ArtisanMuMark } from "@/components/artisanmu-logo";
import { getBrowserSupabase, getMissingBrowserSupabaseEnv } from "@/lib/supabase-browser";

type Mode = "signin" | "signup";

async function hasLinkedArtisanProfile(userId: string) {
  const supabase = getBrowserSupabase();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("artisans")
    .select("id")
    .eq("auth_user_id", userId)
    .maybeSingle();

  return !error && !!data;
}

export function LoginAccessPanel() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    let active = true;

    async function checkExistingSession() {
      if (!supabase) {
        const missing = getMissingBrowserSupabaseEnv().join(", ");
        setNotice(`Sign-in needs ${missing} configured before it can work.`);
        setChecking(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (user && (await hasLinkedArtisanProfile(user.id))) {
        window.location.assign("/artisan/");
        return;
      }

      setChecking(false);
    }

    checkExistingSession();

    return () => {
      active = false;
    };
  }, []);

  // Open the "Join" tab when linked from a "become an artisan" CTA (#join).
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash.toLowerCase().includes("join")) {
      const raf = requestAnimationFrame(() => setMode("signup"));
      return () => cancelAnimationFrame(raf);
    }
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getBrowserSupabase();
    const cleanEmail = email.trim();

    if (!supabase) {
      const missing = getMissingBrowserSupabaseEnv().join(", ");
      setNotice(`Sign-in is not configured yet. Missing: ${missing}.`);
      return;
    }

    setSubmitting(true);
    setNotice("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error || !data.user) {
      setNotice("We could not sign you in. Check your email and password.");
      setPassword("");
      setSubmitting(false);
      return;
    }

    const linked = await hasLinkedArtisanProfile(data.user.id);

    if (!linked) {
      await supabase.auth.signOut();
      setNotice("This account isn't linked to an artisan profile yet. Create one with “Join as an artisan”.");
      setPassword("");
      setSubmitting(false);
      return;
    }

    window.location.assign("/artisan/");
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 text-[#16201b] sm:py-12">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div
          className="blob left-[-10%] top-[-12%] size-[40vw] max-w-[520px]"
          style={{ background: "radial-gradient(circle at 30% 30%, #34b88a, #0d8b66)" }}
        />
        <div
          className="blob right-[-12%] bottom-[-10%] size-[34vw] max-w-[460px] anim-delay-2"
          style={{ background: "radial-gradient(circle at 60% 40%, #e2c99a, #c79b55)", opacity: 0.35 }}
        />
      </div>

      <div className="mx-auto w-full max-w-lg">
        <div className="mb-5 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#e3ddd1] bg-white/80 px-3 text-sm font-semibold text-[#0d1612] backdrop-blur transition hover:border-[#0d8b66]"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Home
          </Link>
          <span className="text-xs font-medium text-[#5d6863]">Artizan Moris · Mauritius</span>
        </div>

        <div className="rounded-3xl border border-[#e3ddd1] bg-white/95 p-6 shadow-[0_30px_60px_-40px_rgba(13,22,18,0.45)] backdrop-blur sm:p-8">
          <div className="flex flex-col items-center text-center">
            <ArtisanMuMark className="size-16" />
            <h1 className="font-display mt-4 text-2xl text-[#101410] sm:text-3xl">
              {mode === "signin" ? "Welcome back" : "Join as an artisan"}
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-6 text-[#5d6863]">
              {mode === "signin"
                ? "Sign in to manage your profile, photos and job leads."
                : "Create your free profile and start getting matched with clients across Mauritius."}
            </p>
          </div>

          {/* Segmented toggle */}
          <div className="mt-6 grid grid-cols-2 gap-1 rounded-full border border-[#e3ddd1] bg-[#f2eee4] p-1">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setNotice("");
              }}
              aria-pressed={mode === "signin"}
              className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full text-sm font-semibold transition ${
                mode === "signin" ? "bg-white text-[#0a5e46] shadow-sm" : "text-[#5d6863] hover:text-[#0d1612]"
              }`}
            >
              <LogIn className="size-4" aria-hidden="true" />
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setNotice("");
              }}
              aria-pressed={mode === "signup"}
              className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full text-sm font-semibold transition ${
                mode === "signup" ? "bg-white text-[#0a5e46] shadow-sm" : "text-[#5d6863] hover:text-[#0d1612]"
              }`}
            >
              <UserRoundPlus className="size-4" aria-hidden="true" />
              Join as artisan
            </button>
          </div>

          {mode === "signin" ? (
            <form onSubmit={handleSubmit} className="mt-6 grid gap-4" noValidate>
              <label className="block text-sm font-medium text-[#101410]">
                Email
                <span className="mt-2 flex h-12 items-center gap-2 rounded-xl border border-[#e3ddd1] bg-[#fbf8f1] px-3 focus-within:border-[#0d8b66]">
                  <Mail className="size-4 shrink-0 text-[#0d8b66]" aria-hidden="true" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                    placeholder="you@example.com"
                  />
                </span>
              </label>

              <label className="block text-sm font-medium text-[#101410]">
                Password
                <span className="mt-2 flex h-12 items-center gap-2 rounded-xl border border-[#e3ddd1] bg-[#fbf8f1] px-3 focus-within:border-[#0d8b66]">
                  <LockKeyhole className="size-4 shrink-0 text-[#234f7a]" aria-hidden="true" />
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                    placeholder="Your password"
                  />
                </span>
              </label>

              {notice ? (
                <p role="status" className="rounded-xl border border-[#d7c292] bg-[#fff8e8] px-3 py-2 text-sm font-medium text-[#78511c]">
                  {notice}
                </p>
              ) : null}

              <button type="submit" disabled={checking || submitting || !email.trim() || !password.trim()} className="btn btn-primary mt-1">
                <ShieldCheck className="size-4" aria-hidden="true" />
                {checking ? "Checking session..." : submitting ? "Signing in..." : "Sign in"}
              </button>

              <p className="text-center text-sm text-[#5d6863]">
                New here?{" "}
                <button type="button" onClick={() => setMode("signup")} className="font-semibold text-[#0a5e46] underline-offset-2 hover:underline">
                  Join as an artisan
                </button>
              </p>
            </form>
          ) : (
            <div className="mt-6">
              {notice ? (
                <p role="status" className="mb-4 rounded-xl border border-[#d7c292] bg-[#fff8e8] px-3 py-2 text-sm font-medium text-[#78511c]">
                  {notice}
                </p>
              ) : null}
              <ArtisanRegistrationForm />
              <p className="mt-4 text-center text-sm text-[#5d6863]">
                Already have an account?{" "}
                <button type="button" onClick={() => setMode("signin")} className="font-semibold text-[#0a5e46] underline-offset-2 hover:underline">
                  Sign in
                </button>
              </p>
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-[#5d6863]">
          Looking for help on a job? Clients don&apos;t need an account —{" "}
          <Link href="/post" className="font-semibold text-[#0a5e46] hover:underline">
            post a job
          </Link>
          . Admin sign-in is on the private admin page.
        </p>
      </div>
    </main>
  );
}
