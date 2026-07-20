/**
 * Downscales and re-encodes an image in the browser before upload.
 *
 * Why this exists: uploads pass through a Next server action (1MB default body
 * limit) and then the API's multipart parser, and a modern phone photo blows
 * past both on its own. Compressing here is not a quality trade-off — the API
 * already re-encodes every upload to WebP and compresses it to <=3MB with sharp,
 * so this discards nothing the server was not going to discard anyway. It just
 * moves the work to where it also saves upload time on a mobile connection.
 *
 * Returns the original file untouched if anything goes wrong; a failed
 * optimisation should never block a submit.
 *
 * Related: lib/ResizeImage.ts does the same job for the event create/edit forms
 * (1200px JPEG) and predates this. The two differ deliberately — that one
 * returns a Blob and rejects on failure, which its callers handle; this one
 * returns a File and never throws, so it can be dropped into a form that has no
 * error path for it. Worth collapsing into one helper if either is touched again.
 */

const MAX_DIMENSION = 1920;
const QUALITY = 0.82;

export async function compressImage(
  file: File,
  maxDimension = MAX_DIMENSION,
): Promise<File> {
  // Not an image, or a format canvas cannot decode reliably (e.g. HEIC on some
  // browsers, SVG) — leave it alone and let the server decide.
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    const scale = Math.min(1, maxDimension / Math.max(width, height));
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return file;
    }
    context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", QUALITY),
    );
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
