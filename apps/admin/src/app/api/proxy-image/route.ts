/**
 * Same-origin copy of an activity image, so the share dialog's poster canvas
 * is not tainted and can be downloaded (see EventPosterGenerator).
 *
 * Unlike the organisation dashboard's route it only fetches from our own image
 * CDN: an open "fetch any URL" endpoint on the admin origin would let anyone
 * use the server to reach addresses they cannot reach themselves.
 */
const ALLOWED_HOSTS = new Set(
  [process.env.NEXT_PUBLIC_CLOUDFRONT_HOSTNAME].filter(Boolean) as string[],
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) return new Response("Missing url", { status: 400 });

  let target: URL;
  try {
    target = new URL(url);
  } catch {
    return new Response("Invalid url", { status: 400 });
  }
  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname))
    return new Response("Host not allowed", { status: 403 });

  try {
    const response = await fetch(target, { redirect: "error" });
    if (!response.ok)
      return new Response("Upstream error", { status: response.status });

    const contentType = response.headers.get("Content-Type") ?? "image/jpeg";
    if (!contentType.startsWith("image/"))
      return new Response("Not an image", { status: 415 });

    return new Response(await response.blob(), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new Response("Failed to fetch image", { status: 500 });
  }
}
