"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, LockKeyhole } from "lucide-react";

export function AdminRedirect() {
  useEffect(() => {
    window.location.replace("/admin/");
  }, []);

  return (
    <main className="min-h-screen bg-[#f6f4ef] px-4 py-6 text-[#101410]">
      <section className="mx-auto grid min-h-[calc(100vh-48px)] max-w-xl place-items-center">
        <div className="w-full rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-5 shadow-sm">
          <div className="flex size-12 items-center justify-center rounded-lg bg-[#0d1612] text-[#f6f4ef]">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold">Admin moved</h1>
          <p className="mt-2 text-sm leading-6 text-[#5f6a64]">
            The private console now lives at /admin.
          </p>
          <Link
            href="/admin/"
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#0d1612] px-4 text-sm font-semibold text-white"
          >
            Open admin
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </main>
  );
}
