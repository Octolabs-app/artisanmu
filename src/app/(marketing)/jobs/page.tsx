import { JobsBoard } from "@/components/jobs-board";

export const metadata = {
  title: "Job board",
  description:
    "Browse all open client requests across Mauritius. Verified artisans can claim jobs and contact clients on WhatsApp.",
  alternates: { canonical: "/jobs" },
};

export default function JobsPage() {
  return <JobsBoard />;
}
