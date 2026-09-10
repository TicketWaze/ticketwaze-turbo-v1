import { auth } from "@/lib/auth";
import AdminLayout from "@/components/Layouts/AdminLayout";
import CampaignComposer from "../components/CampaignComposer";

export default async function NewEmailPage() {
  const session = await auth();

  return (
    <AdminLayout>
      <CampaignComposer accessToken={session?.user.accessToken ?? ""} />
    </AdminLayout>
  );
}
