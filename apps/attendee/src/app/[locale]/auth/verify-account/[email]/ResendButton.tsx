"use client";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { useLocale, useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

export default function ResendButton({ email }: { email: string }) {
  const t = useTranslations("Auth.verify");
  const [isLoading, setIsloading] = useState(false);
  const locale = useLocale();
  const [host, setHost] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHost(window.location.host);
    }
  }, []);

  async function ResendEmail() {
    setIsloading(true);
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/register/resend-email-verification/${email}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
          Origin: host,
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
    <button
      disabled={isLoading}
      className={
        "border-2 cursor-pointer border-primary-500 px-[3rem] py-6 rounded-[10rem] font-normal text-primary-500 text-[1.5rem] leading-[20px] bg-primary-100 disabled:cursor-not-allowed disabled:border-neutral-600 disabled:text-neutral-600 disabled:bg-neutral-400"
      }
      onClick={ResendEmail}
    >
      {isLoading ? <LoadingCircleSmall /> : t("footer.cta")}
    </button>
  );
}
