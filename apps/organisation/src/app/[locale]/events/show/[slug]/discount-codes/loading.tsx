import OrganizerLayout from "@/components/Layouts/OrganizerLayout";

const pulse = "bg-neutral-200 animate-pulse";

/** Mirrors the codes page: Back, title + button, tabs, rows. */
export default function Loading() {
  return (
    <OrganizerLayout title="">
      <div className="flex flex-col gap-10 lg:gap-12">
        <div className="flex items-center gap-4">
          <div className={`${pulse} size-[3.5rem] rounded-full`} />
          <div className={`${pulse} w-20 h-6 rounded-lg`} />
        </div>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3">
            <div className={`${pulse} w-[22rem] h-12 rounded-xl`} />
            <div className={`${pulse} w-[28rem] h-6 rounded-lg`} />
          </div>
          <div className={`${pulse} w-[18rem] h-[3.5rem] rounded-[3rem]`} />
        </div>
        <div className={`${pulse} w-[30rem] h-[4.5rem] rounded-[3rem]`} />
        <div className="flex flex-col">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="grid grid-cols-3 lg:grid-cols-6 gap-6 py-6 border-b border-neutral-100"
            >
              {[0, 1, 2, 3, 4, 5].map((c) => (
                <div
                  key={c}
                  className={`${pulse} h-6 rounded-lg ${c > 0 && c < 4 ? "hidden lg:block" : ""}`}
                  style={{ width: `${50 + ((i + c) % 4) * 12}%` }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </OrganizerLayout>
  );
}
