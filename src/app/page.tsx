import { ArtisanMarketplace } from "@/components/artisan-marketplace";
import { getArtisans } from "@/lib/artisans";

export default async function Home() {
  const artisans = await getArtisans();

  return <ArtisanMarketplace artisans={artisans} />;
}
