import AttendeeLayout from "@/components/Layouts/AttendeeLayout";

export default function Loading() {
  return (
    <AttendeeLayout
      title=""
      className="h-full flex items-center justify-center"
    >
      <>
        <div className="w-full flex items-center gap-4 mb-2">
          <div className="h-[2.4rem] w-56 bg-neutral-200 rounded-full animate-pulse" />
        </div>

        <div className="flex flex-col gap-16 w-full lg:w-212 mx-auto overflow-hidden h-screen">
          {/* UserInterest */}
          <Section>
            <SectionTitle width="w-48"/>
            <div className="flex flex-wrap gap-6 mt-10">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-[10px] bg-neutral-100 animate-pulse"
                  style={{ width: `${70 + (i % 3) * 20}px` }}
                />
              ))}
            </div>
            <div className="h-20 rounded-full bg-neutral-100 animate-pulse"></div>
          </Section>

          {/* AppLanguage */}
          <Section>
            <SectionTitle width="w-[10rem]" />
            <div className="flex flex-col gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <RowItem key={i} />
              ))}
            </div>
          </Section>

          {/* UserPreferences */}
          <Section>
            <SectionTitle width="w-[140px]" />
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <RowItem key={i}  />
              ))}
            </div>
          </Section>

          {/* EmailNotifications */}
          <Section>
            <SectionTitle width="w-[160px]" />
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <RowItem key={i} />
              ))}
            </div>
          </Section>
        </div>
      </>
    </AttendeeLayout>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-6">{children}</div>;
}

function SectionTitle({ width }: { width: string }) {
  return (
    <div
      className={`h-[1.9rem] ${width} bg-neutral-200 rounded-full animate-pulse`}
    />
  );
}

function RowItem() {
  return (
    <div className="w-full flex items-center justify-between bg-neutral-100 rounded-2xl p-4 animate-pulse">
      <div className="h-6 w-56 bg-neutral-200 rounded-full" />
      <div className="h-12 w-12 bg-neutral-200 rounded-full" />
    </div>
  );
}
