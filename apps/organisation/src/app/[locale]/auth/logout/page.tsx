"use client";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { signOut } from "next-auth/react";

export default function SignoutPage() {
  signOut({
    redirect: true,
    redirectTo: process.env.NEXT_PUBLIC_ORGANISATION_URL,
  });
  <div className="h-full flex items-center justify-center">
    <LoadingCircleSmall />
  </div>;
}
