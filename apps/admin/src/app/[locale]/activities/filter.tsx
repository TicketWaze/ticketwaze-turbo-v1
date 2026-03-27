import { cn } from "@/lib/utils";
import ArrowDown from "@ticketwaze/ui/assets/icons/arrow-down.svg";
import { useTranslations } from "next-intl";
import Image from "next/image";

export default function Filter({
  filter,
  children,
  className,
}: {
  filter: String;
  children?: React.ReactNode;
  className?: string;
}) {
  const t = useTranslations("Activities");
  return (
    <div className={cn("", className)}>
      <div
        className={
          "flex items-center gap-2 bg-neutral-100 py-3 px-6 rounded-[3rem] text-neutral-700 shrink-0 whitespace-nowrap text-base font-normal font-sans leading-8 text-[14px]"
        }
      >
        {filter}
        <Image src={ArrowDown} alt="arrow down" width={20} height={20} />
        {" "}
      </div>
    </div>
  );
}
