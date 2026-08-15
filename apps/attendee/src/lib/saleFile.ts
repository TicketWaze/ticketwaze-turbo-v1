/**
 * Describing a file for sale, in words a buyer recognises.
 *
 * Plain functions in their own module, NOT exported from a component file:
 * `SaleCard.tsx` carries "use client", and every export of a client module is a
 * client reference — so a Server Component importing one of these from there
 * gets "Attempted to call fileKind() from the server but fileKind is on the
 * client" rather than a string. The product page renders on the server, so
 * these have to live somewhere with no directive at all, which lets both sides
 * import them.
 */

/** Compact enough to sit on one line of a card. */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${Math.round(bytes / 1024)} KB`;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

/**
 * The file's kind, as a buyer would say it.
 *
 * A MIME type is the honest value but "application/vnd.openxmlformats-
 * officedocument.wordprocessingml.document" tells a shopper nothing. The
 * extension is what they actually match against "will this open on my laptop".
 */
export function fileKind(filename: string, mimeType: string): string {
  const extension = filename.split(".").pop();
  if (extension && extension.length <= 5 && extension !== filename) {
    return extension.toUpperCase();
  }
  return mimeType.split("/").pop()?.toUpperCase() ?? "FILE";
}
