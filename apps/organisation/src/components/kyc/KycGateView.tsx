import { getTranslations } from "next-intl/server";
import { Clock, ShieldSecurity } from "iconsax-reactjs";
import type { KycStatus } from "@ticketwaze/typescript-config";
import { LinkPrimary, LinkSecondary } from "@/components/shared/Links";

/**
 * Shown instead of Create Activity / Initiate Withdrawal while the
 * organisation's KYC isn't approved. The API refuses those actions anyway;
 * this says why and where to go.
 */
export default async function KycGateView({
  action,
  status,
  canVerify,
}: {
  action: "create" | "withdraw";
  status: KycStatus;
  canVerify: boolean;
}) {
  const t = await getTranslations("Auth.kyc");
  const pending = status === "pending";
  const Icon = pending ? Clock : ShieldSecurity;
  return (
    <div className="flex-1 flex items-center justify-center py-20 px-6">
      <div className="max-w-[48rem] w-full flex flex-col items-center gap-10 text-center">
        <div className="w-[100px] h-[100px] rounded-full flex items-center justify-center bg-primary-50">
          <div className="w-[70px] h-[70px] rounded-full flex items-center justify-center bg-primary-100">
            <Icon size="32" color="#E45B00" variant="Bulk" />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="font-primary font-medium text-[2.6rem] leading-[3.2rem] text-black">
            {pending
              ? t("pending.title")
              : t(action === "create" ? "gate.create_title" : "gate.withdraw_title")}
          </h2>
          <p className="text-[1.5rem] leading-[2.5rem] text-neutral-700">
            {pending
              ? t("gate.pending_description")
              : canVerify
                ? t("gate.description")
                : t("banner.member")}
          </p>
        </div>
        <div className="w-full flex flex-col gap-4">
          {!pending && canVerify && (
            <LinkPrimary
              href="/auth/verification"
              className="w-full flex justify-center"
            >
              {status === "rejected" ? t("banner.resubmit") : t("gate.verify")}
            </LinkPrimary>
          )}
          <LinkSecondary href="/analytics" className="w-full flex justify-center">
            {t("gate.back")}
          </LinkSecondary>
        </div>
      </div>
    </div>
  );
}
