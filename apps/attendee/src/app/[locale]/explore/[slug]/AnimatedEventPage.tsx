"use client";
import { motion } from "framer-motion";

export default function AnimatedEventPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="flex flex-col gap-8 h-full min-h-0"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
