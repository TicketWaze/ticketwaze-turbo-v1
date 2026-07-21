import AttendeeLayout from "@/components/Layouts/AttendeeLayout";

export default function Loading() {
  return (
    <AttendeeLayout
      title=""
      className="h-full flex items-center justify-center"
    >
      <>
        {/* Header */}
        <header className="w-full flex items-center justify-between">
          <div className="flex flex-col gap-2">
            {/* Subtitle */}
            <div className="h-[1.6rem] w-48 lg:w-[16rem] bg-neutral-100 rounded-full animate-pulse" />
            {/* Title */}
            <div className="h-[2.4rem] lg:h-[3.2rem] w-[18rem] lg:w-120 bg-neutral-200 rounded-full animate-pulse mt-1" />
          </div>

          <div className="flex items-center gap-4">
            {/* Search bar — desktop */}
            <div className="hidden lg:flex bg-neutral-100 rounded-[30px] w-[24.3rem] h-[4.4rem] animate-pulse" />
            {/* Search icon — mobile */}
            <div className="w-14 h-14 bg-neutral-100 rounded-full animate-pulse lg:hidden" />
          </div>
        </header>

        {/* HistoryCard list */}
        <ul className="w-full list pt-4 flex flex-col gap-4 h-screen overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i}>
              <div className="w-full rounded-2xl bg-neutral-100 animate-pulse p-3 lg:p-4 flex flex-col gap-3 lg:gap-4">
                {/* Image */}
                <div className="w-full h-60 lg:h-[19.1rem] rounded-xl bg-neutral-200 shrink-0 mb-8" />
                <div className="flex flex-col gap-4 flex-1 justify-center">
                  <div className="h-[1.9rem] w-3/4 bg-neutral-200 rounded-full" />

                  <div className="flex justify-between">
                    <div className="h-[1.7rem] w-40 bg-neutral-200 rounded-full" />
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-6 lg:h-6 bg-neutral-200 rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </>
    </AttendeeLayout>
  );
}
