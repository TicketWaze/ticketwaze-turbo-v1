"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ShoppingCart } from "iconsax-reactjs";
import { Link } from "@/i18n/navigation";
import BackButton from "@/components/shared/BackButton";

export interface PendingPurchase {
  orderId: string;
  activityId: string;
  name: string;
  imageUrl: string | null;
  createdAt: string;
  path: string;
  checkoutPath: string;
  items: { ticketTypeId: string; name: string; quantity: number }[];
}

const ease = [0.22, 1, 0.36, 1] as const;

export default function PendingPurchasesContent({
  purchases,
}: {
  purchases: PendingPurchase[];
}) {
  const t = useTranslations("Explore.pending");
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease }}
        className="flex flex-col gap-8"
      >
        <BackButton text={t("back")} />
        <h1 className="font-primary font-medium text-[1.8rem] lg:text-[2.6rem] leading-[2.5rem] lg:leading-12 text-black">
          {t("title")}
        </h1>
      </motion.div>

      {purchases.length > 0 ? (
        <ul className="list pt-4">
          {purchases.map((purchase, index) => (
            <motion.li
              key={purchase.orderId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                ease,
                delay: Math.min(index * 0.06, 0.3),
              }}
            >
              {/* Figma card: poster, perforation, name — plus what was in the
                  cart, so the buyer knows what "resume" will restore. */}
              <Link
                href={purchase.checkoutPath}
                aria-label={`${t("resume")}: ${purchase.name}`}
                className="group flex flex-col bg-white rounded-[10px] overflow-hidden shadow-[0px_15px_25px_0px_rgba(0,0,0,0.05)] transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-[15rem] w-full bg-neutral-100">
                  {purchase.imageUrl && (
                    <Image
                      src={purchase.imageUrl}
                      alt={purchase.name}
                      fill
                      sizes="(min-width: 1024px) 255px, 100vw"
                      className="object-cover object-top"
                    />
                  )}
                </div>
                <div
                  aria-hidden
                  className="h-[0.4rem] mx-[1.5rem] my-[0.8rem] bg-[repeating-linear-gradient(90deg,#F1F2F3_0_2.4rem,transparent_2.4rem_3.2rem)]"
                />
                <div className="px-[10px] pb-[12px] flex flex-col gap-2">
                  <span className="font-semibold text-[1.2rem] leading-[1.65rem] text-deep-100">
                    {purchase.name}
                  </span>
                  {purchase.items.length > 0 && (
                    <span className="text-[1.1rem] text-neutral-600 truncate">
                      {purchase.items
                        .map((item) => `${item.name} ×${item.quantity}`)
                        .join(" · ")}
                    </span>
                  )}
                  <span className="text-[1.2rem] text-primary-500 group-hover:underline">
                    {t("resume")}
                  </span>
                </div>
              </Link>
            </motion.li>
          ))}
        </ul>
      ) : (
        <div className="w-full max-w-[46rem] mx-auto flex-1 flex flex-col items-center justify-center gap-[5rem] py-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
            className="size-[12rem] rounded-full flex items-center justify-center bg-neutral-100"
          >
            <div className="size-[9rem] rounded-full flex items-center justify-center bg-neutral-200">
              <ShoppingCart size="50" color="#0d0d0d" variant="Bulk" />
            </div>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease }}
            className="text-center text-[1.6rem] lg:text-[1.8rem] leading-10 text-neutral-600"
          >
            {t("empty")}
          </motion.p>
        </div>
      )}
    </>
  );
}
