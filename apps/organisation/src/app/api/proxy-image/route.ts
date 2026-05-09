export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) return new Response("Missing url", { status: 400 });

  try {
    const response = await fetch(url);
    if (!response.ok)
      return new Response("Upstream error", { status: response.status });

    const blob = await response.blob();

    return new Response(blob, {
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "image/jpeg",
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new Response("Failed to fetch image", { status: 500 });
  }
}
