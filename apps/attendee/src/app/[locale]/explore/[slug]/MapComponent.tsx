import Image from "next/image";

interface StaticMapProps {
  location: { lat: number; lng: number };
  width?: number;
  height?: number;
  zoom?: number;
}

export default function MapComponent({
  location,
  width = 600,
  height = 420,
  zoom = 18,
}: StaticMapProps) {
  const src =
    `https://maps.googleapis.com/maps/api/staticmap` +
    `?center=${location.lat},${location.lng}` +
    `&zoom=${zoom}` +
    `&size=${width}x${height}` +
    `&markers=color:red|${location.lat},${location.lng}` +
    `&key=${process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY}`;

  return (
    <Image
      src={src}
      alt="Event location"
      width={width}
      height={height}
      className="rounded-xl w-full object-cover"
    />
  );
}
