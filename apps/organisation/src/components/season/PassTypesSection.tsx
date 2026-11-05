"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { Add, Edit2, TicketStar } from "iconsax-reactjs";
import { formatMoney } from "@ticketwaze/currency";
import { SeasonMatch, SeasonPassType } from "@ticketwaze/typescript-config";
import { ButtonPill } from "@/components/shared/buttons";
import MountOnOpen from "@/components/shared/MountOnOpen";

// Opened rarely: its code loads on first open (see MountOnOpen).
const PassTypeDialog = dynamic(() => import("./PassTypeDialog"));

/**
 * The season's passes on the organiser's season page: each pass type with
 * its price, how many are sold, and where its holders sit; plus create and
 * edit. A pass needs a match to seat people at, so the button waits for one.
 */
export default function PassTypesSection({
  seasonId,
  passTypes,
  matches,
  canEdit,
}: {
  seasonId: string;
  passTypes: SeasonPassType[];
  /** Every match; only those still to play are mapped. */
  matches: SeasonMatch[];
  canEdit: boolean;
}) {
  const t = useTranslations("Events.season.passes");
  const locale = useLocale();
  const [editing, setEditing] = useState<SeasonPassType | "new" | null>(null);
  const upcoming = matches.filter((m) => !m.isOver && !m.event.cancelledAt);

  // Ticket type names by id, across every match, for the "sits in" line.
  const tierName = new Map(
    matches.flatMap((m) =>
      (m.event.eventTicketTypes ?? []).map(
        (tt) => [tt.eventTicketTypeId, tt.ticketTypeName] as const,
      ),
    ),
  );

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-primary font-medium text-[2rem] leading-10 text-deep-100">
            {t("title")}
          </h2>
          <p className="text-[1.3rem] leading-7 text-neutral-600 max-w-[60rem]">
            {upcoming.length === 0 ? t("needs_match") : t("hint")}
          </p>
        </div>
        {canEdit && upcoming.length > 0 && (
          <ButtonPill
            tone="primary"
            type="button"
            onClick={() => setEditing("new")}
          >
            <Add size="18" color="#fff" />
            {t("add")}
          </ButtonPill>
        )}
      </div>

      {passTypes.length > 0 && (
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {passTypes.map((pass) => {
            const percent = pass.quantity
              ? Math.min(
                  100,
                  Math.round((pass.quantitySold / pass.quantity) * 100),
                )
              : 0;
            const upcomingMappings = pass.mappings.filter((x) =>
              upcoming.some((m) => m.eventId === x.eventId),
            );
            const names = [
              ...new Set(
                upcomingMappings.map(
                  (x) => tierName.get(x.eventTicketTypeId) ?? "?",
                ),
              ),
            ];
            return (
              <li
                key={pass.seasonPassTypeId}
                className="flex flex-col gap-4 rounded-[1.5rem] border border-neutral-100 p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                      <TicketStar size="20" color="#E45B00" variant="Bulk" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-[1.6rem] leading-8 text-deep-100 truncate">
                        {pass.name}
                      </p>
                      <p className="text-[1.4rem] leading-7 text-primary-500 font-medium">
                        {formatMoney(
                          pass.currency === "USD" ? pass.usdPrice : pass.price,
                          pass.currency,
                          locale,
                        )}
                      </p>
                    </div>
                  </div>
                  {canEdit && upcoming.length > 0 && (
                    <button
                      type="button"
                      aria-label={t("edit_title")}
                      onClick={() => setEditing(pass)}
                      className="w-12 h-12 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                    >
                      <Edit2 size="16" color="#737c8a" variant="Bulk" />
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between text-[1.3rem] text-neutral-700">
                    <span>
                      {t("sold", {
                        sold: pass.quantitySold,
                        total: pass.quantity,
                      })}
                    </span>
                    <span>{percent}%</span>
                  </div>
                  <div className="h-[0.6rem] rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
                {names.length > 0 && (
                  <p className="text-[1.3rem] leading-7 text-neutral-600">
                    {t("sits_in", {
                      tiers: names.join(", "),
                      count: upcomingMappings.length,
                    })}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <MountOnOpen open={editing !== null}>
        <PassTypeDialog
          // A fresh form per pass type opened.
          key={
            editing === "new" ? "new" : (editing?.seasonPassTypeId ?? "none")
          }
          open={editing !== null}
          onOpenChange={(open) => !open && setEditing(null)}
          seasonId={seasonId}
          matches={upcoming}
          passType={editing && editing !== "new" ? editing : undefined}
        />
      </MountOnOpen>
    </section>
  );
}
