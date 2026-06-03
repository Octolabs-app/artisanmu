import { AdminRedirect } from "@/components/admin-redirect";

export const metadata = {
  title: "Admin moved",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OpsPage() {
  return <AdminRedirect />;
}
