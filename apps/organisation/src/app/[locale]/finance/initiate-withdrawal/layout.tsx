import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import KycGateView from "@/components/kyc/KycGateView";
import { getKycAccess } from "@/lib/kycServer";

// Locked until the organisation's KYC is approved (the API refuses too).
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const kyc = await getKycAccess();
  if (kyc && kyc.status !== "approved") {
    return (
      <OrganizerLayout title="">
        <KycGateView
          action="withdraw"
          status={kyc.status}
          canVerify={kyc.canVerify}
        />
      </OrganizerLayout>
    );
  }
  return children;
}
