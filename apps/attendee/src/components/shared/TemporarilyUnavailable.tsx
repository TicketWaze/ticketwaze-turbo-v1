import Image from "next/image";

type Props = {
  title?: string;
  description?: string;
};

export default function TemporarilyUnavailable({ title, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-14 select-none">
      {/* ── Animated logo ── */}
      <div className="relative w-[280px] h-[280px] flex items-center justify-center">
        {/*
         * Three concentric SVG rings — each group rotates independently.
         * Each ring has a small solid "leading dot" at its tip so the motion
         * looks like an orbiting body pulling the arc behind it.
         *
         * Radii:   outer 128 · middle 103 · inner 80
         * Speeds:  12 s CW · 7 s CCW · 2.5 s CW
         * The SVG origin is (140, 140) — center of the 280×280 viewBox.
         */}
        <svg
          className="absolute inset-0 w-full h-full overflow-visible"
          viewBox="0 0 280 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* ── Outer ring — slow clockwise dashes ── */}
          <g>
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from="0 140 140"
              to="360 140 140"
              dur="12s"
              repeatCount="indefinite"
            />
            <circle
              cx="140"
              cy="140"
              r="128"
              stroke="#e45b00"
              strokeWidth="1.5"
              strokeDasharray="22 14"
              strokeLinecap="round"
              opacity="0.28"
            />
            {/* leading dot — top of circle = (140, 140-128) */}
            <circle cx="140" cy="12" r="4" fill="#e45b00" opacity="0.45" />
          </g>

          {/* ── Middle ring — counter-clockwise ── */}
          <g>
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from="0 140 140"
              to="-360 140 140"
              dur="7s"
              repeatCount="indefinite"
            />
            <circle
              cx="140"
              cy="140"
              r="103"
              stroke="#e45b00"
              strokeWidth="2.5"
              strokeDasharray="60 36"
              strokeLinecap="round"
              opacity="0.55"
            />
            {/* leading dot — top = (140, 140-103) = (140, 37) */}
            <circle cx="140" cy="37" r="5" fill="#e45b00" opacity="0.7" />
          </g>

          {/* ── Inner arc — fast clockwise ── */}
          <g>
            <animateTransform
              attributeName="transform"
              attributeType="XML"
              type="rotate"
              from="0 140 140"
              to="360 140 140"
              dur="2.5s"
              repeatCount="indefinite"
            />
            <circle
              cx="140"
              cy="140"
              r="80"
              stroke="#e45b00"
              strokeWidth="4"
              strokeDasharray="95 207"
              strokeLinecap="round"
            />
            {/* leading dot — top = (140, 140-80) = (140, 60) */}
            <circle cx="140" cy="60" r="6.5" fill="#e45b00" />
          </g>
        </svg>

        {/* ── Center: nested circles + pulsing logo ── */}
        <div
          className="absolute w-[130px] h-[130px] rounded-full flex items-center justify-center"
          style={{ background: "radial-gradient(circle, #fff7f0 0%, #ffe8d6 100%)" }}
        >
          <div className="w-[96px] h-[96px] rounded-full bg-orange-100 flex items-center justify-center animate-pulse">
            <Image
              src="/logo-simple-orange.svg"
              alt="Ticketwaze"
              width={52}
              height={52}
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>

      {/* ── Text ── */}
      <div className="flex flex-col gap-4 items-center text-center max-w-[38rem] px-4">
        <h2 className="text-[2rem] font-semibold leading-snug text-deep-100">
          {title}
        </h2>
        <p className="text-[1.45rem] leading-[2.5rem] text-neutral-500">
          {description}
        </p>
      </div>
    </div>
  );
}
