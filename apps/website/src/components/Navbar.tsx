"use client";
import Logo from "@/assets/images/logo-wide-yellow.svg";
import { Link, usePathname } from "@/i18n/navigation";
import Image from "next/image";
import { motion } from "motion/react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { CloseCircle, HamburgerMenu } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import SwitchLocale from "./SwitchLocale";

export default function Navbar() {
  const t = useTranslations("HomePage.navbar");
  const pathname = usePathname();
  function isActive(href: string) {
    return href === pathname;
  }
  return (
    <motion.header
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="px-4 lg:px-[100px] flex items-center justify-between w-full"
    >
      <Link href={"/"}>
        <Image src={Logo} alt="Ticketwaze Logo" />
      </Link>
      <nav className="hidden lg:block">
        <ul className="flex items-center gap-8">
          <li
            className={`px-[1.5rem] py-[5px] flex items-center gap-3 bg-neutral-100 rounded-[100px] text-[1.6rem]  leading-[22.5px] ${isActive("/attendee") ? "text-primary-500 font-medium" : "text-deep-100 font-normal"} hover:text-primary-500`}
          >
            {isActive("/attendee") && (
              <div className="w-3 h-3 rounded-full bg-primary-500"></div>
            )}
            <Link href="/attendee">{t("personal")}</Link>
          </li>
          <li
            className={`px-[1.5rem] py-[5px] flex items-center gap-3 bg-neutral-100 rounded-[100px] text-[1.6rem]  leading-[22.5px] ${isActive("/business") ? "text-primary-500 font-medium" : "text-deep-100 font-normal"} hover:text-primary-500`}
          >
            {isActive("/business") && (
              <div className="w-3 h-3 rounded-full bg-primary-500"></div>
            )}
            <Link href="/business">{t("business")}</Link>
          </li>
          <li
            className={`px-[1.5rem] py-[5px] flex items-center gap-3 bg-neutral-100 rounded-[100px] text-[1.6rem]  leading-[22.5px] ${isActive("/about") ? "text-primary-500 font-medium" : "text-deep-100 font-normal"} hover:text-primary-500`}
          >
            {isActive("/about") && (
              <div className="w-3 h-3 rounded-full bg-primary-500"></div>
            )}
            <Link href="/about">{t("about")}</Link>
          </li>
          <li
            className={`px-[1.5rem] py-[5px] flex items-center gap-3 bg-neutral-100 rounded-[100px] text-[1.6rem]  leading-[22.5px] ${isActive("/contact") ? "text-primary-500 font-medium" : "text-deep-100 font-normal"} hover:text-primary-500`}
          >
            {isActive("/contact") && (
              <div className="w-3 h-3 rounded-full bg-primary-500"></div>
            )}
            <Link href="/contact">{t("contact")}</Link>
          </li>
        </ul>
      </nav>
      <Sheet>
        <SheetTrigger asChild className={"cursor-pointer lg:hidden"}>
          <div className={"flex items-center gap-4 cursor-pointer"}>
            <HamburgerMenu size="20" color="#737C8A" variant="Bulk" />
            <span className={"text-[1.5rem] leading-[20px] text-neutral-700"}>
              Menu
            </span>
          </div>
        </SheetTrigger>
        <SheetContent
          side={"top"}
          className={
            "flex flex-col gap-[50px] p-[15px] mt-2 mx-2 pb-0 rounded-[25px]"
          }
        >
          <SheetHeader>
            <SheetTitle className={"sr-only"}>test</SheetTitle>
            <SheetDescription className={"sr-only"}>test</SheetDescription>
            <div className={"flex w-full items-center justify-between"}>
              <Link href={"/"}>
                <Image
                  width={140}
                  height={40}
                  src={Logo}
                  alt={"Logo of TicketWaze"}
                  className={"w-[140px] h-[40px]"}
                  priority
                  loading={"eager"}
                />
              </Link>
              <SheetClose>
                <div className={"flex items-center gap-4 cursor-pointer"}>
                  <CloseCircle size="20" color="#737C8A" variant="Bulk" />
                  <span
                    className={"text-[1.5rem] leading-[20px] text-neutral-700"}
                  >
                    {t("close")}
                  </span>
                </div>
              </SheetClose>
            </div>
          </SheetHeader>
          <ul className=" grid grid-cols-2 gap-8">
            <li
              className={`px-[7.5px] py-[2.5px] flex items-center text-center justify-center gap-3 rounded-[100px] text-[1.8rem]  leading-[25px] ${isActive("/attendee") ? "text-primary-500 font-medium bg-neutral-200/80" : "text-deep-100 font-normal"} hover:text-primary-500`}
            >
              {isActive("/attendee") && (
                <div className="w-3 h-3 rounded-full bg-primary-500"></div>
              )}
              <Link href="/attendee">{t("personal")}</Link>
            </li>
            <li
              className={`px-[7.5px] py-[2.5px] flex items-center text-center justify-center gap-3 rounded-[100px] text-[1.8rem]  leading-[25px] ${isActive("/business") ? "text-primary-500 font-medium bg-neutral-200/80" : "text-deep-100 font-normal"} hover:text-primary-500`}
            >
              {isActive("/business") && (
                <div className="w-3 h-3 rounded-full bg-primary-500"></div>
              )}
              <Link href="/business">{t("business")}</Link>
            </li>
            <li
              className={`px-[7.5px] py-[2.5px] flex items-center text-center justify-center gap-3 rounded-[100px] text-[1.8rem]  leading-[25px] ${isActive("/about") ? "text-primary-500 font-medium bg-neutral-200/80" : "text-deep-100 font-normal"} hover:text-primary-500`}
            >
              {isActive("/about") && (
                <div className="w-3 h-3 rounded-full bg-primary-500"></div>
              )}
              <Link href="/about">{t("about")}</Link>
            </li>
            <li
              className={`px-[7.5px] py-[2.5px] flex items-center text-center justify-center gap-3 rounded-[100px] text-[1.8rem]  leading-[25px] ${isActive("/contact") ? "text-primary-500 font-medium bg-neutral-200/80" : "text-deep-100 font-normal"} hover:text-primary-500`}
            >
              {isActive("/contact") && (
                <div className="w-3 h-3 rounded-full bg-primary-500"></div>
              )}
              <Link href="/contact">{t("contact")}</Link>
            </li>
          </ul>
          <SheetFooter>
            <div>
              <SwitchLocale />
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      <div className="hidden lg:block">
        <SwitchLocale />
      </div>
    </motion.header>
  );
}
