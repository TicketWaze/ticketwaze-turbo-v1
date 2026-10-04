import OrganizerLayout from "@/components/Layouts/OrganizerLayout";

const pulse = "bg-neutral-200 animate-pulse";

function TableSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-6">
        <div className={`${pulse} w-[20rem] h-8 rounded-xl`} />
        <div className="hidden lg:flex gap-4">
          <div className={`${pulse} w-[11rem] h-[3.5rem] rounded-[3rem]`} />
          <div className={`${pulse} w-[24.3rem] h-[3.5rem] rounded-[3rem]`} />
        </div>
      </div>
      <div className="flex flex-col">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="grid grid-cols-2 lg:grid-cols-5 gap-6 py-6 border-b border-neutral-100"
          >
            {[0, 1, 2, 3, 4].map((c) => (
              <div
                key={c}
                className={`${pulse} h-6 rounded-lg ${c > 1 ? "hidden lg:block" : ""}`}
                style={{ width: `${50 + ((i + c) % 4) * 12}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Mirrors Finance: title + button, the three figures, two tables. */
export default function Loading() {
  return (
    <OrganizerLayout title="">
      <div className="flex flex-col gap-12 lg:gap-16">
        <div className="flex items-center justify-between">
          <div className={`${pulse} w-[14rem] h-12 rounded-xl`} />
          <div
            className={`${pulse} hidden lg:block w-[18rem] h-[4rem] rounded-[3rem]`}
          />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 border-b border-neutral-100 pb-10">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`flex flex-col gap-3 ${i === 2 ? "col-span-2 lg:col-span-1" : ""}`}
            >
              <div className={`${pulse} w-28 h-6 rounded-lg`} />
              <div className={`${pulse} w-44 h-10 rounded-lg`} />
            </div>
          ))}
        </div>
        <TableSkeleton />
        <TableSkeleton />
      </div>
    </OrganizerLayout>
  );
}

export { TableSkeleton };
