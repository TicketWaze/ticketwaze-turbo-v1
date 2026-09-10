/**
 * Rasterizes the Ticketwaze wordmark (vector SVG in /public) to a PNG data URL,
 * since jsPDF cannot embed SVG directly.
 *
 * Shared by every generated document so they all carry the same header. Returns
 * null rather than throwing when the image cannot be loaded — a report without
 * its logo is still a report, and a download that fails outright is not.
 */
export async function loadPdfLogo(): Promise<{
  data: string;
  width: number;
  height: number;
} | null> {
  const img = await new Promise<HTMLImageElement | null>((resolve) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => resolve(null);
    el.src = "/logo-horizontal-orange.svg";
  });
  if (!img) return null;
  // 2x the display size in the PDF, for crisp print output
  const width = 600;
  const height = Math.round(width * (172.53 / 893.37));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, width, height);
  return { data: canvas.toDataURL("image/png"), width, height };
}
