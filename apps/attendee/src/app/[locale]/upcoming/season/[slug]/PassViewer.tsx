"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { QRCodeCanvas } from "qrcode.react";
import { ArrowLeft2, ArrowRight2 } from "iconsax-reactjs";
import { HeldSeasonPass } from "@ticketwaze/typescript-config";

/**
 * The holder's season pass: one QR, valid at every match of the season.
 * Same QR settings as an event ticket (TicketViewer): the door scanner reads
 * the uppercase ticket id. Several passes bought together page through here.
 */
export default function PassViewer({
  passes,
  seasonName,
}: {
  passes: HeldSeasonPass[];
  seasonName: string;
}) {
  const t = useTranslations("Season.mine");
  const [index, setIndex] = useState(0);
  const pass = passes[index];
  if (!pass) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-6 rounded-[20px] bg-neutral-50 border border-neutral-100 p-6 lg:p-8 text-center">
        <span className="font-primary font-medium text-[2.2rem] leading-12 text-black">
          {t("pass")}
        </span>
        <span className="text-[1.4rem] font-mono tracking-wider text-deep-100">
          {pass.ticketName}
        </span>
        <div className="rounded-[15px] bg-white p-4 shadow-[0_15px_25px_0_rgba(0,0,0,0.05)]">
          <QRCodeCanvas
            value={pass.ticketId.toUpperCase()}
            size={260}
            level="H"
            marginSize={4}
            bgColor="#FFFFFF"
            fgColor="#000000"
            imageSettings={{
              src: "/logo-simple-orange.svg",
              height: 46,
              width: 46,
              excavate: true,
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[1.6rem] font-medium leading-8 text-deep-100">
            {pass.fullName}
          </span>
          <span className="text-[1.3rem] leading-8 text-neutral-600">
            {seasonName}
          </span>
        </div>
        <p className="text-[1.3rem] leading-8 text-neutral-600 max-w-[36rem]">
          {t("gateNote")}
        </p>
      </div>

      {passes.length > 1 && (
        <div className="border border-neutral-100 rounded-[100px] py-4 px-[1.5rem] flex items-center justify-between">
          <button
            type="button"
            aria-label={t("previous")}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="w-[35px] h-[35px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 rounded-full bg-neutral-100 flex items-center justify-center"
          >
            <ArrowLeft2 variant="Bulk" size={20} color="#0D0D0D" />
          </button>
          <span className="text-[2.2rem] leading-12 text-neutral-600">
            <span className="text-primary-500">{index + 1}</span>/
            {passes.length}
          </span>
          <button
            type="button"
            aria-label={t("next")}
            onClick={() => setIndex((i) => Math.min(passes.length - 1, i + 1))}
            disabled={index === passes.length - 1}
            className="w-[35px] h-[35px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 rounded-full bg-neutral-100 flex items-center justify-center"
          >
            <ArrowRight2 variant="Bulk" size={20} color="#0D0D0D" />
          </button>
        </div>
      )}
    </div>
  );
}
