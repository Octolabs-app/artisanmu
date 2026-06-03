import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://artisanmu.octolabs.app"),
  title: {
    default: "ArtisanMu | Trusted Artisans in Mauritius",
    template: "%s | ArtisanMu",
  },
  description:
    "Find verified artisans in Mauritius, compare profiles, and send a clean job request in minutes.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "ArtisanMu",
    description:
      "Search verified artisans in Mauritius and send a clean WhatsApp-ready job request.",
    url: "/",
    siteName: "ArtisanMu",
    locale: "en_MU",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "ArtisanMu",
    description: "Find verified artisans in Mauritius quickly.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
