"use client";
import { ButtonNeutral } from "@/components/shared/buttons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Link } from "@/i18n/navigation";
import { slugify } from "@/lib/Slugify";
import TruncateUrl from "@/lib/TruncateUrl";
import { Organisation } from "@ticketwaze/typescript-config";
import { Copy, Send2 } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useRef } from "react";
import { toast } from "sonner";
import Whatsapp from "@/assets/icons/whatsApp.svg";
import Twitter from "@/assets/icons/twitter.svg";
import Linkedin from "@/assets/icons/linkedIn.svg";
import { QRCodeCanvas } from "qrcode.react";
import { QrCode } from "lucide-react";

/**
 * Share sheet for the organisation's public profile — the same dialog as
 * ShareEvent, pointed at the attendee app rather than at an activity.
 *
 * The link is built with `slugify` so it matches the canonical URL the attendee
 * app links to and declares. The name is decorative there: the id at the end is
 * what resolves, so a link stays valid even if the organisation is renamed
 * after someone shares it.
 */
export default function ShareOrganisation({
  organisation,
}: {
  organisation: Organisation;
}) {
  const t = useTranslations("Settings.profile.share_profile");
  const locale = useLocale();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const organisationLink = `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/${locale}/organisations/${slugify(
    organisation.organisationName,
    organisation.organisationId,
  )}`;

  function handleDownloadQR() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(
      organisation.organisationName,
      organisation.organisationId,
    )}-qrcode.png`;
    a.click();
  }

  const shareMessage = t("message", { name: organisation.organisationName });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <ButtonNeutral className="gap-4">
          <Send2 variant={"Bulk"} color={"#737C8A"} size={20} />
          <span className="hidden lg:inline">{t("title")}</span>
        </ButtonNeutral>
      </DialogTrigger>
      <DialogContent className={"w-xl lg:w-208 "}>
        <DialogHeader>
          <DialogTitle
            className={
              "font-medium border-b border-neutral-100 pb-8  text-[2.6rem] leading-12 text-black font-primary"
            }
          >
            {t("title")}
          </DialogTitle>
          <DialogDescription className={"sr-only"}>
            <span>Share organisation profile</span>
          </DialogDescription>
        </DialogHeader>
        <div
          className={"flex flex-col w-auto justify-center items-center gap-12"}
        >
          <p
            className={
              "font-sans text-[1.8rem] leading-10 text-[#cdcdcd] text-center w-[320px] lg:w-full"
            }
          >
            {t("description")}
          </p>
          <div
            className={
              "border w-auto border-neutral-100 rounded-[100px] p-4 flex  items-center gap-4"
            }
          >
            <span
              className={"lg:hidden text-neutral-700 text-[1.8rem] max-w-134"}
            >
              {TruncateUrl(organisationLink, 22)}
            </span>
            <span
              className={
                "hidden lg:block text-neutral-700 text-[1.8rem] max-w-134"
              }
            >
              {TruncateUrl(organisationLink)}
            </span>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(organisationLink);
                  toast.success(t("copied"));
                } catch {
                  toast.error(t("copy_failed"));
                }
              }}
              className={
                "border-2 border-primary-500 px-6 py-[.7rem] rounded-[10rem] font-normal text-[1.5rem] text-primary-500 leading-8 bg-primary-50 cursor-pointer flex"
              }
            >
              <Copy size="20" color="#e45b00" variant="Bulk" />
              {t("copy")}
            </button>
          </div>
          <div className="hidden">
            <QRCodeCanvas
              ref={canvasRef}
              value={organisationLink}
              size={400}
              level="H"
              imageSettings={{
                src: "/logo-simple-orange.svg",
                height: 80,
                width: 80,
                excavate: true,
              }}
            />
          </div>
          <div className="flex items-center gap-12">
            <button
              onClick={handleDownloadQR}
              className="flex items-center justify-center w-18 h-18 bg-neutral-100 rounded-full cursor-pointer"
              title={t("qr")}
            >
              <QrCode size={20} color="#737c8a" />
            </button>
            <Link
              href={`https://wa.me/?text=${encodeURIComponent(`${shareMessage}\n${organisationLink}`)}`}
              target="_blank"
              className="flex items-center justify-center w-18 h-18 bg-neutral-100 rounded-full"
            >
              <Image src={Whatsapp} alt="whatsapp Icon" />
            </Link>
            <Link
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                `${shareMessage}\n${organisationLink}`,
              )}`}
              target="_blank"
              className="flex items-center justify-center w-18 h-18 bg-neutral-100 rounded-full"
            >
              <Image src={Twitter} alt="Twitter Icon" />
            </Link>
            <Link
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(organisationLink)}`}
              target="_blank"
              className="flex items-center justify-center w-18 h-18 bg-neutral-100 rounded-full"
            >
              <Image src={Linkedin} alt="LinkedIn Icon" />
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
