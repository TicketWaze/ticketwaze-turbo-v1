"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import successBadge from "@/assets/images/auth/success-badge.png";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { ButtonAccent, ButtonPrimary } from "@/components/shared/buttons";
import { useTranslations } from "next-intl";

interface FeedbackSuccessDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** "View": close and bring the sent feedback into view. */
  onView: () => void;
}

const ease = [0.22, 1, 0.36, 1] as const;

export default function FeedbackSuccessDialog({
  isOpen,
  onOpenChange,
  onView,
}: FeedbackSuccessDialogProps) {
  const t = useTranslations("History.activity.feedback.success");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="px-12 py-18 flex flex-col gap-8 lg:gap-12 justify-center items-center"
      >
        {/* Same badge as the auth success steps (Figma). */}
        <motion.div
          initial={{ opacity: 0, scale: 0.6, rotate: -12 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <Image
            src={successBadge}
            alt=""
            width={100}
            height={100}
            className="w-40 h-40"
          />
        </motion.div>
        <div className="w-full flex flex-col gap-8 lg:gap-12">
          <div className="flex flex-col gap-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15, ease }}
            >
              <DialogTitle className="text-[1.8rem] leading-10 font-primary text-center font-medium lg:text-[2.6rem] lg:leading-12 text-black">
                {t("title")}
              </DialogTitle>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.22, ease }}
            >
              <DialogDescription className="text-neutral-400 text-[1.5rem] leading-8 lg:text-[1.8rem] lg:leading-10 text-center">
                {t("text")}
              </DialogDescription>
            </motion.div>
          </div>

          <DialogFooter className="flex items-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3, ease }}
              className="w-full flex gap-8 items-center justify-center"
            >
              <DialogClose asChild>
                <ButtonAccent className="flex-1">{t("cta.close")}</ButtonAccent>
              </DialogClose>
              <ButtonPrimary className="flex-1" onClick={onView}>
                {t("cta.view")}
              </ButtonPrimary>
            </motion.div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
