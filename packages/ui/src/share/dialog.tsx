"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CloseCircle } from "iconsax-reactjs";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/*
 * The apps' shadcn dialog (components/ui/dialog.tsx), carried here so the
 * shared share modal and poster generator look the same in every app without
 * reaching into one app's components.
 */

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export function DialogContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50" />
      <DialogPrimitive.Content
        className={cn(
          "bg-white data-[state=open]:animate-in data-[state=closed]:animate-out w-[360px] lg:w-[520px] data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid translate-x-[-50%] translate-y-[-50%] gap-4 rounded-[20px] border p-[20px] lg:py-[45px] lg:px-[30px] shadow-lg duration-200",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close className="absolute top-7 lg:top-16 right-4 rounded-[20px] opacity-70 transition-opacity hover:opacity-100 focus:outline-hidden cursor-pointer">
            <CloseCircle size="24" color="#000000" variant="Bulk" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
