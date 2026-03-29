// app/api/proxy-image/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) return new Response("Missing url", { status: 400 });

  const response = await fetch(url, {
    headers: {
      Origin: new URL(url).origin,
    },
  });

  const blob = await response.blob();

  return new Response(blob, {
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
      "Cache-Control": "public, max-age=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
