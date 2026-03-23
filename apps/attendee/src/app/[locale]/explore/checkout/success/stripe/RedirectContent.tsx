"use client";
import PageLoader from "@/components/PageLoader";
import { useRouter } from "@/i18n/navigation";
import { slugify } from "@/lib/slugify";
import { User } from "@ticketwaze/typescript-config";
import { useEffect } from "react";
import { toast } from "sonner";

export default function RedirectContent({
  orderId,
  user,
}: {
  orderId: string;
  user: User;
}) {
  const router = useRouter();

  useEffect(function () {
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/payments/stripe/success/${orderId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.accessToken}`,
        },
      },
    )
      .then((res) => res.json())
      .then((res) => {
        if (res.status === "success") {
          toast.success("Success");
          router.push(
            `/upcoming/${slugify(res.event.eventName, res.event.eventId)}`,
          );
        } else {
          toast.error("Failed to retrieve payment");
          router.push(
            `/explore/${slugify(res.event.eventName, res.event.eventId)}`,
          );
        }
      });
  }, []);
  return (
    <>
      <PageLoader isLoading={true} />
    </>
  );
}
