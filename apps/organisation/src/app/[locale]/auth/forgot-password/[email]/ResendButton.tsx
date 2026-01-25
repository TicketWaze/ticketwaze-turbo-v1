"use client";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

export default function ResendButton({ email }: { email: string }) {
  const t = useTranslations("Auth.email_sent");
  const [isLoading, setIsloading] = useState(false);
  const locale = useLocale();
  async function ResendEmail() {
    setIsloading(true);
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password/resend-forgot-email/${email}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
          Origin: process.env.NEXT_PUBLIC_ORGANISATION_URL!,
        },
      },
    );
    const response = await request.json();

    if (response.status === "warning") {
      toast.warning(response.message);
    } else {
      toast.success("Email sent");
    }
    setIsloading(false);
  }
  return (
    <div
      className={
        "flex items-center gap-[1.8rem] border border-neutral-100 p-4 rounded-[10rem] mb-8"
      }
    >
      <span
        className={
          "font-normal text-[1.8rem] leading-10 text-center text-neutral-700"
        }
      >
        {t("footer.text")}
      </span>
      <button
        onClick={ResendEmail}
        disabled={isLoading}
        className={
          "border-2 border-primary-500 px-12 py-6 rounded-[10rem] font-normal text-primary-500 text-[1.5rem] leading-8 bg-primary-100 cursor-pointer"
        }
      >
        {isLoading ? <LoadingCircleSmall /> : t("footer.cta")}
      </button>
    </div>
  );
}
