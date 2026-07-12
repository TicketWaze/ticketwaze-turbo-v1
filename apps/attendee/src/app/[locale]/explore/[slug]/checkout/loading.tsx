import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import Image from "next/image";

export default function Loading() {
  return (
    <AttendeeLayout
      title=""
      className="h-full flex items-center justify-center"
    >
      <div className="relative w-md h-112 flex items-center justify-center">
        <svg
          className="absolute inset-0 w-full h-full overflow-visible"
          viewBox="0 0 280 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g>
            <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 140 140" to="360 140 140" dur="12s" repeatCount="indefinite" />
            <circle cx="140" cy="140" r="128" stroke="#e45b00" strokeWidth="1.5" strokeDasharray="22 14" strokeLinecap="round" opacity="0.28" />
            <circle cx="140" cy="12" r="4" fill="#e45b00" opacity="0.45" />
          </g>
          <g>
            <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 140 140" to="-360 140 140" dur="7s" repeatCount="indefinite" />
            <circle cx="140" cy="140" r="103" stroke="#e45b00" strokeWidth="2.5" strokeDasharray="60 36" strokeLinecap="round" opacity="0.55" />
            <circle cx="140" cy="37" r="5" fill="#e45b00" opacity="0.7" />
          </g>
          <g>
            <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 140 140" to="360 140 140" dur="2.5s" repeatCount="indefinite" />
            <circle cx="140" cy="140" r="80" stroke="#e45b00" strokeWidth="4" strokeDasharray="95 207" strokeLinecap="round" />
            <circle cx="140" cy="60" r="6.5" fill="#e45b00" />
          </g>
        </svg>
        <div
          className="absolute w-52 h-52 rounded-full flex items-center justify-center"
          style={{ background: "radial-gradient(circle, #fff7f0 0%, #ffe8d6 100%)" }}
        >
          <div className="w-[9.6rem] h-[9.6rem] rounded-full bg-orange-100 flex items-center justify-center animate-pulse">
            <Image src="/logo-simple-orange.svg" alt="Ticketwaze" width={52} height={52} className="object-contain" priority />
          </div>
        </div>
      </div>
    </AttendeeLayout>
  );
}
