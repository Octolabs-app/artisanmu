"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ArtisanRegisterRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login#join");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-[#5d6863]">Redirecting to registration&hellip;</p>
    </main>
  );
}
