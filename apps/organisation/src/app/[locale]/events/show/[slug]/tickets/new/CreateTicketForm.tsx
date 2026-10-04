"use client";
import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AnimatePresence, motion } from "motion/react";
import { AddCircle, Trash, Warning2 } from "iconsax-reactjs";
import { toast } from "sonner";
import { Event, MembershipTier } from "@ticketwaze/typescript-config";
import {
  CreateFooter,
  CreateHeader,
  CreatedScreen,
  Section,
} from "@/components/create/CreateParts";
import { SalesWindowFields } from "@/components/create/FormFields";
import { Input } from "@/components/shared/Inputs";
import ToggleIcon from "@/components/shared/ToggleIcon";
import { TicketTypePricePreview } from "@/components/shared/AttendeePricePreview";
import { useRouter } from "@/i18n/navigation";
import { AddTicketTypesAction } from "@/actions/EventActions";
import { slugify } from "@/lib/Slugify";

/** New classes per submit, like the create form's three. */
const MAX_NEW = 3;

const blank = (isFree: boolean) => ({
  ticketTypeName: "",
  ticketTypeDescription: "",
  ticketTypePrice: "",
  ticketTypeQuantity: "",
  isFree,
  salesStartAt: "",
  salesEndAt: "",
});

/**
 * Create Ticket (Figma 1785:39235 / 1785:39329 / 1785:39804): new ticket
 * classes for an event that already exists, appended to the ones on sale.
 * The activity's free/paid shape is fixed — an all-free event gets free
 * classes, a paid one paid classes, and only a mixed event (Pro) gets the
 * per-class free switch — mirroring what the API accepts.
 */
export default function CreateTicketForm({
  event,
  membershipTier,
}: {
  event: Event;
  membershipTier: MembershipTier;
}) {
  const t = useTranslations("Events.create_event");
  const tc = useTranslations("Events.create_ticket");
  const locale = useLocale();
  const router = useRouter();
  const [done, setDone] = useState(false);
  const eventHref = `/events/show/${slugify(event.eventName, event.eventId)}`;

  const existing = event.eventTicketTypes;
  const existingNames = new Set(
    existing.map((c) => c.ticketTypeName.trim().toLowerCase()),
  );
  const isFreeTier = (price: number | string) => Number(price) <= 0;
  const existingFree = existing.filter((c) => isFreeTier(c.ticketTypePrice));
  const mixed =
    existingFree.length > 0 && existingFree.length < existing.length;
  const freeOnly = event.isFree;
  const freeSeatsUsed = existingFree.reduce(
    (sum, c) => sum + Number(c.ticketTypeQuantity || 0),
    0,
  );
  const freeSeatsLeft = Math.max(0, membershipTier.freeTickets - freeSeatsUsed);
  const currency = event.currency;

  const schema = z
    .object({
      ticketTypes: z
        .array(
          z
            .object({
              ticketTypeName: z
                .string()
                .trim()
                .min(3, t("errors.ticketClass.name")),
              ticketTypeDescription: z
                .string()
                .min(20, t("errors.ticketClass.description"))
                .max(150),
              ticketTypePrice: z.string(),
              ticketTypeQuantity: z
                .string()
                .min(1, t("errors.ticketClass.quantity.empty"))
                .refine((val) => /^[1-9]\d*$/.test(val), {
                  message: t("errors.ticketClass.quantity.decimal"),
                }),
              isFree: z.boolean(),
              salesStartAt: z.string().optional(),
              salesEndAt: z.string().optional(),
            })
            .refine(
              (ticket) =>
                !ticket.salesStartAt ||
                !ticket.salesEndAt ||
                ticket.salesEndAt > ticket.salesStartAt,
              {
                message: t("errors.ticketClass.salesWindow"),
                path: ["salesEndAt"],
              },
            ),
        )
        .min(1),
    })
    .superRefine((data, ctx) => {
      const seen = new Set(existingNames);
      let freeQuantity = freeSeatsUsed;
      data.ticketTypes.forEach((ticket, index) => {
        const name = ticket.ticketTypeName.trim().toLowerCase();
        if (name && seen.has(name)) {
          ctx.addIssue({
            code: "custom",
            message: tc("duplicate"),
            path: ["ticketTypes", index, "ticketTypeName"],
          });
        }
        seen.add(name);
        if (ticket.isFree) {
          freeQuantity += parseInt(ticket.ticketTypeQuantity, 10) || 0;
          if (freeQuantity > membershipTier.freeTickets) {
            ctx.addIssue({
              code: "custom",
              message: t("errors.ticketClass.quantity.exceedsLimit", {
                limit: membershipTier.freeTickets,
              }),
              path: ["ticketTypes", index, "ticketTypeQuantity"],
            });
          }
          return;
        }
        if (ticket.ticketTypePrice.trim().length === 0) {
          ctx.addIssue({
            code: "custom",
            message: t("errors.ticketClass.price"),
            path: ["ticketTypes", index, "ticketTypePrice"],
          });
          return;
        }
        const price = parseFloat(ticket.ticketTypePrice);
        if (currency === "HTG" && price < 100) {
          ctx.addIssue({
            code: "custom",
            message: t("errors.ticketClass.priceMinHTG"),
            path: ["ticketTypes", index, "ticketTypePrice"],
          });
        } else if (currency === "USD" && price < 5) {
          ctx.addIssue({
            code: "custom",
            message: t("errors.ticketClass.priceMinUSD"),
            path: ["ticketTypes", index, "ticketTypePrice"],
          });
        }
      });
    });
  type Values = z.infer<typeof schema>;

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { ticketTypes: [blank(freeOnly)] },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "ticketTypes",
  });
  const watched = useWatch({ control, name: "ticketTypes" }) ?? [];
  const [lengths, setLengths] = useState<number[]>([0]);

  async function submit(values: Values) {
    const result = await AddTicketTypesAction(
      event.eventId,
      values.ticketTypes.map((ticket) => ({
        ticketTypeName: ticket.ticketTypeName.trim(),
        ticketTypeDescription: ticket.ticketTypeDescription,
        ticketTypePrice: ticket.isFree ? 0 : Number(ticket.ticketTypePrice),
        ticketTypeQuantity: Number(ticket.ticketTypeQuantity),
        salesStartAt: ticket.salesStartAt || null,
        salesEndAt: ticket.salesEndAt || null,
      })),
      locale,
    );
    if (result.status === "failed") {
      if (result.code === "DUPLICATE_NAME") {
        // The API names the class; flag every new one that collides.
        values.ticketTypes.forEach((ticket, index) => {
          if (existingNames.has(ticket.ticketTypeName.trim().toLowerCase())) {
            setError(`ticketTypes.${index}.ticketTypeName`, {
              message: tc("duplicate"),
            });
          }
        });
      }
      toast.error(result.message || tc("failed"));
      return;
    }
    setDone(true);
    setTimeout(() => {
      router.push(eventHref);
      router.refresh();
    }, 1600);
  }

  if (done) {
    return (
      <CreatedScreen
        title={tc("success_title")}
        description={tc("success_description")}
        pendingLabel={tc("opening")}
      />
    );
  }

  return (
    <div className="flex flex-col h-full gap-10 lg:gap-12">
      <CreateHeader title={tc("title")} onBack={() => router.push(eventHref)} />
      <form
        id="create-ticket"
        onSubmit={handleSubmit(submit)}
        className="flex-1 overflow-y-auto flex flex-col gap-10 pb-6"
        noValidate
        // A wheel over a focused number field scrolls the form, not the value.
        onWheel={(e) => {
          const el = e.target as HTMLInputElement;
          if (el.type === "number" && document.activeElement === el) el.blur();
        }}
      >
        <motion.p
          className="w-full max-w-[54rem] mx-auto flex items-start gap-3 text-[1.3rem] leading-7 text-neutral-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Warning2
            size="18"
            variant="Bulk"
            color="#737C8A"
            className="shrink-0 mt-[.2rem]"
            aria-hidden
          />
          <span>
            {tc("existing", {
              names: existing.map((c) => c.ticketTypeName).join(", "),
            })}
            {" · "}
            {freeOnly ? tc("free_only") : !mixed ? tc("paid_only") : null}
          </span>
        </motion.p>

        <AnimatePresence initial={false}>
          {fields.map((field, index) => {
            const tierFree = Boolean(watched[index]?.isFree);
            return (
              <motion.div
                key={field.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25, delay: index === 0 ? 0.1 : 0 }}
              >
                <Section
                  title={t("ticket_class")}
                  action={
                    index > 0 && (
                      <button
                        type="button"
                        aria-label="Remove"
                        className="cursor-pointer flex"
                        onClick={() => {
                          remove(index);
                          setLengths((prev) =>
                            prev.filter((_, i) => i !== index),
                          );
                        }}
                      >
                        <Trash variant="Bulk" color="#DE0028" size={20} />
                      </button>
                    )
                  }
                >
                  {mixed && (
                    <div className="flex items-center justify-between gap-6">
                      <p className="text-[1.6rem] leading-8 text-deep-100">
                        {t("mark_ticket_as_free")}
                      </p>
                      <label className="relative inline-block h-12 w-20 shrink-0 cursor-pointer rounded-full bg-neutral-600 transition has-checked:bg-primary-500">
                        <input
                          className="peer sr-only"
                          type="checkbox"
                          checked={tierFree}
                          onChange={() => {
                            setValue(`ticketTypes.${index}.isFree`, !tierFree);
                            setValue(
                              `ticketTypes.${index}.ticketTypePrice`,
                              "",
                            );
                          }}
                        />
                        <ToggleIcon />
                      </label>
                    </div>
                  )}

                  <Input
                    {...register(
                      `ticketTypes.${index}.ticketTypeName` as const,
                    )}
                    error={errors.ticketTypes?.[index]?.ticketTypeName?.message}
                  >
                    {t("class_name")}
                  </Input>

                  <div>
                    <textarea
                      className="h-60 text-[1.5rem] resize-none bg-neutral-100 w-full rounded-[2rem] p-8 outline-none border border-transparent focus:border-primary-500 placeholder:text-neutral-600"
                      placeholder={t("class_description")}
                      maxLength={150}
                      {...register(
                        `ticketTypes.${index}.ticketTypeDescription` as const,
                        {
                          onChange: (e) =>
                            setLengths((prev) => {
                              const next = [...prev];
                              next[index] = e.target.value.length;
                              return next;
                            }),
                        },
                      )}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-[1.2rem] px-8 py-2 text-failure">
                        {
                          errors.ticketTypes?.[index]?.ticketTypeDescription
                            ?.message
                        }
                      </span>
                      {(lengths[index] ?? 0) > 0 && (
                        <span
                          className={`text-[1.2rem] text-nowrap self-end px-8 py-2 ${(lengths[index] ?? 0) < 20 ? "text-failure" : "text-success"}`}
                        >
                          {lengths[index]} / 150
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1">
                      {tierFree ? (
                        <Input defaultValue={"Free"} disabled readOnly>
                          {t("price")}
                        </Input>
                      ) : (
                        <>
                          <div className="bg-neutral-100 w-full rounded-[5rem] h-[6rem] px-8 flex items-center gap-2 border border-transparent focus-within:border-primary-500">
                            <input
                              className="flex-1 min-w-0 bg-transparent outline-none text-[1.5rem] placeholder:text-neutral-600"
                              type="number"
                              inputMode="decimal"
                              placeholder={t("price")}
                              {...register(
                                `ticketTypes.${index}.ticketTypePrice` as const,
                              )}
                            />
                            <span className="text-[1.5rem] font-medium text-deep-100">
                              {currency}
                            </span>
                          </div>
                          <span className="text-[1.2rem] px-8 py-2 text-failure">
                            {
                              errors.ticketTypes?.[index]?.ticketTypePrice
                                ?.message
                            }
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        className="bg-neutral-100 text-[1.5rem] w-full rounded-[5rem] h-[6rem] px-8 outline-none border border-transparent focus:border-primary-500 placeholder:text-neutral-600"
                        type="number"
                        inputMode="numeric"
                        step="1"
                        min={1}
                        max={tierFree ? freeSeatsLeft : undefined}
                        placeholder={t("quantity")}
                        {...register(
                          `ticketTypes.${index}.ticketTypeQuantity` as const,
                        )}
                      />
                      <span className="text-[1.2rem] px-8 py-2 text-failure">
                        {
                          errors.ticketTypes?.[index]?.ticketTypeQuantity
                            ?.message
                        }
                      </span>
                    </div>
                  </div>

                  <SalesWindowFields
                    startProps={register(
                      `ticketTypes.${index}.salesStartAt` as const,
                    )}
                    endProps={register(
                      `ticketTypes.${index}.salesEndAt` as const,
                    )}
                    endError={errors.ticketTypes?.[index]?.salesEndAt?.message}
                    t={t}
                  />

                  {!tierFree && (
                    <TicketTypePricePreview
                      control={control}
                      index={index}
                      currency={currency}
                      absorbFees={event.absorbFees === true}
                    />
                  )}
                </Section>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {fields.length < MAX_NEW && (
          <div className="w-full max-w-[54rem] mx-auto flex justify-end">
            <button
              type="button"
              onClick={() => {
                append(blank(freeOnly));
                setLengths((prev) => [...prev, 0]);
              }}
              className="cursor-pointer flex gap-3 items-center group"
            >
              <AddCircle
                color="#E45B00"
                variant="Bulk"
                size="20"
                className="transition-transform group-hover:rotate-90"
              />
              <span className="text-[1.5rem] leading-8 text-primary-500">
                {t("add_class")}
              </span>
            </button>
          </div>
        )}
        {/* Room above the phone's pinned footer bar. */}
        <div className="h-24 lg:hidden" />
      </form>
      <CreateFooter
        step={0}
        total={1}
        onBack={() => router.push(eventHref)}
        type="submit"
        formId="create-ticket"
        continueLabel={tc("create")}
        loading={isSubmitting}
      />
    </div>
  );
}
