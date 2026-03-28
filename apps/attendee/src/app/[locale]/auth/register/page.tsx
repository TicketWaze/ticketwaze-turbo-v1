import RegisterPageComponent from "./RegisterPageComponent";
import { cookies } from "next/headers";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ email: string | undefined }>;
}) {
  const { email } = await searchParams;
  const cookieStore = await cookies();
  const referralCode = cookieStore.get("referral_code")?.value;
  return (
    <RegisterPageComponent
      referralCode={referralCode}
      email={decodeURIComponent(email ?? "")}
    />
  );
}
