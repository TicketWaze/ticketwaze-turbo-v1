import { cn } from "@/lib/utils";
import React from "react";
import ArrowDown from "@ticketwaze/ui/assets/icons/arrow-down.svg";
import Image from "next/image";
import Filter from "./filter";

export default function ActivitiesPageTopbar({
  children,
  title,
  filter,
  className,
}: {
  className?: string;
  children?: React.ReactNode;
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
          <Filter filter={filter} />
        </div>
        {/* <div className={"flex items-center"}>
          <div>{children}</div>
        </div> */}
      </div>
    </div>
  );
}
