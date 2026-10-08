import { Bone, SkeletonPage, TextBone } from "./Skeleton";

export type Control = "checkbox" | "toggle" | "radio" | "arrow";

/** The control at the end of a SettingRows row, at its real size. */
function ControlBone({ control }: { control: Control }) {
  if (control === "toggle") return <Bone className="w-20 h-12" />;
  if (control === "radio") return <Bone round className="w-12 h-12" />;
  return <Bone className="w-12 h-12 rounded-[0.6rem]" />;
}

/** A SettingRows section: title, then rows split by 2px rules. */
export function SettingsSectionBone({
  rows,
  control,
  titleWidth = "w-48",
}: {
  rows: number;
  control: Control;
  titleWidth?: string;
}) {
  return (
    <div className="flex flex-col">
      <TextBone line="h-10 mb-6" className={`h-[1.8rem] ${titleWidth}`} strong />
      <div className="flex flex-col divide-y-2 divide-neutral-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="w-full flex items-center justify-between gap-6 py-6">
            <TextBone className={["w-40", "w-56", "w-32", "w-48"][i % 4] + " h-[1.4rem]"} />
            <ControlBone control={control} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** A password form block: title, three 6rem password inputs. */
export function PasswordFormBone() {
  return (
    <div className="flex flex-col gap-8">
      <TextBone line="h-10" className="h-[1.8rem] w-48" strong />
      <Bone className="h-[6rem] w-full" />
      <Bone className="h-[6rem] w-full" />
      <Bone className="h-[6rem] w-full" />
      <TextBone className="w-40 self-end" />
    </div>
  );
}

/** SimpleTopbar + the centred 21.2rem-wide settings column. */
export default function SettingsSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <SkeletonPage>
      <header className="w-full flex items-center justify-between">
        <TextBone line="h-[2.5rem] lg:h-12" className="h-[1.8rem] lg:h-[2.6rem] w-[16rem]" strong />
      </header>
      <div className="flex flex-col w-full lg:w-212 mx-auto lg:overflow-hidden lg:h-full">
        <div className="flex flex-col gap-16">{children}</div>
      </div>
    </SkeletonPage>
  );
}
