import OrganizerLayout from "@/components/Layouts/OrganizerLayout";

const pulse = "bg-neutral-200 animate-pulse";

/** Mirrors Initiate Withdrawal: Back, title + stepper, the summary card. */
export default function Loading() {
  return (
    <OrganizerLayout
      title=""
      className="h-full w-full flex flex-col overflow-hidden"
    >
      <div className="flex flex-col gap-12 h-full">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <div className={`${pulse} size-[3.5rem] rounded-full`} />
            <div className={`${pulse} w-20 h-6 rounded-lg`} />
          </div>
          <div className="flex items-center justify-between gap-6">
            <div className={`${pulse} w-[26rem] h-12 rounded-xl`} />
            <div
              className={`${pulse} hidden lg:block w-[58rem] h-6 rounded-full`}
            />
          </div>
        </div>
        <div className="w-full max-w-[54rem] mx-auto border border-neutral-100 rounded-[1.5rem] p-6 flex flex-col gap-6">
          <div className={`${pulse} h-[13rem] rounded-[1.5rem]`} />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex justify-between">
              <div className={`${pulse} w-28 h-6 rounded-lg`} />
              <div className={`${pulse} w-36 h-6 rounded-lg`} />
            </div>
          ))}
        </div>
        <div
          className={`${pulse} hidden lg:block w-full max-w-[54rem] mx-auto h-[6rem] rounded-[10rem] mt-auto mb-8`}
        />
      </div>
    </OrganizerLayout>
  );
}
