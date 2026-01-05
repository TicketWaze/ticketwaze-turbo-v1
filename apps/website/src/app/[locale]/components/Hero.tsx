"use client";
import { Link } from "@/i18n/navigation";
import { Timer1 } from "iconsax-reactjs";
import Image from "next/image";
import Hero1 from "@/assets/images/hero-1.png";
import Hero2 from "@/assets/images/hero-2.png";
import HeroMobile2 from "@/assets/images/hero-mobile-2.png";
import HeroMobile1 from "@/assets/images/hero-mobile-1.png";
import ScrollBg from "@/assets/images/scroll-bg.png";
import { useEffect, useRef, useState } from "react";
import { animate, useMotionValue, motion, AnimatePresence } from "motion/react";
import calendarEdit from "@/assets/icons/calendarEdit.svg";
import headphones from "@/assets/icons/headphones.svg";
import map from "@/assets/icons/map.svg";
import ticket from "@/assets/icons/ticket.svg";
import { useTranslations } from "next-intl";
import Navbar from "@/components/Navbar";

export default function HeroSection() {
  // Separate state for desktop
  const [desktopIndex, setDesktopIndex] = useState<number>(0);
  const [isDesktopDragging, setIsDesktopDragging] = useState<boolean>(false);
  const desktopContainerRef = useRef<HTMLDivElement | null>(null);
  const desktopX = useMotionValue(0);

  // Separate state for mobile
  const [mobileIndex, setMobileIndex] = useState<number>(0);
  const [isMobileDragging, setIsMobileDragging] = useState<boolean>(false);
  const mobileContainerRef = useRef<HTMLDivElement | null>(null);
  const mobileX = useMotionValue(0);

  const t = useTranslations("HomePage.hero");

  const items = [
    {
      id: 1,
      Icon: calendarEdit,
      title: t("slider.1"),
    },
    {
      id: 2,
      Icon: ticket,
      title: t("slider.2"),
    },
    {
      id: 3,
      Icon: headphones,
      title: t("slider.3"),
    },
    {
      id: 4,
      Icon: map,
      title: t("slider.4"),
    },
  ];

  // Desktop animation effect
  useEffect(() => {
    if (!isDesktopDragging && desktopContainerRef.current) {
      const containerWidth = desktopContainerRef.current.offsetWidth || 1;
      const targetX = -desktopIndex * containerWidth;

      animate(desktopX, targetX, {
        type: "spring",
        stiffness: 300,
        damping: 30,
      });
    }
  }, [desktopIndex, desktopX, isDesktopDragging]);

  // Mobile animation effect
  useEffect(() => {
    if (!isMobileDragging && mobileContainerRef.current) {
      const containerWidth = mobileContainerRef.current.offsetWidth || 1;
      const targetX = -mobileIndex * containerWidth;

      animate(mobileX, targetX, {
        type: "spring",
        stiffness: 300,
        damping: 30,
      });
    }
  }, [mobileIndex, mobileX, isMobileDragging]);

  // Auto-scroll effect for desktop
  useEffect(() => {
    if (isDesktopDragging) return;

    const interval = setInterval(() => {
      setDesktopIndex((prev) => (prev + 1) % items.length);
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [isDesktopDragging, items.length]);

  // Auto-scroll effect for mobile
  useEffect(() => {
    if (isMobileDragging) return;

    const interval = setInterval(() => {
      setMobileIndex((prev) => (prev + 1) % items.length);
    }, 1000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [isMobileDragging, items.length]);

  return (
    <section className="bg-white py-[2.5rem] px-4 rounded-[3rem] flex flex-col gap-[6.5rem] items-center">
      <Navbar />
      <div className="flex flex-col gap-8 max-w-[890px]">
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="font-bold text-[3.8rem] lg:text-[7.8rem] font-primary leading-[45px] lg:leading-[90px] text-center"
        >
          <span className="text-neutral-900">{t("title.1")}</span>{" "}
          <span className="text-deep-200">{t("title.2")}</span>,{" "}
          <span className="text-neutral-900">{t("title.3")}</span>{" "}
          <span className="text-deep-200">{t("title.4")}</span>,{" "}
          <span className="text-neutral-900">{t("title.5")}</span>{" "}
          <span className="text-deep-200">{t("title.6")}</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-[1.6rem] lg:text-[2.6rem] leading-[22.5px] lg:leading-[35px] text-neutral-700 font-sans text-center"
        >
          {t("description")}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex items-center justify-center"
        >
          <Link
            href={"/waitlist"}
            className="px-[3rem] py-[7.5px] border border-[#E45B00] bg-[#fee7d5] rounded-[100px] flex items-center gap-4"
          >
            <Timer1 size="20" color="#E45B00" variant="Bulk" />
            <span className="font-medium font-sans text-[1.5rem] text-primary-500">
              {t("cta.waitlist")}
            </span>
          </Link>
        </motion.div>
      </div>

      {/* Desktop Version */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="hidden lg:grid gap-4"
        style={{ gridTemplateColumns: "360px 450px 360px" }}
      >
        <Image
          src={Hero1}
          alt="Hero image 1"
          width={360}
          className="w-[360px]"
        />
        <div className=" relative overflow-hidden">
          <Image
            src={ScrollBg}
            height={400}
            width={450}
            alt="scroll bg"
            className="absolute top-0"
          />
          <div
            className="relative overflow-hidden rounded-lg flex items-center justify-center"
            ref={desktopContainerRef}
          >
            <motion.div
              className="flex h-[400px] w-[450px] items-center"
              drag="x"
              dragElastic={0.2}
              dragMomentum={false}
              onDragStart={() => setIsDesktopDragging(true)}
              onDragEnd={(e, info) => {
                setIsDesktopDragging(false);
                const containerWidth =
                  desktopContainerRef.current?.offsetWidth || 1;
                const offset = info.offset.x;
                const velocity = info.velocity.x;

                let newIndex = desktopIndex;

                // If fast swipe, use velocity
                if (Math.abs(velocity) > 500) {
                  newIndex = velocity > 0 ? desktopIndex - 1 : desktopIndex + 1;
                }
                // Otherwise use offset threshold (30% of container width)
                else if (Math.abs(offset) > containerWidth * 0.3) {
                  newIndex = offset > 0 ? desktopIndex - 1 : desktopIndex + 1;
                }

                // Clamp index
                newIndex = Math.max(0, Math.min(items.length - 1, newIndex));
                setDesktopIndex(newIndex);
              }}
              style={{ x: desktopX }}
            >
              {items.map(({ Icon, id, title }) => (
                <div
                  key={id}
                  className="shrink-0 w-full flex flex-col items-center gap-[2.5rem]"
                >
                  <Image src={Icon} alt={title} />
                  <div className="bg-white/70 rounded-[50px] uppercase text-primary-500 font-semibold text-[1.8rem] leading-[25px] p-4 font-sans">
                    {title}
                  </div>
                </div>
              ))}
            </motion.div>
            {/* Progress Indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setDesktopIndex(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === desktopIndex
                      ? "w-8 bg-primary-500"
                      : "w-2 bg-primary-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        <Image src={Hero2} alt="Hero image 2" width={360} />
      </motion.div>

      {/* Mobile Version */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="lg:hidden grid gap-4"
        style={{ gridTemplateColumns: "35px 280px 35px" }}
      >
        <Image
          src={HeroMobile1}
          alt="Hero image 1"
          width={35}
          className="w-[35px]"
        />
        <div className=" relative overflow-hidden">
          <Image
            src={ScrollBg}
            height={250}
            width={280}
            alt="scroll bg"
            className="absolute top-0"
          />
          <div
            className="relative overflow-hidden rounded-lg flex items-center justify-center"
            ref={mobileContainerRef}
          >
            <motion.div
              className="flex w-[280px] h-[250px] items-center"
              drag="x"
              dragElastic={0.2}
              dragMomentum={false}
              onDragStart={() => setIsMobileDragging(true)}
              onDragEnd={(e, info) => {
                setIsMobileDragging(false);
                const containerWidth =
                  mobileContainerRef.current?.offsetWidth || 1;
                const offset = info.offset.x;
                const velocity = info.velocity.x;

                let newIndex = mobileIndex;

                // If fast swipe, use velocity
                if (Math.abs(velocity) > 500) {
                  newIndex = velocity > 0 ? mobileIndex - 1 : mobileIndex + 1;
                }
                // Otherwise use offset threshold (30% of container width)
                else if (Math.abs(offset) > containerWidth * 0.3) {
                  newIndex = offset > 0 ? mobileIndex - 1 : mobileIndex + 1;
                }

                // Clamp index
                newIndex = Math.max(0, Math.min(items.length - 1, newIndex));
                setMobileIndex(newIndex);
              }}
              style={{ x: mobileX }}
            >
              {items.map(({ Icon, id, title }) => (
                <div
                  key={id}
                  className="shrink-0 w-[280px] flex flex-col items-center gap-[2.5rem]"
                >
                  <Image src={Icon} alt={title} />
                  <div className="bg-white/70 rounded-[50px] uppercase text-primary-500 font-semibold text-[1.8rem] leading-[25px] p-4 font-sans">
                    {title}
                  </div>
                </div>
              ))}
            </motion.div>
            {/* Progress Indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setMobileIndex(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === mobileIndex
                      ? "w-8 bg-primary-500"
                      : "w-2 bg-primary-300"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        <Image src={HeroMobile2} alt="Hero image 2" width={35} />
      </motion.div>
    </section>
  );
}
