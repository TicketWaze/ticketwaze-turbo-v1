"use client";
import { useState } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Add,
  ArrowDown2,
  ArrowUp2,
  Edit2,
  InfoCircle,
  Lock1,
  Trash,
  Warning2,
} from "iconsax-reactjs";
import type {
  EventFormQuestion,
  EventFormQuestionType,
  EventFormResponse,
} from "@ticketwaze/typescript-config";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TopBar from "@/components/shared/TopBar";
import ToggleIcon from "@/components/shared/ToggleIcon";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import {
  CreateFormQuestion,
  DeleteFormQuestion,
  ReorderFormQuestions,
  SetFormQuestionActive,
  UpdateFormQuestion,
  type QuestionInput,
} from "@/actions/EventFormActions";
import QuestionEditor from "./QuestionEditor";
import ResponsesTable from "./ResponsesTable";

/**
 * THE CHECKOUT FORM BUILDER.
 *
 * Two tabs, because they answer two different questions: what am I asking, and
 * what have people said. The editor is the default — an organiser arriving here
 * for the first time has no responses to look at.
 *
 * THE LOCK IS THE THING THIS SCREEN HAS TO EXPLAIN. Once a question has been
 * answered it can no longer be edited or deleted, only switched off, because an
 * answer only means anything beside the question that produced it. That is
 * surfaced on the card itself rather than discovered at save time.
 */
export default function FormsPageContent({
  eventId,
  organisationId,
  questions,
  canUseForms,
  maxQuestions,
  responses,
}: {
  eventId: string;
  organisationId: string;
  questions: EventFormQuestion[];
  canUseForms: boolean;
  maxQuestions: number;
  responses: EventFormResponse[];
}) {
  const t = useTranslations("Events.single_event.forms");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const accessToken = session?.user.accessToken ?? "";

  const [editing, setEditing] = useState<EventFormQuestion | null>(null);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const atLimit = questions.length >= maxQuestions;

  /** Every mutation ends the same way, so the plumbing lives in one place. */
  async function run(
    action: () => Promise<{ status: "success" } | { error: string }>,
    successMessage: string,
    id?: string,
  ) {
    setBusyId(id ?? "form");
    const result = await action();
    setBusyId(null);
    if ("error" in result) {
      toast.error(result.error);
      return false;
    }
    toast.success(successMessage);
    router.refresh();
    return true;
  }

  async function save(input: QuestionInput) {
    const ok = editing
      ? await run(
          () =>
            UpdateFormQuestion(
              organisationId,
              eventId,
              accessToken,
              locale,
              editing.eventFormQuestionId,
              input,
              pathname,
            ),
          t("saved"),
          editing.eventFormQuestionId,
        )
      : await run(
          () =>
            CreateFormQuestion(
              organisationId,
              eventId,
              accessToken,
              locale,
              input,
              pathname,
            ),
          t("added"),
        );

    if (ok) {
      setEditing(null);
      setCreating(false);
    }
  }

  async function toggleActive(question: EventFormQuestion) {
    await run(
      () =>
        SetFormQuestionActive(
          organisationId,
          eventId,
          accessToken,
          locale,
          question.eventFormQuestionId,
          !question.isActive,
          pathname,
        ),
      question.isActive ? t("turned_off") : t("turned_on"),
      question.eventFormQuestionId,
    );
  }

  async function remove(question: EventFormQuestion) {
    await run(
      () =>
        DeleteFormQuestion(
          organisationId,
          eventId,
          accessToken,
          locale,
          question.eventFormQuestionId,
          pathname,
        ),
      t("deleted"),
      question.eventFormQuestionId,
    );
  }

  /**
   * Moving one question swaps it with its neighbour and sends the WHOLE new
   * order, because positions have to stay contiguous — the API refuses a
   * partial list for exactly that reason.
   */
  async function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    const reordered = [...questions];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);

    await run(
      () =>
        ReorderFormQuestions(
          organisationId,
          eventId,
          accessToken,
          locale,
          reordered.map((question) => question.eventFormQuestionId),
          pathname,
        ),
      t("reordered"),
      questions[index].eventFormQuestionId,
    );
  }

  // A plan that cannot build a form still sees what it already built — nothing
  // here is hidden, only the controls that would change it.
  if (!canUseForms) {
    return (
      <div className="flex flex-col gap-8">
        <TopBar title={t("subtitle")} />
        <div className="max-w-216 w-full mx-auto flex flex-col items-start gap-4 border p-8 rounded-2xl border-neutral-300">
          <Warning2 size="28" color="#737C8A" variant="Bulk" />
          <p className="text-[1.6rem] leading-9 text-deep-100">
            {t("upgrade_title")}
          </p>
          <p className="text-[1.4rem] leading-8 text-neutral-600">
            {t("upgrade_body")}
          </p>
        </div>
        {questions.length > 0 && (
          <div className="max-w-216 w-full mx-auto flex flex-col gap-6">
            {questions.map((question) => (
              <ReadOnlyCard key={question.eventFormQuestionId} question={question} t={t} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 h-full">
      <TopBar title={t("subtitle")}>
        <ButtonPrimary
          className="hidden lg:flex"
          disabled={atLimit || creating || Boolean(editing)}
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
        >
          {t("add_question")}
        </ButtonPrimary>
      </TopBar>

      <Tabs defaultValue="questions" className="w-full h-full">
        <TabsList className="w-full lg:max-w-[318px] lg:w-auto mx-auto lg:mx-0">
          <TabsTrigger value="questions">{t("tab_questions")}</TabsTrigger>
          <TabsTrigger value="responses">
            {t("tab_responses")}
            {responses.length > 0 && ` (${responses.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions">
          <div className="max-w-216 w-full mx-auto flex flex-col gap-6 py-8">
            <div className="flex items-start gap-3 border p-4 rounded-2xl border-neutral-300">
              <InfoCircle
                size="20"
                color="#737C8A"
                variant="Bulk"
                className="shrink-0 mt-[0.2rem]"
              />
              <p className="text-[1.3rem] leading-7 text-neutral-700">
                {t("intro")}
              </p>
            </div>

            {questions.length === 0 && !creating && (
              <div className="flex flex-col items-center gap-4 py-16">
                <p className="text-[1.5rem] leading-8 text-neutral-600 text-center max-w-152">
                  {t("empty")}
                </p>
              </div>
            )}

            {questions.map((question, index) => {
              const locked = (question.answerCount ?? 0) > 0;
              const isBusy = busyId === question.eventFormQuestionId;

              if (editing?.eventFormQuestionId === question.eventFormQuestionId) {
                return (
                  <QuestionEditor
                    key={question.eventFormQuestionId}
                    question={question}
                    onCancel={() => setEditing(null)}
                    onSave={save}
                    isSaving={isBusy}
                  />
                );
              }

              return (
                <div
                  key={question.eventFormQuestionId}
                  className={`p-6 rounded-[15px] flex flex-col gap-6 border ${question.isActive ? "border-neutral-100" : "border-neutral-200 bg-neutral-50"}`}
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-[1.6rem] leading-8 text-deep-100 font-medium">
                          {question.label}
                        </span>
                        {question.isRequired && (
                          <span className="text-[1.1rem] font-semibold uppercase tracking-[0.04em] text-primary-500 bg-primary-50 px-[0.6rem] py-[0.2rem] rounded-full">
                            {t("required")}
                          </span>
                        )}
                        {locked && (
                          <span className="flex items-center gap-1 text-[1.1rem] font-semibold uppercase tracking-[0.04em] text-neutral-600 bg-neutral-100 px-[0.6rem] py-[0.2rem] rounded-full">
                            <Lock1 size="12" color="#737C8A" variant="Bulk" />
                            {t("answers_count", { count: question.answerCount ?? 0 })}
                          </span>
                        )}
                      </div>
                      <span className="text-[1.3rem] leading-7 text-neutral-600">
                        {question.questionType === "text"
                          ? t("type_text")
                          : t("type_radio")}
                      </span>
                      {question.questionType === "radio" && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {question.options.map((option) => (
                            <span
                              key={option}
                              className="text-[1.2rem] leading-6 text-neutral-700 bg-neutral-100 px-[0.8rem] py-[0.3rem] rounded-full"
                            >
                              {option}
                            </span>
                          ))}
                          {question.allowOther && (
                            <span className="text-[1.2rem] leading-6 text-primary-500 bg-primary-50 px-[0.8rem] py-[0.3rem] rounded-full">
                              {t("other_option")}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <label className="relative inline-block h-12 w-20 shrink-0 cursor-pointer rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:transparent] has-checked:bg-primary-500">
                      <input
                        className="peer sr-only"
                        type="checkbox"
                        checked={question.isActive}
                        disabled={isBusy}
                        onChange={() => toggleActive(question)}
                      />
                      <ToggleIcon />
                    </label>
                  </div>

                  {locked && (
                    <p className="text-[1.2rem] leading-6 text-neutral-600 border-t border-dashed border-neutral-200 pt-4">
                      {t("locked_hint")}
                    </p>
                  )}

                  <div className="flex items-center gap-6 border-t border-neutral-100 pt-4">
                    <button
                      type="button"
                      disabled={index === 0 || isBusy}
                      onClick={() => move(index, -1)}
                      className="cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label={t("move_up")}
                    >
                      <ArrowUp2 size="18" color="#737C8A" variant="Bulk" />
                    </button>
                    <button
                      type="button"
                      disabled={index === questions.length - 1 || isBusy}
                      onClick={() => move(index, 1)}
                      className="cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label={t("move_down")}
                    >
                      <ArrowDown2 size="18" color="#737C8A" variant="Bulk" />
                    </button>
                    <div className="flex-1" />
                    {isBusy && <LoadingCircleSmall />}
                    {!locked && (
                      <>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => {
                            setCreating(false);
                            setEditing(question);
                          }}
                          className="flex items-center gap-2 cursor-pointer text-[1.4rem] text-neutral-700 hover:text-primary-500"
                        >
                          <Edit2 size="18" color="#737C8A" variant="Bulk" />
                          {t("edit")}
                        </button>
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => remove(question)}
                          className="flex items-center gap-2 cursor-pointer text-[1.4rem] text-failure"
                        >
                          <Trash size="18" color="#DE0028" variant="Bulk" />
                          {t("delete")}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}

            {creating && (
              <QuestionEditor
                onCancel={() => setCreating(false)}
                onSave={save}
                isSaving={busyId === "form"}
              />
            )}

            {atLimit && (
              <p className="text-[1.3rem] leading-7 text-neutral-600 text-center">
                {t("limit_reached", { max: maxQuestions })}
              </p>
            )}

            {!creating && !editing && !atLimit && (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="cursor-pointer flex gap-4 items-center self-end"
              >
                <Add color="#E45B00" size="20" />
                <span className="text-[1.5rem] leading-8 text-primary-500">
                  {t("add_question")}
                </span>
              </button>
            )}
          </div>
        </TabsContent>

        <TabsContent value="responses">
          <ResponsesTable responses={responses} questions={questions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/** What a downgraded plan sees: their own form, with nothing to press. */
function ReadOnlyCard({
  question,
  t,
}: {
  question: EventFormQuestion;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <div className="p-6 rounded-[15px] flex flex-col gap-3 border border-neutral-100">
      <span className="text-[1.6rem] leading-8 text-deep-100 font-medium">
        {question.label}
      </span>
      <span className="text-[1.3rem] leading-7 text-neutral-600">
        {question.questionType === "text" ? t("type_text") : t("type_radio")}
      </span>
      {question.questionType === "radio" && (
        <div className="flex flex-wrap gap-2">
          {question.options.map((option: string) => (
            <span
              key={option}
              className="text-[1.2rem] leading-6 text-neutral-700 bg-neutral-100 px-[0.8rem] py-[0.3rem] rounded-full"
            >
              {option}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export type { EventFormQuestionType };
