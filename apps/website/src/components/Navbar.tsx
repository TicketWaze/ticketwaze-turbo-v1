"use client";
import Logo from "@/assets/images/logo-wide-yellow.svg";
import { Link, usePathname } from "@/i18n/navigation";
import Image from "next/image";
import { motion } from "motion/react";

export default function Navbar() {
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
            <Link href="/attendee">Personal</Link>
          </li>
          <li
            className={`px-[1.5rem] py-[5px] flex items-center gap-3 bg-neutral-100 rounded-[100px] text-[1.6rem]  leading-[22.5px] ${isActive("/business") ? "text-primary-500 font-medium" : "text-deep-100 font-normal"} hover:text-primary-500`}
          >
            {isActive("/business") && (
              <div className="w-3 h-3 rounded-full bg-primary-500"></div>
            )}
            <Link href="/business">Business</Link>
          </li>
          <li
            className={`px-[1.5rem] py-[5px] flex items-center gap-3 bg-neutral-100 rounded-[100px] text-[1.6rem]  leading-[22.5px] ${isActive("/about") ? "text-primary-500 font-medium" : "text-deep-100 font-normal"} hover:text-primary-500`}
          >
            {isActive("/about") && (
              <div className="w-3 h-3 rounded-full bg-primary-500"></div>
            )}
            <Link href="/about">About us</Link>
          </li>
          <li
            className={`px-[1.5rem] py-[5px] flex items-center gap-3 bg-neutral-100 rounded-[100px] text-[1.6rem]  leading-[22.5px] ${isActive("/contact") ? "text-primary-500 font-medium" : "text-deep-100 font-normal"} hover:text-primary-500`}
          >
            {isActive("/contact") && (
              <div className="w-3 h-3 rounded-full bg-primary-500"></div>
            )}
            <Link href="/contact">Contact us</Link>
          </li>
        </ul>
      </nav>
      <div>lang</div>
    </motion.header>
  );
}
