import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://artisanmu.octolabs.app"),
  title: {
    default: "Artizan Moris | Trusted Artisans in Mauritius",
    template: "%s | Artizan Moris",
  },
  description:
    "Find verified artisans in Mauritius, compare profiles, and send a clean job request in minutes.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Artizan Moris",
    description:
      "Search verified artisans in Mauritius and send a clean WhatsApp-ready job request.",
    url: "/",
    siteName: "Artizan Moris",
    locale: "en_MU",
    type: "website",
    images: [{ url: "/artizan-moris-logo.png", width: 512, height: 512, alt: "Artizan Moris" }],
  },
  twitter: {
    card: "summary",
    title: "Artizan Moris",
    description: "Find verified artisans in Mauritius quickly.",
    images: ["/artizan-moris-logo.png"],
  },
  icons: {
    icon: "/artizan-moris-logo-192.png",
    apple: "/artizan-moris-logo-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
