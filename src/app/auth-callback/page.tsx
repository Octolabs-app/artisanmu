"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, TriangleAlert } from "lucide-react";
import { ArtisanMuMark } from "@/components/artisanmu-logo";
import { getBrowserSupabase } from "@/lib/supabase-browser";

function hashErrorDescription() {
  if (typeof window === "undefined") return "";
  const hash = window.location.hash.replace(/^#/, "");
  const params = new URLSearchParams(hash);
  if (!params.get("error")) return "";
  return params.get("error_description")?.replace(/\+/g, " ") || "Sign-in was cancelled or failed.";
}

export default function AuthCallbackPage() {
  const [error, setError] = useState("");

  useEffect(() => {
    const providerError = hashErrorDescription();
    if (providerError) {
      queueMicrotask(() => setError(providerError));
      return;
    }

    const supabase = getBrowserSupabase();
    if (!supabase) {
      queueMicrotask(() => setError("Sign-in is not configured for this build."));
      return;
    }

    let settled = false;

    async function routeUser(userId: string) {
      if (settled || !supabase) return;
      settled = true;

      const { data } = await supabase
        .from("artisans")
        .select("id")
        .eq("auth_user_id", userId)
        .maybeSingle();

      // Existing artisan -> dashboard. New Google account -> finish the profile.
      window.location.replace(data ? "/artisan/" : "/login/#join");
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) void routeUser(session.user.id);
    });

    // detectSessionInUrl exchanges the URL hash asynchronously; check once in
    // case the session already landed before the listener attached.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) void routeUser(session.user.id);
    });

    const timeout = window.setTimeout(() => {
      if (!settled) setError("We could not complete the sign-in. The link may have expired — try again.");
    }, 12000);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 text-[#16201b]">
      <div className="w-full max-w-sm rounded-3xl border border-[#e3ddd1] bg-white/95 p-8 text-center shadow-[0_30px_60px_-40px_rgba(13,22,18,0.45)]">
        <ArtisanMuMark className="mx-auto size-14" />
        {error ? (
          <>
            <p className="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-[#9f4a4a]">
              <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
              Sign-in didn&apos;t finish
            </p>
            <p className="mt-2 text-sm leading-6 text-[#5d6863]">{error}</p>
            <Link href="/login/" className="btn btn-primary mt-5 w-full">
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto mt-5 size-6 animate-spin text-[#0d8b66]" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-[#101410]">Finishing sign-in…</p>
            <p className="mt-1 text-sm text-[#5d6863]">Hold on a second while we open your workspace.</p>
          </>
        )}
      </div>
    </main>
  );
}
