"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, LockKeyhole } from "lucide-react";
import { ArtisanMuMark } from "@/components/artisanmu-logo";
import { getBrowserSupabase } from "@/lib/supabase-browser";

type Status = "checking" | "ready" | "expired" | "saved";

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      queueMicrotask(() => setStatus("expired"));
      return;
    }

    let settled = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && !settled) {
        settled = true;
        setStatus("ready");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !settled) {
        settled = true;
        setStatus("ready");
      }
    });

    // The recovery link carries a hash token that supabase-js exchanges
    // asynchronously; give it a moment before declaring the link dead.
    const timeout = window.setTimeout(() => {
      if (!settled) setStatus("expired");
    }, 10000);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getBrowserSupabase();
    if (!supabase) return;

    if (password.length < 8) {
      setNotice("Use a password with at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setNotice("Both passwords must match.");
      return;
    }

    setSaving(true);
    setNotice("");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setNotice(error.message || "Could not update the password. Try again.");
      setSaving(false);
      return;
    }

    setStatus("saved");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10 text-[#16201b]">
      <div className="w-full max-w-md rounded-3xl border border-[#e3ddd1] bg-white/95 p-8 shadow-[0_30px_60px_-40px_rgba(13,22,18,0.45)]">
        <div className="flex flex-col items-center text-center">
          <ArtisanMuMark className="size-14" />
          <h1 className="font-display mt-4 text-2xl text-[#101410]">Set a new password</h1>
        </div>

        {status === "checking" ? (
          <div className="mt-6 flex flex-col items-center gap-2 text-sm text-[#5d6863]">
            <Loader2 className="size-5 animate-spin text-[#0d8b66]" aria-hidden="true" />
            Checking your reset link…
          </div>
        ) : null}

        {status === "expired" ? (
          <div className="mt-6 text-center">
            <p className="rounded-xl border border-[#E24B4A]/30 bg-[#fdecec] px-3 py-2 text-sm font-medium text-[#9f2f2e]">
              This reset link is invalid or has expired.
            </p>
            <p className="mt-3 text-sm leading-6 text-[#5d6863]">
              Request a fresh link from the sign-in page with “Forgot password”.
            </p>
            <Link href="/login/" className="btn btn-primary mt-4 w-full">
              Back to sign in
            </Link>
          </div>
        ) : null}

        {status === "ready" ? (
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4" noValidate>
            <label className="block text-sm font-medium text-[#101410]">
              New password
              <span className="mt-2 flex h-12 items-center gap-2 rounded-xl border border-[#e3ddd1] bg-[#fbf8f1] px-3 transition-colors duration-150 focus-within:border-[#0d8b66] focus-within:ring-2 focus-within:ring-[#0d8b66]/20">
                <LockKeyhole className="size-4 shrink-0 text-[#234f7a]" aria-hidden="true" />
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  placeholder="8+ characters"
                />
              </span>
            </label>

            <label className="block text-sm font-medium text-[#101410]">
              Confirm password
              <span className="mt-2 flex h-12 items-center gap-2 rounded-xl border border-[#e3ddd1] bg-[#fbf8f1] px-3 transition-colors duration-150 focus-within:border-[#0d8b66] focus-within:ring-2 focus-within:ring-[#0d8b66]/20">
                <LockKeyhole className="size-4 shrink-0 text-[#234f7a]" aria-hidden="true" />
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  placeholder="Repeat the password"
                />
              </span>
            </label>

            {notice ? (
              <p role="status" className="rounded-xl border border-[#E24B4A]/30 bg-[#fdecec] px-3 py-2 text-sm font-medium text-[#9f2f2e]">
                {notice}
              </p>
            ) : null}

            <button type="submit" disabled={saving || !password || !confirm} className="btn btn-primary mt-1">
              {saving ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              {saving ? "Saving…" : "Save new password"}
            </button>
          </form>
        ) : null}

        {status === "saved" ? (
          <div className="mt-6 text-center">
            <p className="flex items-center justify-center gap-2 rounded-xl border border-[#0d8b66]/30 bg-[#e7f5ef] px-3 py-2 text-sm font-semibold text-[#0a5e46]">
              <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
              Password updated
            </p>
            <Link href="/artisan/" className="btn btn-primary mt-4 w-full">
              Open my dashboard
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}
