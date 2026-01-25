import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
export default function Loading() {
  return (
    <OrganizerLayout
      title=""
      className="h-full w-full flex flex-col overflow-y-scroll"
    >
      <div className="flex flex-col gap-4">
        <div className="bg-neutral-200 w-80 h-8 rounded-xl animate-pulse"></div>
        <div className="bg-neutral-200 w-120 lg:w-180 h-6 rounded-xl animate-pulse"></div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-neutral-200 h-50 w-full rounded-xl animate-pulse"></div>
        <div className="bg-neutral-200 h-50 w-full rounded-xl animate-pulse"></div>
        <div className="bg-neutral-200 h-50 w-full rounded-xl animate-pulse"></div>
        <div className="bg-neutral-200 h-50 w-full rounded-xl animate-pulse"></div>
      </div>
      <div className="pt-8">
        <div className="bg-neutral-200 w-95 h-8 rounded-xl animate-pulse mb-4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-neutral-200 h-100 w-full rounded-xl animate-pulse"></div>
          <div className="bg-neutral-200 h-100 w-full rounded-xl animate-pulse"></div>
        </div>
      </div>
      <div className="pt-8">
        <div className="bg-neutral-200 w-95 h-8 rounded-xl animate-pulse mb-4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-neutral-200 h-100 w-full rounded-xl animate-pulse"></div>
          <div className="bg-neutral-200 h-100 w-full rounded-xl animate-pulse"></div>
        </div>
      </div>
      <div className="pt-8">
        <div className="bg-neutral-200 w-95 h-8 rounded-xl animate-pulse mb-4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-neutral-200 h-50 w-full rounded-xl animate-pulse"></div>
          <div className="bg-neutral-200 h-50 w-full rounded-xl animate-pulse"></div>
        </div>
      </div>
    </OrganizerLayout>
  );
}
