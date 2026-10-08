"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { CloseCircle, Star1 } from "iconsax-reactjs";
import { ButtonPrimary } from "@/components/shared/buttons";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";

export default function RatingDialog({
  onRatingSubmit,
  initialRating = 0,
}: {
  /** Saves the rating; resolves once the API has answered. */
  onRatingSubmit: (val: number) => Promise<void>;
  /** Pre-selected stars — the star tapped in the feedback email. Still confirmed here. */
  initialRating?: number;
}) {
  const t = useTranslations("History.activity.rating");
  const tEvent = useTranslations("Event");

  const [rating, setRating] = useState(initialRating);
  const [hover, setHover] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  async function handleRatingSubmit() {
    if (rating === 0 || isLoading) return;
    setIsLoading(true);
    try {
      await onRatingSubmit(rating);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <DialogContent showCloseButton={false} className="gap-0">
      {/* Figma: title + round close, a divider, then the prompt. */}
      <div className="flex items-center justify-between gap-4 pb-6 border-b border-neutral-100">
        <DialogTitle className="font-primary font-medium text-[2.2rem] leading-10 text-black">
          {t("title")}
        </DialogTitle>
        <DialogClose
          aria-label={tEvent("close")}
          className="cursor-pointer active:scale-90 transition-transform"
        >
          <CloseCircle size={28} color="#737C8A" variant="Bulk" />
        </DialogClose>
      </div>
      <DialogDescription className="pt-6 text-neutral-400 leading-10 text-center text-[1.8rem]">
        {t("text")}
      </DialogDescription>

      <div className="flex items-center gap-4 justify-center py-8">
        {Array.from({ length: 5 }).map((_, index) => {
          const starValue = index + 1;
          const isActive = starValue <= (hover || rating);
          return (
            <motion.button
              key={index}
              type="button"
              aria-label={`${starValue}/5`}
              aria-pressed={starValue <= rating}
              onClick={() => setRating(starValue)}
              onMouseEnter={() => setHover(starValue)}
              onMouseLeave={() => setHover(0)}
              initial={{ opacity: 0, y: 8 }}
              animate={{
                opacity: 1,
                y: 0,
                // Selected stars pop in sequence, so the choice reads as a sweep.
                scale: starValue <= rating ? [1, 1.25, 1] : 1,
              }}
              transition={{
                opacity: { duration: 0.25, delay: index * 0.05 },
                y: { duration: 0.25, delay: index * 0.05 },
                scale: { duration: 0.3, delay: index * 0.04 },
              }}
              whileTap={{ scale: 0.85 }}
              className="cursor-pointer"
            >
              <Star1
                size="50"
                color={isActive ? "#E45B00" : "#ABB0B9"}
                variant="Bulk"
              />
            </motion.button>
          );
        })}
      </div>

      <ButtonPrimary
        type="button"
        disabled={rating === 0 || isLoading}
        onClick={handleRatingSubmit}
        className="w-full"
      >
        {isLoading ? <LoadingCircleSmall /> : t("submit")}
      </ButtonPrimary>
    </DialogContent>
  );
}
