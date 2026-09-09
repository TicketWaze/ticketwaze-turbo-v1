import { cn } from "@/lib/utils";

/**
 * The one heading that stays put while a page scrolls.
 *
 * Two things have to be true for this to work, and both are easy to break:
 *
 * 1. It must be a **direct child of the element that scrolls**. `sticky` is
 *    confined to its parent's box, so a heading nested inside a flex row or a
 *    wrapper div only stays for as long as that wrapper is on screen — which,
 *    for a one-line row, is no time at all.
 * 2. That scroller must be height-bounded. Inside AdminLayout's flex column
 *    that means `flex-1 min-h-0` — see PAGE_SCROLLER.
 *
 * `pb-8 -mb-8` is deliberate: the padding paints an opaque band so rows do not
 * show through the flex gap underneath the text, and the negative margin takes
 * back the space that padding would otherwise add on top of the parent's gap.
 */
export default function PageTitle({
  children,
  className,
  as: Tag = "h3",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "h2" | "h3";
}) {
  return (
    <Tag
      className={cn(
        "sticky top-0 z-20 bg-white pb-8 -mb-8 font-medium font-primary text-[2.6rem] leading-12 text-black",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

/**
 * AdminLayout's shared container only scrolls below `lg`, so a page that wants
 * to scroll at every width brings its own scroller. `flex-1 min-h-0` is what
 * makes it scroll rather than grow past the bottom of the flex column.
 */
export const PAGE_SCROLLER =
  "flex flex-1 min-h-0 flex-col gap-8 overflow-y-auto";
