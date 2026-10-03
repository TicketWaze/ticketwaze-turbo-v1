import InvitationWrapper from "./InvitationWrapper";

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <InvitationWrapper token={token} />;
}
