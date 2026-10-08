/**
 * Downscales a campaign image in the browser before upload.
 *
 * Uploads pass through a Next server action and then the API's multipart
 * parser, and a phone photo blows past the action's body limit on its own.
 * Nothing is lost by doing it here: the API resizes every email image to 1200px
 * and re-encodes it (s3_service `uploadEmailImage`), so this only discards what
 * the server was going to discard anyway — and the upload gets faster.
 *
 * Compresses to a byte budget, dropping quality first and dimensions second.
 * GIFs are left alone (a canvas keeps only the first frame of an animation), as
 * is anything the browser cannot decode. Never throws: on any failure the
 * original file goes up and the API's own size check has the last word.
 *
 * Adapted from the organisation app's lib/compressImage.ts.
 */

/** The API's own ceiling for email images; nothing above it survives anyway. */
const MAX_DIMENSION = 1200;
const QUALITY = 0.85;
const MAX_BYTES = 600 * 1024;

const MIN_QUALITY = 0.45;
const QUALITY_STEP = 0.1;
const DIMENSION_STEP = 0.8;
const MIN_DIMENSION = 600;

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

export async function compressImage(file: File): Promise<File> {
  if (
    !file.type.startsWith("image/") ||
    file.type === "image/svg+xml" ||
    file.type === "image/gif"
  ) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);

    let dimension = MAX_DIMENSION;
    let quality = QUALITY;
    let blob = await encode(bitmap, dimension, quality);

    while (blob && blob.size > MAX_BYTES) {
      if (quality > MIN_QUALITY) {
        quality = Math.max(MIN_QUALITY, quality - QUALITY_STEP);
      } else if (dimension > MIN_DIMENSION) {
        dimension = Math.max(
          MIN_DIMENSION,
          Math.round(dimension * DIMENSION_STEP),
        );
      } else {
        break;
      }
      blob = await encode(bitmap, dimension, quality);
    }
    bitmap.close();

    // An already-small file can come out larger after re-encoding.
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], name, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
