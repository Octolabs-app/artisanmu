import { HowItWorksView } from "@/components/how-it-works-view";

export const metadata = {
  title: "How it works",
  description: "Describe the job, get matched with verified artisans near you, then chat and book on WhatsApp.",
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorksPage() {
  return <HowItWorksView />;
}
