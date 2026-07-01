import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";

export default function Loading() {
  return (
    <AttendeeLayout
      title=""
      className="h-full flex items-center justify-center"
    >
      <>
        <header className="w-full flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <div className="h-8 w-[16rem] bg-neutral-100 rounded-full animate-pulse" />
            <div className="h-[2.8rem] w-88 lg:w-120 bg-neutral-200 rounded-full animate-pulse mt-1" />
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex bg-neutral-100 rounded-[30px] w-[24.3rem] h-[4.4rem] animate-pulse" />
            <div className="w-[0.1rem] h-[1.8rem] bg-neutral-100" />
            <div className="w-14 h-14 bg-neutral-100 rounded-full animate-pulse lg:hidden" />
            <div className="w-14 h-14 bg-neutral-100 rounded-full animate-pulse" />
          </div>
        </header>

        <ul className="w-full list pt-4 h-screen overflow-hidden">
          {Array.from({ length: 6 }).map((_, index) => (
            <li key={index} className="mb-4">
              <div className="w-full rounded-2xl bg-neutral-100 animate-pulse p-4 flex lg:flex-col gap-4">
                <div className="w-62 h-62 lg:h-[19.1rem] rounded-xl bg-neutral-200 shrink-0 flex-1 lg:flex-auto " />
                <div className="flex flex-col gap-4 flex-1 lg:justify-center">
                  <div className="h-[1.9rem] w-3/4 bg-neutral-200 rounded-full" />
                  <div className="h-4 w-24 bg-neutral-200 rounded-full lg:w-full lg:h-[1.7rem]" />
                  <div className="h-[1.9rem] w-32 bg-neutral-200 rounded-full" />
                  <div className="h-[1.9rem] w-40 bg-neutral-200 rounded-full lg:w-32 lg:hidden" />
                  <div className="h-[1.9rem] w-10 bg-neutral-200 rounded-full lg:w-32 lg:hidden" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </>
    </AttendeeLayout>
  );
}

