import ForgotPasswordPageWrapper from "./ForgotPasswordPageWrapper";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email: string | undefined }>;
}) {
  const { email } = await searchParams;
  return <ForgotPasswordPageWrapper email={email} />;
}
