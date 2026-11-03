/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

/** "Violette AC" → "VA": what stands in for a team that has no logo. */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters =
    words.length > 1 ? words[0]![0]! + words[1]![0]! : (words[0] ?? "?").slice(0, 2);
  return letters.toUpperCase();
}

/** A team's logo in a circle, or its initials when it has none. */
export default function TeamCrest({
  name,
  logoUrl,
  size = 40,
  className,
}: {
  name: string;
  logoUrl?: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full overflow-hidden bg-neutral-100 border border-neutral-200 flex items-center justify-center",
        className,
      )}
      style={{ width: size, height: size }}
      title={name}
    >
      {logoUrl ? (
        <img src={logoUrl} alt={name} className="w-full h-full object-contain" />
      ) : (
        <span
          className="font-primary font-bold text-neutral-700"
          style={{ fontSize: Math.max(10, size * 0.32) }}
        >
          {initials(name)}
        </span>
      )}
    </span>
  );
}
