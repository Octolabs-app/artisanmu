import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  LockKeyhole,
  Mail,
  MessageCircle,
  ShieldCheck,
  UserRoundPlus,
} from "lucide-react";

export const metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f6f4ef] text-[#101410]">
      <header className="border-b border-[#ddd8cd] bg-[#fffdf8]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link href="/" className="inline-flex h-10 items-center gap-2 rounded-md border border-[#ddd8cd] bg-white px-3 text-sm font-semibold text-[#0d1612]">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </Link>
          <div className="text-right">
            <p className="font-semibold">ArtisanMu</p>
            <p className="text-xs text-[#6c756f]">Secure access</p>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-5xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-5 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-md bg-[#e8f6f1] px-3 py-2 text-sm font-semibold text-[#0d7c5c]">
            <ShieldCheck className="size-4" aria-hidden="true" />
            Password-manager friendly
          </div>
          <h1 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
            Log in to manage ArtisanMu.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5f6a64]">
            Use one secure account for ops, artisans, and client request follow-up. Admin mutations stay server-owned after the backend hardening pass.
          </p>

          <form className="mt-5 grid gap-4">
            <label className="block text-sm font-medium text-[#101410]">
              Account type
              <select
                name="role"
                className="mt-2 h-12 w-full rounded-md border border-[#d8d1c3] bg-white px-3 text-sm outline-none focus:border-[#0d8b66]"
              >
                <option>Client</option>
                <option>Artisan</option>
                <option>Octolabs Ops</option>
              </select>
            </label>

            <label className="block text-sm font-medium text-[#101410]">
              Email or phone
              <span className="mt-2 flex h-12 items-center gap-2 rounded-md border border-[#d8d1c3] bg-white px-3">
                <Mail className="size-4 shrink-0 text-[#0d8b66]" aria-hidden="true" />
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  placeholder="you@example.com"
                />
              </span>
            </label>

            <label className="block text-sm font-medium text-[#101410]">
              Password
              <span className="mt-2 flex h-12 items-center gap-2 rounded-md border border-[#d8d1c3] bg-white px-3">
                <LockKeyhole className="size-4 shrink-0 text-[#234f7a]" aria-hidden="true" />
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  placeholder="Your password"
                />
              </span>
            </label>

            <button className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#0d1612] px-4 text-sm font-semibold text-white hover:bg-[#17251e]">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Continue
            </button>
          </form>
        </div>

        <aside className="grid gap-3">
          <article className="rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-4 shadow-sm">
            <div className="flex items-center gap-2 font-semibold text-[#101410]">
              <UserRoundPlus className="size-4 text-[#0d8b66]" aria-hidden="true" />
              New artisan
            </div>
            <p className="mt-2 text-sm leading-6 text-[#5f6a64]">
              Submit your trade, district, WhatsApp, documents, and portfolio photos for Octolabs validation.
            </p>
            <button className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md border border-[#ddd8cd] bg-white text-sm font-semibold text-[#0d1612]">
              Start artisan form
            </button>
          </article>

          <article className="rounded-lg border border-[#ddd8cd] bg-[#fffdf8] p-4 shadow-sm">
            <div className="flex items-center gap-2 font-semibold text-[#101410]">
              <BriefcaseBusiness className="size-4 text-[#234f7a]" aria-hidden="true" />
              Business sponsor
            </div>
            <p className="mt-2 text-sm leading-6 text-[#5f6a64]">
              Prepare a sponsored link, banner, or embed placement for ops review before it appears publicly.
            </p>
            <button className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-md border border-[#ddd8cd] bg-white text-sm font-semibold text-[#0d1612]">
              Sponsor request
            </button>
          </article>

          <article className="rounded-lg border border-[#d7c292] bg-[#fff8e8] p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#78511c]">
              <MessageCircle className="size-4" aria-hidden="true" />
              Need help?
            </div>
            <p className="mt-2 text-sm leading-6 text-[#60451f]">
              Contact Octolabs at hello@octolabs.app while auth is being connected.
            </p>
          </article>
        </aside>
      </section>
    </main>
  );
}
