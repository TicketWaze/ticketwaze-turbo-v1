import AdminLayout from "@/components/Layouts/AdminLayout";
import { auth } from "@/lib/auth";
import SupportDetailContent, {
  type SupportThreadDetail,
} from "./SupportDetailContent";

export default async function SupportThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const session = await auth();
  const { threadId } = await params;

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/support/${threadId}`,
    {
      method: "GET",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    },
  );

  const response = await request.json();
  const thread: SupportThreadDetail = response.thread;
  const chatUrl: string = response.chatUrl ?? "";

  return (
    <AdminLayout>
      <SupportDetailContent
        thread={thread}
        chatUrl={chatUrl}
        accessToken={session?.user.accessToken ?? ""}
      />
    </AdminLayout>
  );
}
