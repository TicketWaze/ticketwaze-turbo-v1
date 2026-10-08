import AdminLayout from "@/components/Layouts/AdminLayout";
import { auth } from "@/lib/auth";
import FetchFailedErrorView from "@/components/shared/FetchFailedErrorView";
import ContactDetailContent from "./ContactDetailContent";
import { type ContactMessage } from "../ContactPageContent";

export default async function ContactMessagePage({
  params,
}: {
  params: Promise<{ contactMessageId: string }>;
}) {
  const session = await auth();
  const { contactMessageId } = await params;

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/contact/${contactMessageId}`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    },
  );

  const response = await request.json().catch(() => null);
  const message: ContactMessage | undefined = response?.message;
  if (!request.ok || !message) {
    return (
      <AdminLayout>
        <FetchFailedErrorView />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <ContactDetailContent
        message={message}
        accessToken={session?.user.accessToken ?? ""}
      />
    </AdminLayout>
  );
}
