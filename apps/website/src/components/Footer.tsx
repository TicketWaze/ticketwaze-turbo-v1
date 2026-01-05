"use client";
import React from "react";
import FooterImg from "@/assets/images/waitlist-image-sm.svg";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Location, Mobile, Sms } from "iconsax-reactjs";
import { cn } from "@/lib/utils";
import instagram from "@/assets/icons/Instagram.svg";
import { motion } from "motion/react";
import whatsapp from "@/assets/icons/Whatsapp.svg";
import x from "@/assets/icons/X.svg";
import { useLocale, useTranslations } from "next-intl";

function Footer() {
  const t = useTranslations("HomePage.footer");
  const locale = useLocale();
  const date = new Date();
  return (
    <motion.footer
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={
        "bg-primary-900 text-white p-[15px] lg:p-[25px] flex flex-col gap-20 rounded-[3rem]"
      }
    >
      <div
        className={
          "py-[20px] lg:py-[38px] pl-[15px] lg:pl-[50px] flex flex-col lg:flex-row items-center gap-[50px] lg:gap-[78px] bg-[#5C1600] rounded-[20px]"
        }
      >
        <div className={"flex-1 max-w-[493px] flex flex-col items-start gap-8"}>
          <h2
            className={
              "font-primary text-[3.8rem] lg:text-[7.8rem] leading-[45px] text-start lg:leading-[90px] font-semibold"
            }
          >
            {t("title-1")}
          </h2>
          <p className="text-[1.8rem] leading-[2.5rem] text-neutral-200">
            {t("description")}
          </p>
          <input
            placeholder={t("email")}
            type="email"
            className="p-8 bg-neutral-100 rounded-[5rem] text-[1.5rem] leading-8 placeholder:text-neutral-600 text-black focus:outline-none w-full max-w-[493px]"
          />
          <button className="px-12 py-5 cursor-pointer rounded-[10rem] bg-primary-500 text-white text-[1.4rem] leading-8">
            {t("sub")}
          </button>

          <div className={"flex items-center flex-col lg:flex-row gap-8"}>
            {/* <LinkPrimary
              className={"w-full lg:w-auto mr-[15px] lg:mr-0"}
              target="_blank"
              rel="noopener noreferrer"
              href={`https://app.ticketwaze.com/${locale}`}
            >
              {t("explore")}
            </LinkPrimary> */}
            <div></div>
          </div>
        </div>
        <Image src={FooterImg} alt={"footer image"} className={"flex-1"} />
      </div>
      <div className={"px-[15px] "}>
        <div
          className={
            "flex flex-col lg:flex-row items-start gap-8 lg:justify-between"
          }
        >
          <div className={"flex flex-1 flex-col gap-[15px]"}>
            <span
              className={
                "font-primary text-[1.6rem] leading-[22.5px] font-bold"
              }
            >
              {t("quick")}
            </span>
            <div className={"flex flex-col gap-8"}>
              <div className={"flex gap-4"}>
                <FooterLink href={"/attendee"}>{t("attendees")}</FooterLink>
                <FooterLink href={"/about"}>{t("about")}</FooterLink>
              </div>
              <div className={"flex gap-4"}>
                <FooterLink href={"/business"}>{t("organizers")}</FooterLink>
                <FooterLink href={"/contact"}>{t("pricing")}</FooterLink>
              </div>
            </div>
          </div>
          <div className={"flex flex-1 flex-col gap-[15px]"}>
            <span
              className={
                "font-primary text-[1.6rem] leading-[22.5px] font-bold"
              }
            >
              {t("others")}
            </span>
            <div className={"flex flex-col gap-8"}>
              <div className={"flex gap-4"}>
                <FooterLink href={"/contact"}>{t("help")}</FooterLink>
                <FooterLink href={"/legals"}>{t("legal")}</FooterLink>
              </div>
            </div>
          </div>
          <div className={"flex flex-1 flex-col gap-[15px]"}>
            <span
              className={
                "font-primary text-[1.6rem] leading-[22.5px] font-bold"
              }
            >
              {t("contact")}
            </span>
            <div className={"flex flex-col lg:flex-row gap-[30px]"}>
              <div className={"flex flex-col gap-8"}>
                <FooterLink
                  href={"mailto:hello@ticketwaze.com"}
                  className={"flex items-center gap-4"}
                >
                  <Sms size={20} color={"#FFFFFF"} variant={"Bulk"} />
                  <span>hello@ticketwaze.com</span>
                </FooterLink>
                <div
                  className={
                    "px-8 lg:px-[30px] py-4 lg:py-8 rounded-[100px] bg-primary-800 text-[1.6rem] leading-[22.5px] flex items-center gap-4"
                  }
                >
                  <Location size={20} color={"#FFFFFF"} variant={"Bulk"} />
                  <span>Haiti</span>
                </div>
                {/* <Link
                  href={"tel:+50936124567"}
                  className={
                    "px-8 lg:px-[30px] py-4 lg:py-8 rounded-[100px] bg-primary-800 text-[1.6rem] leading-[22.5px] flex items-center gap-4"
                  }
                >
                  <Mobile size={20} color={"#FFFFFF"} variant={"Bulk"} />
                  <span>+509 3612 4567</span>
                </Link> */}
              </div>
              <div className={"flex lg:flex-col gap-8 lg:justify-between "}>
                <Link
                  href={"https://instagram.com/ticketwaze"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    "w-[55px] h-[55px] bg-primary-800 rounded-full flex items-center justify-center"
                  }
                >
                  <Image src={instagram} alt={"instagram icon"} />
                </Link>
                {/* <Link
                  href={"https://instagram.com/ticketwaze"}
                  target="_blank"
              rel="noopener noreferrer"
                  className={
                    "w-[55px] h-[55px] bg-primary-800 rounded-full flex items-center justify-center"
                  }
                >
                  <Image src={whatsapp} alt={"instagram icon"} />
                </Link> */}
                <Link
                  href={"https://x.com/ticketwaze"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={
                    "w-[55px] h-[55px] bg-primary-800 rounded-full flex items-center justify-center"
                  }
                >
                  <Image src={x} alt={"twitter icon"} />
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div
          className={
            "flex flex-col gap-6 lg:gap-0 items-center mt-[40px] lg:mt-0"
          }
        >
          <span
            className={
              "font-primary font-bold text-[62.4px] lg:text-[200.4px] leading-[65px] lg:leading-[227.5px] tracking-[-1.5%] text-white opacity-[16%]"
            }
          >
            Ticketwaze
          </span>
          <span className={"text-white text-[1.6rem] leading-[22.5px]"}>
            &copy; {date.getFullYear()} <Link href={"/"}>Ticketwaze</Link>
          </span>
        </div>
      </div>
    </motion.footer>
  );
}

function FooterLink({
  children,
  href,
  className,
}: {
  children: React.ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <Link
      scroll={true}
      className={cn(
        "px-8 lg:px-[30px] py-4 lg:py-8 rounded-[100px] bg-primary-800 text-[1.6rem] leading-[22.5px]",
        className
      )}
      href={href}
    >
      {children}
    </Link>
  );
}

export default Footer;
