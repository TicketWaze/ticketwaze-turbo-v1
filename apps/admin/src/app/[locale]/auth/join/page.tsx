import JoinPageContent from "./JoinPageContent";

export type InvitationLookup =
  | { status: "ok"; email: string }
  | { status: "invalid"; code: string };

/** GET /auth/admin/invitation/:token — the masked email, or why the link can't be used. */
async function lookupInvitation(token: string | undefined): Promise<InvitationLookup> {
  if (!token) return { status: "invalid", code: "INVITATION_NOT_FOUND" };
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/admin/invitation/${encodeURIComponent(token)}`,
    { cache: "no-store" },
  ).catch(() => null);
  const data = await response?.json().catch(() => null);
  if (data?.status === "success") return { status: "ok", email: String(data.email) };
  return { status: "invalid", code: String(data?.code ?? "INVITATION_NOT_FOUND") };
}

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const invitation = await lookupInvitation(token);
  return <JoinPageContent token={token ?? ""} invitation={invitation} />;
}
