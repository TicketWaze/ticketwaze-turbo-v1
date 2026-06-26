/**
 * Strips HTML tags from a rich-text string and returns clean plain text.
 *
 * Event descriptions are stored as rich text (HTML), so passing them straight
 * into page metadata leaks `<p>` and other tags into OpenGraph/meta previews.
 * This removes tags, decodes the common named entities, and collapses
 * whitespace so the result is safe to use as a meta description.
 */
export default function StripHtml(html: string | null | undefined): string {
  if (!html) return "";

  return html
    .replace(/<[^>]*>/g, " ") // drop all tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ") // collapse whitespace left behind by tags
    .trim();
}
