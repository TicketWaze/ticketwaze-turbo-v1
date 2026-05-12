"use client";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export default function CheckoutEmailAlert() {
  const t = useTranslations("Checkout.guestSuccess");
  useEffect(() => {
    toast.info(t("email_note"));
  }, []);
  return null;
}
