import { cn } from "@/lib/utils";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";

export default function ActivitiesPageTopbar({
  title,
  filter,
  className,
}: {
  className?: string;
  title: string;
  filter: string;
}) {
  return (
    <div className={cn("", className)}>
      <div
        className={
          "flex flex-col gap-8 items-start lg:flex-row lg:items-center lg:justify-between"
        }
      >
        <div className="flex justify-between w-full">
          <h3
            className={
              "font-medium inline-flex items-center gap-2 font-primary text-[2.6rem] leading-12 text-black"
            }
          >
            {title}
          </h3>
          <Select defaultValue="this_month">
            <SelectTrigger className="bg-neutral-100 cursor-pointer rounded-[3rem] py-[0.8rem] px-6 border-none w-fit text-[1.4rem] text-neutral-700 leading-8">
              <SelectValue placeholder="" />
            </SelectTrigger>
            <SelectContent className={"bg-neutral-100 text-[1.4rem]"}>
              <SelectGroup>
                <SelectItem
                  className={"text-[1.4rem] text-deep-100"}
                  value="this_month"
                >
                  {filter}
                </SelectItem>
                <SelectItem
                  className={"text-[1.4rem] text-deep-100"}
                  value="last_month"
                >
                  Last month
                </SelectItem>
                <SelectItem
                  className={"text-[1.4rem] text-deep-100"}
                  value="last_months"
                >
                  Last 6 months
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
