"use client";
import { AnimatePresence, motion } from "framer-motion";
import LoadingCircleSmall from "./shared/LoadingCircleSmall";

export default function PageLoader({ isLoading }: { isLoading: boolean }) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="absolute top-0 left-0 w-screen h-dvh bg-neutral-400/70 z-9999999 flex items-center justify-center"
          initial={{ opacity: 0 }} // when it first appears
          animate={{ opacity: 1 }} // when visible
          exit={{ opacity: 0 }} // when leaving
          transition={{ duration: 0.3 }} // adjust speed
        >
          <LoadingCircleSmall />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
