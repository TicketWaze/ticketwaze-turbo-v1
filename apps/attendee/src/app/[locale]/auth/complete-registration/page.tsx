import jwt, { JwtPayload } from "jsonwebtoken";
import CompleteRegistrationForm from "./CompleteRegistrationForm";
import { cookies } from "next/headers";

export default async function CompleteRegistrationPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const accessToken = (await searchParams).accessToken as string;
  const decoded = jwt.verify(
    accessToken ?? "",
    process.env.NEXT_PUBLIC_JWT_SECRET ?? ""
  );
  const { type, iat, exp, ...user } = decoded as JwtPayload;
  const cookieStore = await cookies();
  const referralCode = cookieStore.get("referral_code")?.value;
  return (
    <>
      <CompleteRegistrationForm
        email={user.email}
        password={user.password}
        accessToken={accessToken}
        referralCode={referralCode}
      />
    </>
  );
}
