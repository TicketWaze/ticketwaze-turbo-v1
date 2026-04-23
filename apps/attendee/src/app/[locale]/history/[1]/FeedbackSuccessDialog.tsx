"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Success from "@ticketwaze/ui/assets/images/accepted.png";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { ButtonAccent, ButtonPrimary } from "@/components/shared/buttons";

interface FeedbackSuccessDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SuccessDialog({
  isOpen,
  onOpenChange,
}: FeedbackSuccessDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="[&>button]:hidden px-12 py-18 flex flex-col gap-16 justify-center items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Image src={Success} alt="success icon" />
        </motion.div>
        <div className="w-full flex flex-col gap-12">
          <div className="flex flex-col gap-6">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="font-primary text-center font-medium text-[2.6rem] leadind-[3rem] capitalize"
            >
              Feedback sent successfully
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-neutral-400 text-[1.8rem] leading-10 text-center"
            >
              Thanks! Your feedback has been shared with the organizer
              successfully.
            </motion.p>
          </div>

          <DialogFooter className="flex gap-4 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="w-full flex gap-8 items-center justify-center"
            >
              <DialogClose asChild>
                <ButtonAccent className="flex-1">Close</ButtonAccent>
              </DialogClose>
              <ButtonPrimary className="flex-1">View</ButtonPrimary>
            </motion.div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
