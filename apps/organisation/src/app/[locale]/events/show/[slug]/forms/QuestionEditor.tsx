"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Add, CloseCircle } from "iconsax-reactjs";
import type { EventFormQuestion } from "@ticketwaze/typescript-config";
import { Input } from "@/components/shared/Inputs";
import ToggleIcon from "@/components/shared/ToggleIcon";
import { ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import type { QuestionInput } from "@/actions/EventFormActions";

const MAX_OPTIONS = 10;

/**
 * One question, being written or rewritten.
 *
 * Local state rather than react-hook-form: the shape changes with the type
 * (a radio grows an option list, a text question has none), and a field array
 * that appears and disappears is more code here than three `useState`s.
 *
 * Validation is duplicated from the API deliberately — the organiser should be
 * told about an empty option before a round trip, and the API re-checks
 * everything regardless because a form post is whatever the client sent.
 */
export default function QuestionEditor({
  question,
  onSave,
  onCancel,
  isSaving,
}: {
  question?: EventFormQuestion;
  onSave: (input: QuestionInput) => void | Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const t = useTranslations("Events.single_event.forms");

  const [label, setLabel] = useState(question?.label ?? "");
  const [questionType, setQuestionType] = useState<"text" | "radio">(
    question?.questionType ?? "text",
  );
  const [options, setOptions] = useState<string[]>(
    question?.options && question.options.length > 0
      ? question.options
      : ["", ""],
  );
  const [allowOther, setAllowOther] = useState(question?.allowOther ?? false);
  const [isRequired, setIsRequired] = useState(question?.isRequired ?? false);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const trimmedLabel = label.trim();
    if (trimmedLabel.length < 3) {
      setError(t("errors.label"));
      return;
    }

    if (questionType === "text") {
      setError(null);
      void onSave({ label: trimmedLabel, questionType: "text", isRequired });
      return;
    }

    const cleaned = options.map((option) => option.trim()).filter(Boolean);
    if (cleaned.length < 2) {
      setError(t("errors.options_min"));
      return;
    }
    // Case-insensitive, matching the API: two choices a buyer cannot tell apart
    // are one choice.
    const unique = new Set(cleaned.map((option) => option.toLowerCase()));
    if (unique.size !== cleaned.length) {
      setError(t("errors.options_unique"));
      return;
    }

    setError(null);
    void onSave({
      label: trimmedLabel,
      questionType: "radio",
      options: cleaned,
      allowOther,
      isRequired,
    });
  }

  return (
    <div className="p-6 rounded-[15px] flex flex-col gap-6 border border-primary-500">
      <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
        {question ? t("edit_question") : t("new_question")}
      </span>

      <Input
        value={label}
        maxLength={200}
        onChange={(e) => setLabel(e.target.value)}
      >
        {t("label")}
      </Input>

      {/* Type. Two buttons rather than a select: there are exactly two, and
          seeing both at once is what makes the choice obvious. */}
      <div className="flex flex-col gap-3">
        <span className="text-[1.4rem] leading-8 text-neutral-700">
          {t("type")}
        </span>
        <div className="flex gap-4">
          {(["text", "radio"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setQuestionType(type)}
              className={`flex-1 rounded-[1.5rem] border py-5 text-[1.4rem] transition-colors cursor-pointer ${
                questionType === type
                  ? "border-primary-500 bg-primary-50 text-primary-500"
                  : "border-neutral-200 text-deep-100 hover:border-primary-500"
              }`}
            >
              {type === "text" ? t("type_text") : t("type_radio")}
            </button>
          ))}
        </div>
        <p className="text-[1.2rem] leading-6 text-neutral-600">
          {questionType === "text" ? t("type_text_hint") : t("type_radio_hint")}
        </p>
      </div>

      {questionType === "radio" && (
        <div className="flex flex-col gap-4">
          <span className="text-[1.4rem] leading-8 text-neutral-700">
            {t("options")}
          </span>
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-3">
              <input
                value={option}
                maxLength={120}
                placeholder={t("option_placeholder", { number: index + 1 })}
                onChange={(e) =>
                  setOptions((prev) =>
                    prev.map((value, i) => (i === index ? e.target.value : value)),
                  )
                }
                className="flex-1 bg-neutral-100 text-[1.5rem] w-full rounded-[5rem] p-8 outline-none"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  aria-label={t("remove_option")}
                  onClick={() =>
                    setOptions((prev) => prev.filter((_, i) => i !== index))
                  }
                  className="cursor-pointer shrink-0"
                >
                  <CloseCircle size="22" color="#DE0028" variant="Bulk" />
                </button>
              )}
            </div>
          ))}

          {options.length < MAX_OPTIONS && (
            <button
              type="button"
              onClick={() => setOptions((prev) => [...prev, ""])}
              className="cursor-pointer flex gap-3 items-center self-start"
            >
              <Add color="#E45B00" size="20" />
              <span className="text-[1.5rem] leading-8 text-primary-500">
                {t("add_option")}
              </span>
            </button>
          )}

          {/* The escape hatch a fixed list can never cover. Radio only — a text
              question already accepts anything. */}
          <div className="flex items-center justify-between border-t border-dashed border-neutral-200 pt-4">
            <div className="flex flex-col gap-1 max-w-152">
              <p className="text-[1.5rem] leading-8 text-deep-100">
                {t("allow_other")}
              </p>
              <p className="text-[1.2rem] leading-6 text-neutral-600">
                {t("allow_other_hint")}
              </p>
            </div>
            <label className="relative inline-block h-12 w-20 shrink-0 cursor-pointer rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:transparent] has-checked:bg-primary-500">
              <input
                className="peer sr-only"
                type="checkbox"
                checked={allowOther}
                onChange={() => setAllowOther((prev) => !prev)}
              />
              <ToggleIcon />
            </label>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-dashed border-neutral-200 pt-4">
        <p className="text-[1.5rem] leading-8 text-deep-100 max-w-152">
          {t("required_label")}
        </p>
        <label className="relative inline-block h-12 w-20 shrink-0 cursor-pointer rounded-full bg-neutral-600 transition [-webkit-tap-highlight-color:transparent] has-checked:bg-primary-500">
          <input
            className="peer sr-only"
            type="checkbox"
            checked={isRequired}
            onChange={() => setIsRequired((prev) => !prev)}
          />
          <ToggleIcon />
        </label>
      </div>

      {error && (
        <span className="text-[1.2rem] px-2 text-failure">{error}</span>
      )}

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="flex-1 rounded-[5rem] border border-neutral-200 py-6 text-[1.5rem] text-deep-100 cursor-pointer"
        >
          {t("cancel")}
        </button>
        <ButtonPrimary
          type="button"
          onClick={submit}
          disabled={isSaving}
          className="flex-1"
        >
          {isSaving ? <LoadingCircleSmall /> : t("save")}
        </ButtonPrimary>
      </div>
    </div>
  );
}
