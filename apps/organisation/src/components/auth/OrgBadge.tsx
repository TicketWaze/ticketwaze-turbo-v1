"use client";
import Image from "next/image";
import { motion } from "motion/react";

/** Organisation logo (or initial) above the "Join <organisation>" heading. */
export default function OrgBadge({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl?: string | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className="w-[8rem] h-[8rem] rounded-full overflow-hidden flex items-center justify-center bg-black shrink-0"
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          width={80}
          height={80}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-white uppercase font-medium text-[3.2rem] font-primary">
          {name.trim()[0] ?? "?"}
        </span>
      )}
    </motion.div>
  );
}
