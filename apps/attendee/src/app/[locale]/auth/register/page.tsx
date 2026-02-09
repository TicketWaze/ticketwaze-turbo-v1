import RegisterPageComponent from "./RegisterPageComponent";
import { cookies } from "next/headers";

export default async function RegisterPage() {
  const cookieStore = await cookies();
  const referralCode = cookieStore.get("referral_code")?.value;
  return <RegisterPageComponent referralCode={referralCode} />;
}
