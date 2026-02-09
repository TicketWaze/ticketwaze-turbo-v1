import PageContent from "./PageContent";

export default async function VerifyAccountPage({
  params,
}: {
  params: Promise<{ email: string }>;
}) {
  const { email } = await params;
  return <PageContent email={email} />;
}
