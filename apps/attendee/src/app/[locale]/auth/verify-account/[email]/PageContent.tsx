"use client";
import { useTranslations } from "next-intl";
import mail from "./mail-big.svg";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";

export default function PageContent({ email }: { email: string }) {
  const t = useTranslations("Auth.verify");
  return (
    <div
      className={
        " flex flex-col gap-16 items-center justify-center h-dvh lg:h-full"
      }
    >
      <Image src={mail} alt={"email icon"} />
      <div className={"flex flex-col gap-8 items-center"}>
        <motion.h3
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={
            "font-medium font-primary text-[3.2rem] leading-[35px] text-center text-black"
          }
        >
          {t("title")}
        </motion.h3>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className={
            "font-normal max-w-[530px] text-[1.8rem] leading-[25px] text-center text-neutral-700"
          }
        >
          {t("description")}{" "}
          <span className="font-semibold">{decodeURIComponent(email)}</span>
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Link
            href={"/auth/register"}
            className={
              "font-normal max-w-[530px] text-[1.4rem] leading-[25px] text-center text-primary-500"
            }
          >
            {t("wrong")}
          </Link>
        </motion.p>
      </div>
      {/* <div
        className={
          'flex items-center gap-[1.8rem] border border-neutral-100 p-4 rounded-[10rem] mb-8'
        }
      >
        <span
          className={'font-normal text-[1.8rem] leading-[25px] text-center text-neutral-700'}
        >
          {t('footer.text')}
        </span>
        <ResendButton email={decodeURIComponent(email)}/>
        
      </div> */}
    </div>
  );
}
