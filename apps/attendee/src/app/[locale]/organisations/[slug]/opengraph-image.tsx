import { ImageResponse } from "next/og";
import { getOrganisation } from "@/lib/getOrganisation";

/**
 * The link-preview card for a shared organisation page.
 *
 * Composed at 1200×630 rather than pointing the tag straight at the
 * organisation's profile image, because that image is a square logo — the one
 * on file is 800×800 — and most organisations have none at all. Serving it raw
 * would mean either declaring dimensions that are false, which leaves WhatsApp
 * and Facebook cropping unpredictably, or declaring none and getting a small
 * thumbnail. A fixed-size card is the only way to promise the aspect ratio the
 * unfurlers actually want, and it still puts the organisation's image front and
 * centre when there is one.
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Organisation on Ticketwaze";

const BRAND = "#E45B00";
const INK = "#0D0D0D";
const MUTED = "#737C8A";

export default async function Image({
  params,
}: {
  // A Promise, as everywhere else in the app router — reading `params.slug`
  // directly yields undefined and silently renders the empty fallback card.
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug } = await params;
  const organisation = await getOrganisation(slug).catch(() => null);

  const name = organisation?.organisationName ?? "Ticketwaze";
  const imageUrl: string | null = organisation?.profileImageUrl ?? null;
  const place = [organisation?.city, organisation?.country]
    .filter(Boolean)
    .join(", ");
  const eventCount = organisation?.events?.length ?? 0;
  const followerCount = organisation?.followers?.length ?? 0;
  const initial = name.trim().charAt(0).toUpperCase() || "T";
  // Descriptions are free text and can run long; the card has room for roughly
  // two lines before it starts crowding the footer.
  const rawDescription = String(organisation?.organisationDescription ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const description =
    rawDescription.length > 150
      ? `${rawDescription.slice(0, 150).trimEnd()}…`
      : rawDescription;

  /**
   * Satori renders a flexbox subset — no grid, no `gap` shorthand quirks, and
   * every multi-child element needs an explicit `display: flex`. Remote images
   * must be plain <img> with an absolute URL; next/image does not work here.
   */
  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#FFFFFF",
        padding: "72px",
        fontFamily: "sans-serif",
      }}
    >
      {/* Brand rule along the top edge */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          width: "1200px",
          height: "12px",
          backgroundColor: BRAND,
        }}
      />

      <div style={{ display: "flex", alignItems: "center" }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            width={200}
            height={200}
            alt=""
            style={{
              width: "200px",
              height: "200px",
              borderRadius: "100px",
              objectFit: "cover",
            }}
          />
        ) : (
          // Same initial-in-a-circle the page itself falls back to, so a
          // logo-less organisation still unfurls as something deliberate.
          <div
            style={{
              display: "flex",
              width: "200px",
              height: "200px",
              borderRadius: "100px",
              backgroundColor: INK,
              color: "#FFFFFF",
              fontSize: "96px",
              fontWeight: 600,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {initial}
          </div>
        )}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginLeft: "48px",
            maxWidth: "800px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "64px",
              fontWeight: 700,
              color: INK,
              lineHeight: 1.1,
            }}
          >
            {name.length > 40 ? `${name.slice(0, 40)}…` : name}
          </div>
          {place ? (
            <div
              style={{
                display: "flex",
                fontSize: "32px",
                color: MUTED,
                marginTop: "16px",
              }}
            >
              {place}
            </div>
          ) : null}
        </div>
      </div>

      {description ? (
        <div
          style={{
            display: "flex",
            fontSize: "34px",
            lineHeight: 1.4,
            color: INK,
            opacity: 0.75,
            maxWidth: "1020px",
          }}
        >
          {description}
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", fontSize: "30px", color: MUTED }}>
          {eventCount} {eventCount === 1 ? "event" : "events"}
          {"   ·   "}
          {followerCount} {followerCount === 1 ? "follower" : "followers"}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "30px",
            fontWeight: 600,
            color: BRAND,
          }}
        >
          Ticketwaze
        </div>
      </div>
    </div>,
    { ...size },
  );
}
