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
import { useTranslations } from "next-intl";

interface FeedbackSuccessDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SuccessDialog({
  isOpen,
  onOpenChange,
}: FeedbackSuccessDialogProps) {
  const t = useTranslations("History.activity.feedback.success");
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="[&>button]:hidden px-12 py-18 flex flex-col gap-8 lg:gap-16 justify-center items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Image src={Success} alt="success icon" />
        </motion.div>
        <div className="w-full flex flex-col gap-8 lg:gap-12">
          <div className="flex flex-col gap-6">
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-[1.8rem] leading-10 font-primary text-center font-medium lg:text-[2.6rem] lg:leadind-[3rem] capitalize"
            >
              {t("title")}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-neutral-400 text-[1.5rem] leading-8 lg:text-[1.8rem] lg:leading-10 text-center"
            >
              {t("text")}
            </motion.p>
          </div>

          <DialogFooter className="flex items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="w-full flex gap-8 items-center justify-center"
            >
              <DialogClose asChild>
                <ButtonAccent className="flex-1">{t("cta.close")}</ButtonAccent>
              </DialogClose>
              <ButtonPrimary className="flex-1">{t("cta.view")}</ButtonPrimary>
            </motion.div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
