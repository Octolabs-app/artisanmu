export type PendingArtisan = {
  id: string;
  name: string;
  trade: string;
  town: string;
  district: string;
  submittedAt: string;
  phone: string;
  checks: string[];
  notes: string;
  badge: "Verified" | "Fair price" | "Fast response" | "Top rated";
  risk: "Low" | "Review" | "Hold";
};

export type AdPlacement = {
  id: string;
  name: string;
  surface: "Search results" | "Request panel" | "Artisan dashboard";
  sponsor: string;
  status: "Live" | "Draft" | "Paused";
  format: "AdSense responsive" | "Direct banner" | "Direct link";
  adsenseSlot: string;
  adsenseFormat: "auto" | "horizontal" | "rectangle" | "vertical";
  budget: string;
  period: string;
  clicks: number;
  impressions: number;
  copy: string;
  destinationUrl: string;
  embedCode: string;
};

export type JobRequest = {
  id: string;
  trade: string;
  town: string;
  district: string;
  client: string;
  age: string;
  status: "Matching" | "Claimed" | "Needs review" | "Done";
  assignedTo: string;
  uploadedPhotos: number;
  cleanupEligible: boolean;
};

export type ArtisanJob = {
  id: string;
  title: string;
  town: string;
  distance: string;
  price: string;
  time: string;
  status: "New" | "Accepted" | "Scheduled" | "Done";
  note: string;
};

export type ActiveArtisan = {
  id: string;
  name: string;
  trade: string;
  town: string;
  status: "Live" | "Paused" | "Removed";
  badges: string[];
  reviews: number;
  flags: number;
};

export type ReviewItem = {
  id: string;
  artisan: string;
  client: string;
  rating: number;
  comment: string;
  status: "Visible" | "Hidden" | "Needs reply";
  age: string;
};

export type CommentThread = {
  id: string;
  artisan: string;
  job: string;
  lastMessage: string;
  status: "Open" | "Muted" | "Resolved";
};

export const pendingArtisans: PendingArtisan[] = [];

export const adPlacements: AdPlacement[] = [];

export const jobRequests: JobRequest[] = [];

export const artisanJobs: ArtisanJob[] = [];

export const activeArtisans: ActiveArtisan[] = [];

export const reviewItems: ReviewItem[] = [];

export const commentThreads: CommentThread[] = [];
