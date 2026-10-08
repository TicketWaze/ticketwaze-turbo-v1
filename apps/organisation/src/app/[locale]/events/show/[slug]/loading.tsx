import OrganizerLayout from "@/components/Layouts/OrganizerLayout";

const pulse = "bg-neutral-200 animate-pulse";

/** Mirrors the event page: Back, title + actions, four KPIs, toolbar, rows. */
export default function Loading() {
  return (
    <OrganizerLayout
      title=""
      className="h-full w-full flex flex-col overflow-hidden"
    >
      <div className="flex flex-col gap-12 lg:gap-16">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <div className={`${pulse} size-[3.5rem] rounded-full`} />
            <div className={`${pulse} w-20 h-6 rounded-lg`} />
          </div>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div
              className={`${pulse} w-[26rem] lg:w-[36rem] h-12 rounded-xl`}
            />
            <div className="flex items-center gap-4">
              <div className={`${pulse} w-[12rem] h-[3.5rem] rounded-[3rem]`} />
              <div className={`${pulse} w-[11rem] h-[3.5rem] rounded-[3rem]`} />
              <div
                className={`${pulse} hidden lg:block w-[13rem] h-[3.5rem] rounded-[3rem]`}
              />
              <div
                className={`${pulse} size-[3.5rem] rounded-full ml-auto lg:ml-0`}
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 border-b border-neutral-100 pb-8 lg:pb-10 lg:divide-x divide-neutral-100">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex flex-col gap-4 lg:px-[2.5rem] first:lg:pl-0"
            >
              <div className={`${pulse} w-28 h-6 rounded-lg`} />
              <div className={`${pulse} w-40 h-10 rounded-lg`} />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between gap-6">
          <div
            className={`${pulse} hidden lg:block h-[4.5rem] w-[30rem] rounded-[3rem]`}
          />
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <div
              className={`${pulse} hidden lg:block h-[3.5rem] w-[11rem] rounded-[3rem]`}
            />
            <div
              className={`${pulse} h-[3.5rem] flex-1 lg:flex-none lg:w-[24.3rem] rounded-[3rem]`}
            />
            <div className={`${pulse} lg:hidden size-[3.5rem] rounded-full`} />
          </div>
        </div>
        <div className="flex flex-col">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="grid grid-cols-2 lg:grid-cols-6 gap-6 py-6 border-b border-neutral-100"
            >
              {[0, 1, 2, 3, 4, 5].map((c) => (
                <div
                  key={c}
                  className={`${pulse} h-6 rounded-lg ${c > 1 ? "hidden lg:block" : ""}`}
                  style={{ width: `${55 + ((i + c) % 4) * 10}%` }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </OrganizerLayout>
  );
}
