import { AdminAccessGate } from "@/components/admin-access-gate";

export const metadata = {
  title: "ArtisanMU Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return <AdminAccessGate />;
}
