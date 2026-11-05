"use client";
import { useTranslations } from "next-intl";
import { TicketStar } from "iconsax-reactjs";
import { SeasonPassType } from "@ticketwaze/typescript-config";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const selectTriggerClass =
  "bg-neutral-100 w-full rounded-[5rem] data-[size=default]:h-[5rem] shadow-none focus-visible:ring-0 px-6 text-[1.4rem] leading-8 text-deep-200 outline-none border border-transparent focus:border-primary-500 data-[placeholder]:text-neutral-600";

export type PassMappingValue = Record<string, string>; // passTypeId → ticket type name
export type PassMappingErrors = Record<string, string>;

/** The ticket type names on the form, trimmed, without blanks or repeats. */
export function tierNamesOf(tiers: { ticketTypeName?: string }[]): string[] {
  return [
    ...new Set(
      tiers.map((t) => (t.ticketTypeName ?? "").trim()).filter(Boolean),
    ),
  ];
}

/**
 * Every pass type sits somewhere at this match, in a ticket type with room
 * for all of its holders (passes of several types may share one). Mirrors
 * the API's check (season_matches.readMatchInput) so the organiser sees the
 * problem on the form rather than after submitting.
 */
export function validatePassMappings(
  passTypes: SeasonPassType[],
  value: PassMappingValue,
  tiers: { ticketTypeName?: string; ticketTypeQuantity?: string | number }[],
  t: (key: string, values?: Record<string, string | number>) => string,
): PassMappingErrors {
  const errors: PassMappingErrors = {};
  const quantityOf = new Map(
    tiers.map((tier) => [
      (tier.ticketTypeName ?? "").trim().toLowerCase(),
      Number(tier.ticketTypeQuantity ?? 0),
    ]),
  );
  const needed = new Map<string, number>();
  for (const pass of passTypes) {
    const name = (value[pass.seasonPassTypeId] ?? "").trim().toLowerCase();
    if (!name || !quantityOf.has(name)) {
      errors[pass.seasonPassTypeId] = t("errors.choose");
      continue;
    }
    needed.set(name, (needed.get(name) ?? 0) + pass.quantitySold);
  }
  for (const pass of passTypes) {
    const name = (value[pass.seasonPassTypeId] ?? "").trim().toLowerCase();
    if (errors[pass.seasonPassTypeId] || !name) continue;
    const want = needed.get(name) ?? 0;
    if ((quantityOf.get(name) ?? 0) < want) {
      errors[pass.seasonPassTypeId] = t("errors.too_small", { count: want });
    }
  }
  return errors;
}

/**
 * On the new-match ticket step of a season that sells passes: for each pass
 * type, which of the ticket types being created its holders get.
 */
export default function NewMatchPassMappings({
  passTypes,
  tierNames,
  value,
  onChange,
  errors,
}: {
  passTypes: SeasonPassType[];
  tierNames: string[];
  value: PassMappingValue;
  onChange: (value: PassMappingValue) => void;
  errors: PassMappingErrors;
}) {
  const t = useTranslations("Events.season.passes.new_match");
  return (
    <section className="flex flex-col gap-4 rounded-[2rem] border border-neutral-100 p-6 lg:p-8">
      <div className="flex items-start gap-4">
        <span className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
          <TicketStar size="20" color="#E45B00" variant="Bulk" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="font-primary font-medium text-[1.7rem] leading-8 text-deep-100">
            {t("title")}
          </p>
          <p className="text-[1.3rem] leading-7 text-neutral-600">
            {t("hint")}
          </p>
        </div>
      </div>
      <ul className="flex flex-col gap-4">
        {passTypes.map((pass) => {
          const current = value[pass.seasonPassTypeId];
          return (
            <li
              key={pass.seasonPassTypeId}
              className="flex flex-col lg:flex-row lg:items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[1.5rem] font-medium leading-8 text-deep-100 truncate">
                  {pass.name}
                </p>
                <p className="text-[1.2rem] leading-6 text-neutral-600">
                  {t("holders", { count: pass.quantitySold })}
                </p>
              </div>
              <div className="lg:w-[26rem] shrink-0">
                <Select
                  value={
                    current && tierNames.includes(current) ? current : undefined
                  }
                  onValueChange={(v) =>
                    onChange({ ...value, [pass.seasonPassTypeId]: v })
                  }
                >
                  <SelectTrigger className={selectTriggerClass}>
                    <SelectValue placeholder={t("choose")} />
                  </SelectTrigger>
                  <SelectContent>
                    {tierNames.map((name) => (
                      <SelectItem
                        key={name}
                        value={name}
                        className="text-[1.4rem]"
                      >
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors[pass.seasonPassTypeId] && (
                  <p className="text-[1.2rem] px-6 py-2 text-failure">
                    {errors[pass.seasonPassTypeId]}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
