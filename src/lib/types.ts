export type Artisan = {
  id: string;
  name: string;
  trade: string;
  town: string;
  district: string;
  rating: number;
  reviews: number;
  available: boolean;
  etaMinutes: number;
  priceHint: string;
  verified: boolean;
  specialties: string[];
  bio: string;
  phone: string;
  image: string;
};
