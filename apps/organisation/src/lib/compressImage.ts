/**
 * Downscales and re-encodes an image in the browser before upload.
 *
 * Why this exists: uploads pass through a Next server action and then the API's
 * multipart parser, and a modern phone photo blows past the limits on its own.
 * Compressing here is not a quality trade-off — the API already re-encodes every
 * upload to WebP and compresses it with sharp, so this discards nothing the
 * server was not going to discard anyway. It just moves the work to where it
 * also saves upload time on a mobile connection.
 *
 * A single fixed-quality pass was not enough: one 1920px encode at q=0.82 still
 * lands in the megabytes for a detailed photo, and a raffle sends a cover plus
 * one picture per prize in ONE request. So this compresses to a byte BUDGET —
 * dropping quality first, then dimensions — until the result fits or it runs out
 * of room. Nothing downstream reports an oversized body as a normal error (Next
 * rejects the action call outright), so staying under the limit is the only way
 * the organiser ever finds out it worked.
 *
 * Returns the original file untouched if anything goes wrong; a failed
 * optimisation should never block a submit. That means a format the browser
 * cannot decode (HEIC on most browsers) passes through at full size — the
 * caller's own size guard is what catches that.
 *
 * Related: lib/ResizeImage.ts does the same job for the event create/edit forms
 * (1200px JPEG) and predates this. The two differ deliberately — that one
 * returns a Blob and rejects on failure, which its callers handle; this one
 * returns a File and never throws, so it can be dropped into a form that has no
 * error path for it. Worth collapsing into one helper if either is touched again.
 */

const MAX_DIMENSION = 1920;
const QUALITY = 0.82;
/**
 * Comfortably under any single-request body limit once a few of these ride
 * together. Calibrated against what demonstrably works: the raffle that did go
 * through carried a ~99KB cover, while the submits that hung were sending
 * uncompressed photos.
 */
const MAX_BYTES = 400 * 1024;

const MIN_QUALITY = 0.4;
const QUALITY_STEP = 0.12;
const DIMENSION_STEP = 0.75;
const MIN_DIMENSION = 480;

function encode(
  bitmap: ImageBitmap,
  dimension: number,
  quality: number,
): Promise<Blob | null> {
  const scale = Math.min(1, dimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const context = canvas.getContext("2d");
  if (!context) return Promise.resolve(null);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) =>
    canvas.toBlob(resolve, "image/webp", quality),
  );
}

export async function compressImage(
  file: File,
  maxDimension = MAX_DIMENSION,
  maxBytes = MAX_BYTES,
): Promise<File> {
  // Not an image, or a format canvas cannot decode reliably (e.g. HEIC on some
  // browsers, SVG) — leave it alone and let the server decide.
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);

    let dimension = maxDimension;
    let quality = QUALITY;
    let blob = await encode(bitmap, dimension, quality);

    // Squeeze quality first — it is nearly free visually at these sizes — and
    // only start shrinking the image once quality has nothing left to give.
    while (blob && blob.size > maxBytes) {
      if (quality > MIN_QUALITY) {
        quality = Math.max(MIN_QUALITY, quality - QUALITY_STEP);
      } else if (dimension > MIN_DIMENSION) {
        dimension = Math.max(MIN_DIMENSION, Math.round(dimension * DIMENSION_STEP));
      } else {
        break;
      }
      blob = await encode(bitmap, dimension, quality);
    }
    bitmap.close();

    if (!blob) return file;

    // An already-small, already-optimised file can come out larger after
    // re-encoding. Keep whichever is smaller.
    if (blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], name, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}

/** Compresses a list of images, preserving order. */
export async function compressImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map((file) => compressImage(file)));
}
