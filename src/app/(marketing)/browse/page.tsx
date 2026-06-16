import { BrowseArtisans } from "@/components/browse-artisans";
import { getArtisans } from "@/lib/artisans";

export const metadata = {
  title: "Browse artisans",
  description: "Filter verified artisans in Mauritius by trade, area and service.",
  alternates: { canonical: "/browse" },
};

export default async function BrowsePage() {
  const artisans = await getArtisans();
  return <BrowseArtisans artisans={artisans} />;
}
