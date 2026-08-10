/**
 * Request-body ceiling for forms that post files through a server action.
 *
 * Next rejects an oversized action body by REJECTING the call rather than
 * returning an error, and a rejected action never reaches the caller's success
 * or error branch — the form is left with no result and no reason. Checking the
 * size before the call turns that silent failure into a message.
 *
 * Deliberately far below serverActions.bodySizeLimit (10mb). Something between
 * the browser and the app rejects raffle submits well before that ceiling — the
 * creates that succeed carry a few hundred KB of images, the ones that hung
 * carried uncompressed photos. Since compressImage now holds every picture to a
 * budget, a genuine raffle lands nowhere near this number; crossing it means an
 * image did not compress at all (an undecodable format such as HEIC passes
 * through untouched), which is exactly the case worth stopping here with a
 * message instead of letting it hang.
 */
export const MAX_UPLOAD_BYTES = 1.5 * 1024 * 1024;

/** Approximate encoded size of a FormData payload: exact for files, close enough for text. */
export function formDataSize(formData: FormData): number {
  let total = 0;
  for (const value of formData.values()) {
    total += value instanceof File ? value.size : value.length;
  }
  return total;
}
