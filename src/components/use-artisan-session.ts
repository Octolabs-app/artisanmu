"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

/**
 * Tracks whether a Supabase auth session is present in this browser, so the
 * whole site (not just the dashboard) can reflect the signed-in state. The
 * session already persists in localStorage with auto token refresh; this hook
 * just surfaces it and stays in sync via onAuthStateChange.
 */
export function useArtisanSession() {
  const [signedIn, setSignedIn] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = getBrowserSupabase();
    if (!supabase) {
      queueMicrotask(() => setChecking(false));
      return;
    }

    let active = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      setSignedIn(Boolean(session?.user));
      setChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setSignedIn(Boolean(session?.user));
      setChecking(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { signedIn, checking };
}
