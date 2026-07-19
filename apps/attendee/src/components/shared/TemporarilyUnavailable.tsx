import BrandedLoader from "./BrandedLoader";

type Props = {
  title?: string;
  description?: string;
};

export default function TemporarilyUnavailable({ title, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-14 select-none">
      <BrandedLoader />

      {/* ── Text ── */}
      <div className="flex flex-col gap-4 items-center text-center max-w-[38rem] px-4">
        <h2 className="text-[2rem] font-semibold leading-snug text-deep-100">
          {title}
        </h2>
        <p className="text-[1.45rem] leading-[2.5rem] text-neutral-500">
          {description}
        </p>
      </div>
    </div>
  );
}
