import OrganizerLayout from "@/components/Layouts/OrganizerLayout";

export default function Loading() {
  return (
    <OrganizerLayout title="" className="h-full flex flex-col">
      <div className="flex gap-4 items-center">
        <div className="bg-neutral-200 w-15 h-15 rounded-full animate-pulse"></div>
        <div className="bg-neutral-200 w-120 lg:w-25 h-6 rounded-xl animate-pulse"></div>
      </div>
      <div className="pt-8 flex flex-col gap-12 ">
        <div className="flex items-center justify-between gap-8">
          <div className="bg-neutral-200 w-120 lg:w-50 h-10 rounded-xl animate-pulse"></div>
          <div className="bg-neutral-200 w-120 lg:w-50 h-10 rounded-xl animate-pulse"></div>
        </div>
        <div className=" flex flex-col gap-8">
          <div className="bg-neutral-200 full h-10 rounded-xl animate-pulse"></div>
          <div className="bg-neutral-200 full h-10 rounded-xl animate-pulse"></div>
          <div className="bg-neutral-200 full h-10 rounded-xl animate-pulse"></div>
          <div className="bg-neutral-200 full h-10 rounded-xl animate-pulse"></div>
          <div className="bg-neutral-200 full h-10 rounded-xl animate-pulse"></div>
          <div className="bg-neutral-200 full h-10 rounded-xl animate-pulse"></div>
          <div className="bg-neutral-200 full h-10 rounded-xl animate-pulse"></div>
          <div className="bg-neutral-200 full h-10 rounded-xl animate-pulse"></div>
          <div className="bg-neutral-200 full h-10 rounded-xl animate-pulse"></div>
          <div className="bg-neutral-200 full h-10 rounded-xl animate-pulse"></div>
          <div className="bg-neutral-200 full h-10 rounded-xl animate-pulse"></div>
        </div>
      </div>
    </OrganizerLayout>
  );
}
