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
  format: "Native card" | "Banner link" | "Embed code";
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

export const pendingArtisans: PendingArtisan[] = [
  {
    id: "pa-101",
    name: "Meera Boodhoo",
    trade: "Peintre",
    town: "Curepipe",
    district: "Plaines Wilhems",
    submittedAt: "12 min",
    phone: "5822 4100",
    checks: ["NIC uploaded", "2 portfolio photos", "WhatsApp verified"],
    notes: "Specialises in interior repainting and rental refresh jobs.",
    badge: "Verified",
    risk: "Low",
  },
  {
    id: "pa-102",
    name: "Vikash Lalloo",
    trade: "Serrurier",
    town: "Goodlands",
    district: "Riviere du Rempart",
    submittedAt: "34 min",
    phone: "5760 8821",
    checks: ["NIC uploaded", "License pending", "No reviews yet"],
    notes: "Ask for one trade reference before approving emergency jobs.",
    badge: "Fast response",
    risk: "Review",
  },
  {
    id: "pa-103",
    name: "Zayd Peerally",
    trade: "Macon",
    town: "Mahebourg",
    district: "Grand Port",
    submittedAt: "1 h",
    phone: "5904 2241",
    checks: ["NIC uploaded", "Portfolio missing", "WhatsApp verified"],
    notes: "Good fit after adding completed work photos.",
    badge: "Fair price",
    risk: "Hold",
  },
];

export const adPlacements: AdPlacement[] = [
  {
    id: "ad-1",
    name: "Search card after 2 results",
    surface: "Search results",
    sponsor: "MauBank SME",
    status: "Live",
    format: "Native card",
    budget: "Rs 4,500",
    period: "Jun 3 - Jun 17",
    clicks: 68,
    impressions: 2240,
    copy: "SME loan support for tools, vehicles and stock.",
    destinationUrl: "https://octolabs.app/partners/maubank-sme",
    embedCode: "",
  },
  {
    id: "ad-2",
    name: "Request panel sponsor",
    surface: "Request panel",
    sponsor: "Phoenix Insurance",
    status: "Draft",
    format: "Banner link",
    budget: "Rs 2,000",
    period: "Starts Jun 10",
    clicks: 0,
    impressions: 0,
    copy: "Protect your next home repair with quick cover.",
    destinationUrl: "https://octolabs.app/partners/phoenix",
    embedCode: "",
  },
  {
    id: "ad-3",
    name: "Artisan dashboard tip",
    surface: "Artisan dashboard",
    sponsor: "Toolmart",
    status: "Paused",
    format: "Embed code",
    budget: "Rs 1,800",
    period: "Paused",
    clicks: 31,
    impressions: 940,
    copy: "Discounted drill bits and ladders this week.",
    destinationUrl: "https://octolabs.app/partners/toolmart",
    embedCode: "<ins data-ad-slot=\"artisan-dashboard-toolmart\"></ins>",
  },
];

export const jobRequests: JobRequest[] = [
  {
    id: "job-424",
    trade: "Plombier",
    town: "Beau Bassin",
    district: "Plaines Wilhems",
    client: "Nadia",
    age: "4 min",
    status: "Matching",
    assignedTo: "Ravi Choonum",
    uploadedPhotos: 1,
    cleanupEligible: false,
  },
  {
    id: "job-423",
    trade: "Electricien",
    town: "Moka",
    district: "Moka",
    client: "Sameer",
    age: "18 min",
    status: "Claimed",
    assignedTo: "Asha Ramdin",
    uploadedPhotos: 0,
    cleanupEligible: false,
  },
  {
    id: "job-422",
    trade: "Climatisation",
    town: "Grand Baie",
    district: "Riviere du Rempart",
    client: "Melissa",
    age: "41 min",
    status: "Needs review",
    assignedTo: "Kevin Bissessur",
    uploadedPhotos: 3,
    cleanupEligible: false,
  },
  {
    id: "job-421",
    trade: "Menuisier",
    town: "Rose Hill",
    district: "Plaines Wilhems",
    client: "Jean",
    age: "2 h",
    status: "Done",
    assignedTo: "Nawaz Peerun",
    uploadedPhotos: 4,
    cleanupEligible: true,
  },
];

export const artisanJobs: ArtisanJob[] = [
  {
    id: "aj-1",
    title: "Kitchen sink leak",
    town: "Quatre Bornes",
    distance: "2.4 km",
    price: "Rs 600 callout",
    time: "Today 15:30",
    status: "New",
    note: "Client sent photo. Leak under the sink after pipe replacement.",
  },
  {
    id: "aj-2",
    title: "Bathroom tap replacement",
    town: "Rose Hill",
    distance: "4.8 km",
    price: "Quote needed",
    time: "Tomorrow 09:00",
    status: "Scheduled",
    note: "Bring mixer tap options and confirm final price before work.",
  },
  {
    id: "aj-3",
    title: "Water pressure check",
    town: "Beau Bassin",
    distance: "3.1 km",
    price: "Rs 450 visit",
    time: "Today 17:00",
    status: "Accepted",
    note: "Low pressure in shower only. Possible clogged head or valve.",
  },
];

export const activeArtisans: ActiveArtisan[] = [
  {
    id: "art-1",
    name: "Ravi Choonum",
    trade: "Plombier",
    town: "Quatre Bornes",
    status: "Live",
    badges: ["Verified", "Fast response"],
    reviews: 42,
    flags: 0,
  },
  {
    id: "art-2",
    name: "Asha Ramdin",
    trade: "Electricien",
    town: "Moka",
    status: "Live",
    badges: ["Verified", "Top rated"],
    reviews: 31,
    flags: 0,
  },
  {
    id: "art-3",
    name: "Kevin Bissessur",
    trade: "Climatisation",
    town: "Grand Baie",
    status: "Paused",
    badges: ["Verified"],
    reviews: 28,
    flags: 1,
  },
];

export const reviewItems: ReviewItem[] = [
  {
    id: "rev-1",
    artisan: "Ravi Choonum",
    client: "Nadia",
    rating: 5,
    comment: "Fast response and clean repair. Uploaded before and after photos.",
    status: "Visible",
    age: "1 d",
  },
  {
    id: "rev-2",
    artisan: "Asha Ramdin",
    client: "Sameer",
    rating: 4,
    comment: "Good diagnostic, waiting for a final quote for extra work.",
    status: "Needs reply",
    age: "3 h",
  },
  {
    id: "rev-3",
    artisan: "Kevin Bissessur",
    client: "Melissa",
    rating: 2,
    comment: "Late arrival. Please review before this appears publicly.",
    status: "Hidden",
    age: "38 min",
  },
];

export const commentThreads: CommentThread[] = [
  {
    id: "thread-1",
    artisan: "Ravi Choonum",
    job: "Kitchen sink leak",
    lastMessage: "Can I add one after photo before closure?",
    status: "Open",
  },
  {
    id: "thread-2",
    artisan: "Asha Ramdin",
    job: "Room light wiring",
    lastMessage: "Client asked to reschedule to Saturday.",
    status: "Resolved",
  },
];
