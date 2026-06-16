"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { marketplaceCopy, type Language } from "@/lib/copy";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  copy: (typeof marketplaceCopy)[Language];
};

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => {},
  copy: marketplaceCopy.en,
});

const STORAGE_KEY = "artisanmu-language";

function isLanguage(value: string | null): value is Language {
  return value === "en" || value === "fr" || value === "mfe";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  // Restore the saved preference after mount (deferred so it never runs a
  // synchronous setState in the effect body and avoids hydration mismatch).
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (!isLanguage(stored)) return;
    const raf = requestAnimationFrame(() => setLanguageState(stored as Language));
    return () => cancelAnimationFrame(raf);
  }, []);

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Ignore storage failures (private mode, etc.).
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, copy: marketplaceCopy[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
