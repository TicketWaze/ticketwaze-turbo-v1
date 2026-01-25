import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import React from "react";

export default function Loading() {
  return (
    <OrganizerLayout
      title=""
      className="h-full flex items-center justify-center"
    >
      <LoadingCircleSmall />
    </OrganizerLayout>
  );
}
