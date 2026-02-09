"use client";
import { ArrowRight2, Warning2 } from "iconsax-reactjs";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import NoAuthDialog from "@/components/Layouts/NoAuthDialog";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddReportEvent } from "@/actions/eventActions";
import { toast } from "sonner";
import { usePathname } from "@/i18n/navigation";
import { Event } from "@ticketwaze/typescript-config";
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
import { ButtonNeutral, ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";

export default function ReportEventComponent({ event }: { event: Event }) {
  const { data: session } = useSession();
  const t = useTranslations("Event");
  const [isLoading, setIsLoading] = useState(false);
  const [previousStep, setPreviousStep] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const delta = currentStep - previousStep;
  const [wordCount, setWordCount] = useState(0);
  function handleWordCount(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setWordCount(e.target.value.length);
  }
  const ReportEventSchema = z
    .object({
      status: z.enum(
        [
          t("inappropriateContent"),
          t("misleadingInformation"),
          t("fraud"),
          t("venue"),
          t("other"),
        ] as const,
        { error: t("validStatus") },
      ),
      otherReason: z.string().optional(),
    })
    .refine(
      (data) => {
        // If status is "other", otherReason must be provided
        if (data.status === t("other")) {
          return data.otherReason && data.otherReason.trim().length > 10;
        }
        return true;
      },
      {
        message: t("pleaseSpecifyReason"),
        path: ["otherReason"],
      },
    );
  type TReportEventSchema = z.infer<typeof ReportEventSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TReportEventSchema>({
    resolver: zodResolver(ReportEventSchema),
  });
  const pathname = usePathname();
  const locale = useLocale();
  const closeReportRef = useRef<HTMLButtonElement>(null);
  async function ReportEvent(data: TReportEventSchema) {
    setIsLoading(true);
    const message = data.status === t("other") ? data.otherReason : data.status;
    const result = await AddReportEvent(
      session?.user.accessToken ?? "",
      event.eventId,
      pathname,
      { message: message!, organisationId: event.organisationId },
      locale,
    );
    if (result.status !== "success") {
      toast.error(result.message);
    } else {
      toast.success("Success");
      setPreviousStep(0);
      setCurrentStep(1);
      reset();
      closeReportRef.current?.click();
    }
    setIsLoading(false);
  }
  function next() {
    if (currentStep === 1) {
      setValue("status", t("other"));
      setPreviousStep(currentStep);
      setCurrentStep((s) => s + 1);
    }
  }
  function back() {
    if (currentStep > 1) {
      setValue("status", "");
      setPreviousStep(currentStep);
      setCurrentStep((s) => s - 1);
    } else {
      reset();
      closeReportRef.current?.click();
    }
  }
  return (
    <>
      {session?.user ? (
        <Dialog>
          <form>
            <DialogTrigger asChild>
              <div className="flex items-center gap-4 cursor-pointer">
                <Warning2 size="20" color="#DE0028" variant="Bulk" />
                <span className="text-[1.4rem] leading-8 text-failure">
                  {t("reportEvent")}
                </span>
              </div>
            </DialogTrigger>
            <DialogContent className="flex flex-col gap-8 max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>{t("reportEvent")}</DialogTitle>
                <DialogDescription className=" text-[1.8rem] leading-8 text-neutral-400 text-center">
                  {t("reportEventDescription")}
                </DialogDescription>
              </DialogHeader>
              {currentStep === 1 && (
                <motion.div
                  // initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  layout={false}
                  className="flex flex-col gap-8 h-full px-2 py-1 overflow-y-scroll"
                >
                  <label
                    htmlFor="inappropriateContent"
                    className="font-medium cursor-pointer  relative bg-neutral-100 hover:bg-zinc-100 flex items-center px-4 py-[1.5rem] gap-3 rounded-[10px] text-[1.6rem] leading-8 text-deep-100 has-[:checked]:bg-white has-[:checked]:ring-primary-500 has-checked:shadow-lg has-[:checked]:ring-1 select-none"
                  >
                    {t("inappropriateContent")}
                    <input
                      type="radio"
                      className="peer/html w-4 h-4 opacity-0 absolute accent-current right-3"
                      id="inappropriateContent"
                      value={t("inappropriateContent")}
                      {...register("status")}
                    />
                  </label>
                  <label
                    htmlFor="misleadingInformation"
                    className="font-medium cursor-pointer  relative bg-neutral-100 hover:bg-zinc-100 flex items-center px-4 py-[1.5rem] gap-3 rounded-[10px] text-[1.6rem] leading-8 text-deep-100 has-[:checked]:bg-white has-[:checked]:ring-primary-500 has-checked:shadow-lg has-[:checked]:ring-1 select-none"
                  >
                    {t("misleadingInformation")}
                    <input
                      type="radio"
                      className="peer/html w-4 h-4 opacity-0 absolute accent-current right-3"
                      id="misleadingInformation"
                      value={t("misleadingInformation")}
                      {...register("status")}
                    />
                  </label>
                  <label
                    htmlFor="fraud"
                    className="font-medium cursor-pointer  relative bg-neutral-100 hover:bg-zinc-100 flex items-center px-4 py-[1.5rem] gap-3 rounded-[10px] text-[1.6rem] leading-8 text-deep-100 has-[:checked]:bg-white has-[:checked]:ring-primary-500 has-checked:shadow-lg has-[:checked]:ring-1 select-none"
                  >
                    {t("fraud")}
                    <input
                      type="radio"
                      className="peer/html w-4 h-4 opacity-0 absolute accent-current right-3"
                      id="fraud"
                      value={t("fraud")}
                      {...register("status")}
                    />
                  </label>
                  <label
                    htmlFor="venue"
                    className="font-medium cursor-pointer  relative bg-neutral-100 hover:bg-zinc-100 flex items-center px-4 py-[1.5rem] gap-3 rounded-[10px] text-[1.6rem] leading-8 text-deep-100 has-[:checked]:bg-white has-[:checked]:ring-primary-500 has-checked:shadow-lg has-[:checked]:ring-1 select-none"
                  >
                    {t("venue")}
                    <input
                      type="radio"
                      className="peer/html w-4 h-4 opacity-0 absolute accent-current right-3"
                      id="venue"
                      value={t("venue")}
                      {...register("status")}
                    />
                  </label>
                  <button
                    onClick={next}
                    className="font-medium cursor-pointer  relative bg-neutral-100 hover:bg-zinc-100 flex items-center justify-between px-4 py-[1.5rem] gap-3 rounded-[10px] text-[1.6rem] leading-8 text-deep-100 has-[:checked]:bg-white has-[:checked]:ring-primary-500 has-checked:shadow-lg has-[:checked]:ring-1 select-none"
                  >
                    {t("other")}
                    <ArrowRight2 size={20} color="#2E3237" variant="Bulk" />
                  </button>
                  <span className={"text-[1.2rem] px-8 py-2 text-failure"}>
                    {errors.status?.message}
                  </span>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  initial={{ x: delta >= 0 ? "50%" : "-50%", opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  layout={false}
                  className="flex flex-col gap-8 h-full overflow-y-scroll border border-neutral-100 rounded-[15px] p-[15px]"
                >
                  <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                    {t("question")}
                  </span>
                  <div>
                    <textarea
                      className={
                        "bg-neutral-100 w-full rounded-[2rem] h-[150px] resize-none p-8 text-[1.5rem] leading-[20px] placeholder:text-neutral-600 text-deep-200 outline-none border disabled:text-neutral-600 disabled:cursor-not-allowed border-transparent focus:border-primary-500"
                      }
                      placeholder={t("message")}
                      minLength={10}
                      maxLength={350}
                      {...register("otherReason")}
                      onChange={handleWordCount}
                    />
                    <div className="flex items-center justify-between">
                      <span className={"text-[1.2rem] px-8 py-2 text-failure"}>
                        {errors?.otherReason?.message}
                      </span>
                      {wordCount > 0 && (
                        <span
                          className={`text-[1.2rem] text-nowrap px-8 py-2 ${wordCount < 10 ? "text-failure" : "text-success"}`}
                        >
                          {wordCount} / 350
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              <DialogFooter className="flex gap-4 items-center">
                <DialogClose ref={closeReportRef}></DialogClose>
                <ButtonNeutral onClick={back} className="w-full flex-1">
                  {t("back")}
                </ButtonNeutral>
                {/* </DialogClose> */}
                <ButtonPrimary
                  type="submit"
                  className="w-full flex-1"
                  onClick={handleSubmit(ReportEvent)}
                >
                  {isLoading ? <LoadingCircleSmall /> : t("reportEvent")}
                </ButtonPrimary>
              </DialogFooter>
            </DialogContent>
          </form>
        </Dialog>
      ) : (
        <Dialog>
          <DialogTrigger>
            <div className="flex items-center gap-4 cursor-pointer">
              <Warning2 size="20" color="#DE0028" variant="Bulk" />
              <span className="text-[1.4rem] leading-8 text-failure">
                {t("reportEvent")}
              </span>
            </div>
          </DialogTrigger>
          <NoAuthDialog />
        </Dialog>
      )}
    </>
  );
}
