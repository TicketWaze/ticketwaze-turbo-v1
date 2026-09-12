"use client";

import { cn } from "@/lib/utils";

/**
 * The inputs the four admin activity-edit forms are built from.
 *
 * They exist because there are four of these forms and the venue one alone has
 * forty-odd fields — restating the same eight Tailwind classes per input is how
 * three of them end up looking almost but not quite like the fourth. Nothing
 * here is clever: it is the shared appearance, plus the one behaviour every
 * field needs (showing the server's error for its own key).
 */

export const INPUT_CLASS =
  "w-full bg-neutral-100 rounded-[1.4rem] px-6 py-4 text-[1.5rem] leading-8 text-deep-100 outline-none border-2 border-transparent focus:border-primary-500 transition-colors";

export const LABEL_CLASS =
  "text-[1.3rem] font-medium leading-8 text-neutral-700 pb-2 block";

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-[1.2rem] leading-6 text-failure pt-1">{message}</p>
  );
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[1.2rem] leading-6 text-neutral-500 pt-1">{children}</p>
  );
}

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h3 className="font-semibold text-[1.6rem] leading-8 text-deep-100">
          {title}
        </h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function TextField({
  label,
  value,
  onChange,
  error,
  hint,
  type = "text",
  className,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: React.ReactNode;
  type?: string;
  className?: string;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type" | "className"
>) {
  return (
    <div className={className}>
      <label className={LABEL_CLASS}>{label}</label>
      <input
        {...rest}
        type={type}
        className={INPUT_CLASS}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint && <FieldHint>{hint}</FieldHint>}
      <FieldError message={error} />
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  error,
  hint,
  rows = 8,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: React.ReactNode;
  rows?: number;
}) {
  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      <textarea
        rows={rows}
        className={cn(INPUT_CLASS, "resize-y")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {hint && <FieldHint>{hint}</FieldHint>}
      <FieldError message={error} />
    </div>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
}) {
  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      <select
        className={cn(INPUT_CLASS, "cursor-pointer")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldError message={error} />
    </div>
  );
}

export function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-4 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="w-5 h-5 accent-primary-500 cursor-pointer shrink-0"
      />
      <span className="text-[1.4rem] leading-8 text-neutral-700">{label}</span>
    </label>
  );
}

/**
 * A comma-separated list bound to a string[]. Used for tags, cuisines,
 * amenities and the rest — free-text lists an admin edits far faster by typing
 * than by clicking through a tag widget.
 */
export function ListField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  hint?: React.ReactNode;
}) {
  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      <input
        className={INPUT_CLASS}
        value={value.join(", ")}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(
            event.target.value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          )
        }
      />
      {hint && <FieldHint>{hint}</FieldHint>}
    </div>
  );
}

/**
 * A file input that says what happens when nothing is chosen — which for every
 * one of these forms is "keep what is already there", and is not obvious from
 * an empty file input.
 */
export function ImageField({
  label,
  file,
  onChange,
  keepLabel,
  replaceLabel,
  multiple = false,
  onFilesChange,
}: {
  label: string;
  file?: File | null;
  onChange?: (file: File | null) => void;
  keepLabel: string;
  replaceLabel: string;
  multiple?: boolean;
  onFilesChange?: (files: File[]) => void;
}) {
  const chosen = multiple ? undefined : file;
  return (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      <input
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={(event) => {
          const list = Array.from(event.target.files ?? []);
          if (multiple) onFilesChange?.(list);
          else onChange?.(list[0] ?? null);
        }}
        className="text-[1.4rem] text-neutral-700 cursor-pointer"
      />
      <FieldHint>{chosen || multiple ? replaceLabel : keepLabel}</FieldHint>
    </div>
  );
}

/** A bordered card for one repeated row — an event day, a prize, a tier. */
export function RepeatCard({
  title,
  onRemove,
  removeLabel,
  children,
}: {
  title: string;
  onRemove?: () => void;
  removeLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.4rem] border border-neutral-200 p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-[1.3rem] font-medium text-neutral-700">
          {title}
        </span>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-[1.3rem] text-failure cursor-pointer shrink-0"
          >
            {removeLabel}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
