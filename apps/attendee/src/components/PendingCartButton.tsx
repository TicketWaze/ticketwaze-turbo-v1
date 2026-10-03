"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { ShoppingCart } from "iconsax-reactjs";
import { Link } from "@/i18n/navigation";

/**
 * Explore's cart button (Figma "Events + Cart"): opens Pending Purchases, with
 * an orange dot while any checkout is waiting to be finished. Signed-in only.
 */
export default function PendingCartButton() {
  const t = useTranslations("Explore.pending");
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/pending-purchases`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((body) => {
        if (!cancelled && body?.status === "success")
          setCount(body.pendingPurchases?.length ?? 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token) return null;
  return (
    <Link
      href="/explore/pending"
      aria-label={t("open")}
      title={t("open")}
      // On phones the header is tight, so the cart only shows when something is pending.
      className={`relative w-12 h-12 lg:w-14 lg:h-14 shrink-0 items-center justify-center bg-neutral-100 rounded-full transition-transform active:scale-90 ${count > 0 ? "flex" : "hidden lg:flex"}`}
    >
      <motion.span
        animate={count > 0 ? { x: [0, -2, 2, -1, 0] } : { x: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="flex"
      >
        <ShoppingCart size={20} color="#737C8A" variant="Bulk" />
      </motion.span>
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key="dot"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="absolute top-[0.6rem] right-[0.6rem] size-[0.9rem] rounded-full bg-primary-500 ring-2 ring-white"
          />
        )}
      </AnimatePresence>
    </Link>
  );
}
