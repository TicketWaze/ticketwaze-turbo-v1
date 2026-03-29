"use client";
import PageLoader from "@/components/PageLoader";
import { useRouter } from "@/i18n/navigation";
import { slugify } from "@/lib/Slugify";
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

  useEffect(function () {}, []);
  return (
    <>
      <PageLoader isLoading={true} />
    </>
  );
}
