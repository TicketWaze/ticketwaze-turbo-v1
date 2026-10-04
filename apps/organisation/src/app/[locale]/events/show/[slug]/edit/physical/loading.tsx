import OrganizerLayout from "@/components/Layouts/OrganizerLayout";

const pulse = "bg-neutral-200 animate-pulse";

/** Mirrors the edit form: Back, title + stepper, then the section cards. */
export default function Loading() {
  return (
    <OrganizerLayout
      title=""
      className="h-full w-full flex flex-col overflow-hidden"
    >
      <div className="flex flex-col gap-10">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <div className={`${pulse} size-[3.5rem] rounded-full`} />
            <div className={`${pulse} w-20 h-6 rounded-lg`} />
          </div>
          <div className="flex items-center justify-between gap-8">
            <div className={`${pulse} w-[22rem] h-12 rounded-xl`} />
            <div className={`${pulse} hidden lg:block w-[58rem] h-6 rounded-full`} />
          </div>
        </div>
        {[22, 10, 18].map((h, i) => (
          <div
            key={i}
            className="w-full max-w-[54rem] mx-auto border border-neutral-100 rounded-[1.5rem] p-6 flex flex-col gap-6"
          >
            <div className={`${pulse} w-40 h-7 rounded-lg`} />
            <div className={`${pulse} w-full rounded-[2rem]`} style={{ height: `${h}rem` }} />
          </div>
        ))}
      </div>
    </OrganizerLayout>
  );
}
