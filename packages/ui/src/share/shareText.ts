/**
 * Plain text from an activity's rich-text (HTML) description: block ends and
 * line breaks become spaces, tags go, common entities decode, whitespace
 * collapses. Regex-only so it runs the same on the server and in the browser.
 */
export function plainText(html: string | null | undefined): string {
  if (!html) return "";
  return html
    .replace(/<\s*br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** Cuts `text` to at most `max` characters, at a word boundary, with "…". */
export function truncate(text: string, max: number): string {
  if (max <= 1) return "";
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`;
}

/* X counts any link as 23 characters, whatever its length. */
const X_LIMIT = 280;
const X_LINK = 23;
/* WhatsApp has no real limit; long enough to say what it is, short enough
   that the link stays on screen in the chat bubble. */
const WHATSAPP_EXCERPT = 300;

/**
 * The text a share prefills: the activity's name, an excerpt of its own
 * description, then the link. `fallback` (the generic invite) stands in when
 * the activity has no description.
 */
export function shareMessages({
  title,
  description,
  link,
  fallback,
}: {
  title?: string;
  description?: string | null;
  link: string;
  fallback: string;
}): { whatsapp: string; x: string } {
  const text = plainText(description);
  const name = title?.trim() ?? "";
  if (!text) {
    const head = name ? `${name}\n\n${fallback}` : fallback;
    return { whatsapp: `${head}\n\n${link}`, x: `${head}\n\n${link}` };
  }
  const head = name ? `${name}\n\n` : "";
  // X: name + two blank lines + excerpt + two blank lines + link ≤ 280.
  const xRoom = X_LIMIT - X_LINK - head.length - 2;
  const x = xRoom > 20
    ? `${head}${truncate(text, xRoom)}\n\n${link}`
    : `${truncate(name, X_LIMIT - X_LINK - 2)}\n\n${link}`;
  return {
    whatsapp: `${name ? `*${name}*\n\n` : ""}${truncate(text, WHATSAPP_EXCERPT)}\n\n${link}`,
    x,
  };
}
