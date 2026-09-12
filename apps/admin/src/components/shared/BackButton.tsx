"use client";
import React from "react";
import { ArrowLeft2 } from "iconsax-reactjs";
import { cn } from "@/lib/utils";

function BackButton({
  text,
  className,
  onClick,
  children,
}: {
  text: string;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex justify-between">
      <button
        onClick={onClick ? onClick : () => window.history.back()}
        className={cn(
          // `w-fit`, not `max-w-32`: that cap was narrower than the icon plus
          // two words, so any label longer than "Back" wrapped and squashed the
          // arrow. `shrink-0` below keeps the circle round whatever the label.
          "flex w-fit cursor-pointer items-center gap-4",
          className,
        )}
      >
        <div
          className={
            "w-14 h-14 shrink-0 rounded-full bg-neutral-100 flex items-center justify-center"
          }
        >
          <ArrowLeft2 size="20" color="#0d0d0d" variant="Bulk" />
        </div>
        <span
          className={
            "text-neutral-700 font-normal text-[1.4rem] leading-8 whitespace-nowrap"
          }
        >
          {text}
        </span>
      </button>
      {children}
    </div>
  );
}

export default BackButton;
