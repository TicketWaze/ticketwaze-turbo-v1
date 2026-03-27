import LoginPageContent from "./LoginPageContent";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ email: string | undefined }>;
}) {
  const { email } = await searchParams;
  return <LoginPageContent email={decodeURIComponent(email ?? "")} />;
}
