/**
 * Request-body ceiling for forms that post files through a server action.
 *
 * Next rejects an oversized action body by REJECTING the call rather than
 * returning an error, and a rejected action never reaches the caller's success
 * or error branch — the form is left with no result and no reason. Checking the
 * size before the call turns that silent failure into a message.
 *
 * The raffle forms are the only ones that send several images at once (a cover
 * plus one picture per prize), so they are the ones that can reach the limit.
 * Keep in step with serverActions.bodySizeLimit in next.config.ts and the API's
 * multipart limit in config/bodyparser.ts; the margin leaves room for the text
 * fields and the multipart framing that ride along with the files.
 */
export const MAX_UPLOAD_BYTES = 9 * 1024 * 1024;

/** Approximate encoded size of a FormData payload: exact for files, close enough for text. */
export function formDataSize(formData: FormData): number {
  let total = 0;
  for (const value of formData.values()) {
    total += value instanceof File ? value.size : value.length;
  }
  return total;
}
