"use client";
import { useLocale, useTranslations } from "next-intl";
import { DateTime } from "luxon";
import type {
  EventFormQuestion,
  EventFormResponse,
} from "@ticketwaze/typescript-config";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Capitalize from "@/lib/Capitalize";

/**
 * What people answered, one row per ticket holder.
 *
 * COLUMNS COME FROM THE QUESTION LIST, not from the answers. Building them out
 * of whatever turned up would produce a table whose shape changes with the
 * data — an optional question nobody answered would have no column at all, and
 * a retired one would silently disappear along with the answers it holds. The
 * question list is the stable spine; a blank cell means "not answered", which
 * is itself information.
 *
 * Retired questions are still shown, marked, for the same reason: their answers
 * exist and belong to someone.
 */
export default function ResponsesTable({
  responses,
  questions,
}: {
  responses: EventFormResponse[];
  questions: EventFormQuestion[];
}) {
  const t = useTranslations("Events.single_event.forms");
  const locale = useLocale();

  if (responses.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-[1.5rem] leading-8 text-neutral-600 text-center max-w-152">
          {t("no_responses")}
        </p>
      </div>
    );
  }

  return (
    <div className="py-8 flex flex-col gap-4">
      {/* The table grows a column per question, so it scrolls inside itself
          rather than pushing the page sideways. */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("col_attendee")}</TableHead>
              <TableHead>{t("col_ticket")}</TableHead>
              {questions.map((question) => (
                <TableHead key={question.eventFormQuestionId}>
                  {question.label}
                  {!question.isActive && (
                    <span className="ml-2 text-[1.1rem] uppercase tracking-[0.04em] text-neutral-500">
                      {t("retired")}
                    </span>
                  )}
                </TableHead>
              ))}
              <TableHead>{t("col_date")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {responses.map((response) => {
              const byQuestion = new Map(
                response.answers.map((answer) => [
                  answer.eventFormQuestionId,
                  answer,
                ]),
              );

              return (
                <TableRow key={response.ticketId}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-deep-100">{response.fullName}</span>
                      <span className="text-neutral-500 text-[1.2rem]">
                        {response.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-deep-100">{response.ticketName}</span>
                      <span className="text-neutral-500 text-[1.2rem]">
                        {Capitalize(response.ticketType)}
                      </span>
                    </div>
                  </TableCell>
                  {questions.map((question) => {
                    const answer = byQuestion.get(question.eventFormQuestionId);
                    return (
                      <TableCell key={question.eventFormQuestionId}>
                        {answer ? (
                          <span className="text-deep-100">
                            {answer.answer}
                            {answer.isOther && (
                              <span className="ml-2 text-[1.1rem] uppercase tracking-[0.04em] text-neutral-500">
                                {t("other_tag")}
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell className="whitespace-nowrap">
                    {DateTime.fromISO(String(response.answeredAt))
                      .setLocale(locale)
                      .toLocaleString(DateTime.DATE_MED)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
