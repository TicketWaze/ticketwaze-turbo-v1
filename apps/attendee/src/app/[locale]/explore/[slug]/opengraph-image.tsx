import { ImageResponse } from "next/og";
import NextImage from "next/image";
import { Event } from "@ticketwaze/typescript-config";

export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  const eventRequest = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/events/${params.slug}`,
  );
  const eventResponse = await eventRequest.json();
  const event: Event = eventResponse.event;

  return new ImageResponse(
    <div
      style={{
        width: "1200px",
        height: "630px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <NextImage
        src={event.eventImageUrl}
        alt={event.eventName}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
        }}
      />
    </div>,
    {
      ...size,
    },
  );
}
