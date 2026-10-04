import OrganizerLayout from "@/components/Layouts/OrganizerLayout";

/** Mirrors the list's layout: title + search + create, pills + filters, cards. */
export default function Loading() {
  return (
    <OrganizerLayout
      title=""
      className="h-full w-full flex flex-col overflow-hidden"
    >
      <div className="flex flex-col gap-10">
        <div className="flex items-center justify-between gap-8">
          <div className="bg-neutral-200 w-80 h-12 rounded-xl animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="hidden lg:block bg-neutral-200 w-[24.3rem] h-14 rounded-[3rem] animate-pulse" />
            <div className="lg:hidden bg-neutral-200 size-[3.5rem] rounded-full animate-pulse" />
            <div className="lg:hidden bg-neutral-200 size-[3.5rem] rounded-full animate-pulse" />
            <div className="hidden lg:block bg-neutral-200 w-[14.6rem] h-[4.5rem] rounded-[3rem] animate-pulse" />
          </div>
        </div>
        <div className="flex items-center justify-between gap-6">
          <div className="bg-neutral-200 h-[4.5rem] w-[31.8rem] rounded-[3rem] animate-pulse" />
          <div className="hidden lg:flex gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-neutral-200 h-14 w-[10rem] rounded-[3rem] animate-pulse" />
            ))}
          </div>
        </div>
        <div className="list [--grid-item--min-width:25.5rem] gap-y-8">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="bg-neutral-200 h-[16.5rem] lg:h-[28rem] rounded-[1rem] animate-pulse" />
          ))}
        </div>
      </div>
    </OrganizerLayout>
  );
}
