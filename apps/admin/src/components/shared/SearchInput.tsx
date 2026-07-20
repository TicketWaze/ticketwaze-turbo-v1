"use client";
import { CloseCircle, SearchNormal } from "iconsax-reactjs";
import { cn } from "@/lib/utils";

/**
 * The attendee app's search field, sized to sit inline with the admin filter
 * pills. Purely presentational: it owns no query state and no debounce, so the
 * page decides when a keystroke becomes a request.
 */
export default function SearchInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-neutral-100 rounded-[3rem] flex items-center gap-4 justify-between py-[0.8rem] px-6 w-full lg:w-[24.3rem]",
        className,
      )}
    >
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="bg-transparent text-deep-100 font-normal text-[1.4rem] leading-8 w-full outline-none"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="cursor-pointer shrink-0 flex items-center"
        >
          <CloseCircle size="20" color="#737c8a" variant="Bulk" />
        </button>
      ) : (
        <SearchNormal
          size="20"
          color="#737c8a"
          variant="Bulk"
          className="shrink-0"
        />
      )}
    </div>
  );
}
