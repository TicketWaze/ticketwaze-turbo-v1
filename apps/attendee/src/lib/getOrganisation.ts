/**
 * The public organisation payload, by shareable slug or bare id.
 *
 * Deliberately unauthenticated and cached. The organisation page renders the
 * same thing for every visitor — the only per-user piece, follow state, is
 * resolved client-side from the session. Sending no Authorization header keeps
 * this a single shared cache entry, and lets `generateMetadata` and the page
 * body dedupe into one request instead of two: Next collapses identical fetches
 * within a render, which an auth header would defeat.
 *
 * Returns null rather than throwing so callers can decide between a 404 and a
 * degraded render.
 */
export async function getOrganisation(slug: string) {
  try {
    const request = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/organisations/${slug}`,
      { next: { revalidate: 60 } },
    );
    if (!request.ok) return null;
    // The API omits its data keys on error, so guard before reading.
    const response = await request.json().catch(() => null);
    return response?.organisation ?? null;
  } catch {
    return null;
  }
}
