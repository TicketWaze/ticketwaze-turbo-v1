"use client";
import { useState } from "react";
import { Star1 } from "iconsax-reactjs";
import { ButtonPrimary } from "@/components/shared/buttons";
import {
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function RatingDialog({
  onRatingSubmit,
}: {
  onRatingSubmit: (val: number) => void;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0); // Stoke hover a pou yon ti stil
  const [isLoading, setIsLoading] = useState(false);
  // {isLoading ? <LoadingCircleSmall /> : "Submit"}
  // onClick={handleRatingSubmit}
  const handleRatingSubmit = async () => {
    if (rating === 0) return;

    setIsLoading(true);

    try {
      // 1. Simulation d'appel API pour stocker la note
      console.log("Envoi de la note à la DB:", rating);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 2. Appeler la fonction parente pour dire que c'est fini
      // Cela servira à fermer ce dialog et ouvrir celui du succès
      onRatingSubmit(rating);
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <DialogContent className="[&>button]:mr-6 [&>button]:mt-3">
      <DialogTitle>Rate activity</DialogTitle>
      <div className="h-[0.1rem] w-full bg-neutral-200 -mt-4 mb-2"></div>
      <DialogDescription className="text-neutral-400 leading-10 text-center text-[1.8rem]">
        Tap the stars to rate your experience!
      </DialogDescription>

      <div className="flex items-center gap-2 justify-center py-8">
        {Array.from({ length: 5 }).map((_, index) => {
          const starValue = index + 1;

          // La star est active si elle est inférieure ou égale au clic OU au hover
          const isActive = starValue <= (hover || rating);

          return (
            <button
              key={index}
              onClick={() => setRating(starValue)}
              onMouseEnter={() => setHover(starValue)}
              onMouseLeave={() => setHover(0)}
              className="transition-transform active:scale-90"
            >
              <Star1
                size="50"
                color={isActive ? "#E45B00" : "#ABB0B9"}
                variant="Bulk"
              />
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4">
        <ButtonPrimary
          type="submit"
          disabled={rating === 0}
          onClick={handleRatingSubmit}
          className="w-full"
        >
          {/* {isLoading ? <LoadingCircleSmall /> : "Submit"({rating}/5)} */}
          Submit ({rating}/5)
        </ButtonPrimary>
      </div>
    </DialogContent>
  );
}
