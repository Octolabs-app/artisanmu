import { OpsConsole } from "@/components/ops-console";
import Link from "next/link";
import { ArrowLeft, LockKeyhole, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Octolabs Ops",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OpsPage() {
  if (process.env.NEXT_PUBLIC_ENABLE_OPS_DEMO !== "true") {
    return (
      <main className="min-h-screen bg-[#f6f4ef] px-4 py-6 text-[#101410]">
        <section className="mx-auto grid min-h-[calc(100vh-48px)] max-w-xl place-items-center">
          <div className="w-full rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-5 shadow-sm">
            <div className="flex size-12 items-center justify-center rounded-lg bg-[#0d1612] text-[#f6f4ef]">
              <LockKeyhole className="size-5" aria-hidden="true" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold">Ops is private</h1>
            <p className="mt-2 text-sm leading-6 text-[#5f6a64]">
              The admin console is disabled in public builds until Cloudflare Access or
              Supabase-backed admin auth is connected. This protects artisan validation,
              ads, review moderation, and cleanup controls from public access.
            </p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#ddd8cd] bg-white px-4 text-sm font-semibold text-[#0d1612]"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back to site
              </Link>
              <a
                href="mailto:hello@octolabs.app?subject=ArtisanMu%20Ops%20Access"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#0d1612] px-4 text-sm font-semibold text-white"
              >
                <ShieldCheck className="size-4" aria-hidden="true" />
                Request access
              </a>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return <OpsConsole />;
}
