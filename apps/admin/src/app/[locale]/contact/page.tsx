import { auth } from "@/lib/auth";
import ContactPageContent, { type ContactMessagesResponse } from "./ContactPageContent";

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; resolved?: string }>;
}) {
  const session = await auth();
  const { page, resolved } = await searchParams;

  const resolvedFilter = resolved ?? "false";

  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/contact?page=${page ?? "1"}&limit=15&resolved=${resolvedFilter}`,
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
  const messages: ContactMessagesResponse = response.messages ?? {
    data: [],
    meta: {
      total: 0,
      perPage: 15,
      currentPage: 1,
      lastPage: 1,
      firstPage: 1,
      firstPageUrl: null,
      lastPageUrl: null,
      nextPageUrl: null,
      previousPageUrl: null,
    },
  };

  return (
    <ContactPageContent
      messages={messages}
      resolved={resolvedFilter}
      accessToken={session?.user.accessToken ?? ""}
    />
  );
}
