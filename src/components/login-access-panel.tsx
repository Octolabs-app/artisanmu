"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, LockKeyhole, LogIn, Mail, ShieldCheck, UserRoundPlus } from "lucide-react";
import { ArtisanRegistrationForm } from "@/components/artisan-registration-form";
import { ArtisanMuMark } from "@/components/artisanmu-logo";
import { getBrowserSupabase, getMissingBrowserSupabaseEnv } from "@/lib/supabase-browser";

type Mode = "signin" | "signup";

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3.01c-1.07.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.72-4.95H1.27v3.11A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.28A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.38-2.28V6.61H1.27a12 12 0 0 0 0 10.78l4.01-3.11Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44A11.98 11.98 0 0 0 1.27 6.61l4.01 3.11C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  );
}

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
  const [noticeType, setNoticeType] = useState<"info" | "success" | "error">("info");
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    let active = true;

    async function checkExistingSession() {
      if (!supabase) {
        const missing = getMissingBrowserSupabaseEnv().join(", ");
        setNotice(`Sign-in needs ${missing} configured before it can work.`);
        setNoticeType("error");
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
      setNoticeType("error");
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
      setNoticeType("error");
      setPassword("");
      setSubmitting(false);
      return;
    }

    const linked = await hasLinkedArtisanProfile(data.user.id);

    if (!linked) {
      await supabase.auth.signOut();
      setNotice("This account isn’t linked to an artisan profile yet. Create one with “Join as an artisan”.");
      setNoticeType("error");
      setPassword("");
      setSubmitting(false);
      return;
    }

    window.location.assign("/artisan/");
  }

  async function handleGoogleSignIn() {
    const supabase = getBrowserSupabase();

    if (!supabase) {
      const missing = getMissingBrowserSupabaseEnv().join(", ");
      setNotice(`Sign-in is not configured yet. Missing: ${missing}.`);
      setNoticeType("error");
      return;
    }

    setGoogleLoading(true);
    setNotice("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth-callback/`,
      },
    });

    if (error) {
      setNotice("Google sign-in could not start. Try again in a moment.");
      setNoticeType("error");
      setGoogleLoading(false);
    }
    // On success the browser navigates to Google, so the loading state stays on.
  }

  async function handleForgotPassword() {
    const supabase = getBrowserSupabase();
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setNotice("Enter your email address above, then click Forgot password.");
      setNoticeType("info");
      return;
    }

    if (!supabase) {
      setNotice("Password reset is not available right now.");
      setNoticeType("error");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/reset-password`,
    });

    if (error) {
      setNotice("Could not send reset email. Try again shortly.");
      setNoticeType("error");
    } else {
      setResetSent(true);
      setNotice(`Reset link sent to ${cleanEmail}. Check your inbox.`);
      setNoticeType("success");
    }
  }

  const noticeColors =
    noticeType === "success"
      ? "border-[#0d8b66]/30 bg-[#e7f5ef] text-[#0a5e46]"
      : noticeType === "error"
        ? "border-[#E24B4A]/30 bg-[#fdecec] text-[#9f2f2e]"
        : "border-[#d7c292] bg-[#fff8e8] text-[#78511c]";

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
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#e3ddd1] bg-white/80 px-3 text-sm font-semibold text-[#0d1612] backdrop-blur transition-colors duration-150 hover:border-[#0d8b66]"
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
              className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d8b66] ${
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
              className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0d8b66] ${
                mode === "signup" ? "bg-white text-[#0a5e46] shadow-sm" : "text-[#5d6863] hover:text-[#0d1612]"
              }`}
            >
              <UserRoundPlus className="size-4" aria-hidden="true" />
              Join as artisan
            </button>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={checking || googleLoading}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-[#e3ddd1] bg-white text-sm font-semibold text-[#0d1612] transition-all duration-150 hover:border-[#0d8b66] hover:shadow-sm active:scale-[0.99] disabled:opacity-60"
          >
            <GoogleMark className="size-4.5 shrink-0" />
            {googleLoading ? "Opening Google…" : "Continue with Google"}
          </button>
          <div className="mt-4 flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-[#8a938d]" aria-hidden="true">
            <span className="h-px flex-1 bg-[#e3ddd1]" />
            or {mode === "signin" ? "use your email" : "register with email"}
            <span className="h-px flex-1 bg-[#e3ddd1]" />
          </div>

          {mode === "signin" ? (
            <form onSubmit={handleSubmit} className="mt-4 grid gap-4" noValidate>
              <label className="block text-sm font-medium text-[#101410]">
                Email
                <span className="mt-2 flex h-12 items-center gap-2 rounded-xl border border-[#e3ddd1] bg-[#fbf8f1] px-3 transition-colors duration-150 focus-within:border-[#0d8b66] focus-within:ring-2 focus-within:ring-[#0d8b66]/20">
                  <Mail className="size-4 shrink-0 text-[#0d8b66]" aria-hidden="true" />
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                    placeholder="you@example.com"
                  />
                </span>
              </label>

              <label className="block text-sm font-medium text-[#101410]">
                Password
                <span className="mt-2 flex h-12 items-center gap-2 rounded-xl border border-[#e3ddd1] bg-[#fbf8f1] px-3 transition-colors duration-150 focus-within:border-[#0d8b66] focus-within:ring-2 focus-within:ring-[#0d8b66]/20">
                  <LockKeyhole className="size-4 shrink-0 text-[#234f7a]" aria-hidden="true" />
                  <input
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                    placeholder="Your password"
                  />
                </span>
              </label>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={resetSent}
                  onClick={handleForgotPassword}
                  className="text-xs font-medium text-[#0a5e46] underline-offset-2 transition-colors duration-150 hover:underline disabled:opacity-50"
                >
                  {resetSent ? "Reset email sent" : "Forgot password?"}
                </button>
              </div>

              {notice ? (
                <p role="status" className={`rounded-xl border px-3 py-2 text-sm font-medium ${noticeColors}`}>
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
            <div className="mt-4">
              {notice ? (
                <p role="status" className={`mb-4 rounded-xl border px-3 py-2 text-sm font-medium ${noticeColors}`}>
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
