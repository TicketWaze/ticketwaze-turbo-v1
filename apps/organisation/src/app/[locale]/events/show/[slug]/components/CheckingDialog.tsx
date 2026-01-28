"use client";
import { Event, User } from "@ticketwaze/typescript-config";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Scanner } from "iconsax-reactjs";
import { useLocale, useTranslations } from "next-intl";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import { Html5QrcodeScanner } from "html5-qrcode";
import { CheckInWithQrCode } from "@/actions/EventActions";
import { usePathname } from "@/i18n/navigation";
import PageLoader from "@/components/PageLoader";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";

export default function CheckingDialog({
  event,
  user,
}: {
  event: Event;
  user: User;
}) {
  const t = useTranslations("Events.single_event");
  const closeRef = useRef<HTMLButtonElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerKey, setScannerKey] = useState(0);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const isCleaningRef = useRef(false);

  // Cleanup scanner
  const cleanupScanner = async () => {
    // Prevent multiple cleanup calls
    if (isCleaningRef.current) return;
    isCleaningRef.current = true;

    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
      } catch (error) {
        // Silently handle transition errors
        if (
          !(error instanceof Error && error.toString().includes("transition"))
        ) {
          console.error("Error clearing scanner:", error);
        }
      }
      scannerRef.current = null;
    }

    // Remove the entire reader container
    setTimeout(() => {
      const readerContainer = document.getElementById("reader-container");
      if (readerContainer) {
        readerContainer.innerHTML = "";
      }
      isCleaningRef.current = false;
    }, 100);
  };

  // Initialize scanner when scanning starts
  useEffect(() => {
    if (!isDialogOpen) {
      cleanupScanner();
      setIsScanning(false);
      return;
    }

    if (!isScanning) {
      cleanupScanner();
      return;
    }

    const timer = setTimeout(() => {
      if (scannerRef.current) return;

      const scanner = new Html5QrcodeScanner(
        "reader",
        {
          qrbox: { width: 250, height: 250 },
          fps: 5,
          aspectRatio: 1.0,
          videoConstraints: {
            facingMode: { ideal: "environment" },
          },
        },
        false,
      );

      scannerRef.current = scanner;

      async function success(result: string) {
        // Don't cleanup immediately, let it finish
        setIsScanning(false);
        await CheckQrCode(result);
        setScannerKey((prev) => prev + 1);
      }

      function error(err: any) {}

      scanner.render(success, error);
    }, 150);

    return () => {
      clearTimeout(timer);
      cleanupScanner();
    };
  }, [isDialogOpen, isScanning, scannerKey]);
  const pathname = usePathname();
  const locale = useLocale();

  async function CheckQrCode(id: string) {
    setIsLoading(true);
    const response = await CheckInWithQrCode(
      event.eventId,
      user.accessToken,
      pathname,
      id,
      locale,
    );
    if (response.status === "success") {
      toast.success("success");
      setIsDialogOpen(false);
    } else {
      toast.error(response.error);
    }
    setIsLoading(false);
  }

  function startScanning() {
    setScannerKey((prev) => prev + 1);
    setIsScanning(true);
  }

  function stopScanning() {
    setIsScanning(false);
    setScannerKey((prev) => prev + 1);
  }

  return (
    <>
      <PageLoader isLoading={isLoading} />
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger className="w-full lg:w-fit">
          <span className="px-[15px] py-[7.5px] border-2 border-transparent rounded-[100px] text-center font-medium text-[1.5rem] h-auto leading-[20px] cursor-pointer transition-all duration-400 flex items-center justify-center gap-4 bg-neutral-100 text-neutral-700">
            <Scanner variant={"Bulk"} color={"#737C8A"} size={20} />
            {t("check_in")}
          </span>
        </DialogTrigger>
        <DialogContent className={"w-[360px] lg:w-[520px] "}>
          <DialogHeader>
            <DialogTitle
              className={`font-medium border-b border-neutral-100 pb-[2rem]  text-[2.6rem] leading-[30px] text-black font-primary ${isScanning && "hidden"}`}
            >
              {t("check_in")}
            </DialogTitle>
            <DialogDescription className={"sr-only"}>
              <span>User checkIn</span>
            </DialogDescription>
          </DialogHeader>
          <div
            className={
              "flex flex-col w-auto justify-center items-center gap-[30px]"
            }
          >
            <p
              className={`font-sans text-[1.8rem] leading-[25px] text-[#cdcdcd] text-center w-[320px] lg:w-full ${isScanning && "hidden"}`}
            >
              {t("check_in_description")}
            </p>

            <div className="w-full max-w-[350px] min-h-[280px] flex items-center justify-center">
              {!isScanning ? (
                <div className="w-full h-[280px] border-2 border-dashed border-neutral-300 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Scanner
                      variant={"Bulk"}
                      color={"#737C8A"}
                      size={48}
                      className="mx-auto mb-4"
                    />
                    <p className="text-neutral-500 text-[1.6rem] font-medium">
                      Ready to scan
                    </p>
                  </div>
                </div>
              ) : (
                <div id="reader-container" key={scannerKey} className="w-full">
                  <div
                    id="reader"
                    className="w-full
                      [&>div]:!border-0
                      [&>div]:!shadow-none
                      [&_video]:!rounded-lg
                      [&_#qr-shaded-region]:!border-2
                      [&_#qr-shaded-region]:!border-neutral-300
                      [&_#qr-shaded-region]:!rounded-lg
                      [&_button]:!bg-neutral-700
                      [&_button]:!text-white
                      [&_button]:!rounded-lg
                      [&_button]:!px-4
                      [&_button]:!py-2
                      [&_button]:!font-medium
                      [&_button]:hover:!bg-neutral-800
                      [&_button]:!transition-colors
                      [&_select]:!rounded-lg
                      [&_select]:!border-neutral-300
                      [&_select]:!px-3
                      [&_select]:!py-2
                    "
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            {isScanning ? (
              <ButtonPrimary
                onClick={stopScanning}
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {isLoading ? <LoadingCircleSmall /> : "Stop Scanning"}
              </ButtonPrimary>
            ) : (
              <ButtonPrimary
                onClick={startScanning}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? <LoadingCircleSmall /> : "Start Scanning"}
              </ButtonPrimary>
            )}
            <DialogClose ref={closeRef} className="sr-only"></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
