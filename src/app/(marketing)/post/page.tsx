import { PostJobView } from "@/components/post-job-view";

export const metadata = {
  title: "Post a job",
  description: "Post your job once and let verified artisans in Mauritius reach you on WhatsApp. Free to post.",
  alternates: { canonical: "/post" },
};

export default function PostJobPage() {
  return <PostJobView />;
}
