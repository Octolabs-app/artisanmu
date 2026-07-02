import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f7f4ee] px-6 text-center">
      <p className="font-display text-[7rem] leading-none text-[#d6cdb9] sm:text-[9rem]">404</p>
      <h1 className="font-display mt-2 text-2xl text-[#101410] sm:text-3xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-[#5d6863]">
        This page doesn&apos;t exist — but a trusted artisan is still one tap away.
        <br />
        <span className="text-[#8a978f]">Sa paz-la pa existe — me enn artizan serye ankor la pou ou.</span>
      </p>
      <div className="mt-7 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn btn-primary">
          Back to home
        </Link>
        <Link href="/post" className="btn btn-secondary">
          Post a job
        </Link>
      </div>
    </main>
  );
}
