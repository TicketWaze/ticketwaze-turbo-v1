import OrganizerLayout from "@/components/Layouts/OrganizerLayout";

/** Mirrors the page: header + filters, KPI row, then the two-panel sections. */
export default function Loading() {
  const block = "bg-neutral-200 rounded-xl animate-pulse";
  return (
    <OrganizerLayout
      title=""
      className="h-full w-full flex flex-col overflow-hidden"
    >
      <div className="flex flex-col gap-16">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3">
            <div className={`${block} w-80 h-12`} />
            <div className={`${block} w-120 lg:w-180 h-6`} />
          </div>
          <div className="flex gap-4">
            <div className={`${block} w-[13rem] h-14 rounded-[3rem]`} />
            <div className={`${block} w-[12rem] h-14 rounded-[3rem]`} />
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className={`${block} w-40 h-6`} />
              <div className={`${block} w-56 h-12`} />
            </div>
          ))}
        </div>
        {[0, 1].map((s) => (
          <div key={s} className="flex flex-col gap-10">
            <div className={`${block} w-95 h-10`} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className={`${block} h-[20rem]`} />
              <div className={`${block} h-[20rem]`} />
            </div>
          </div>
        ))}
      </div>
    </OrganizerLayout>
  );
}
