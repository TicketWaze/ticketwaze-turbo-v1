import Image from "next/image";

/**
 * The branded ring + pulsing-logo loader used everywhere in the app (route
 * loading.tsx files, the checkout PageLoader overlay, TemporarilyUnavailable).
 *
 * Single source of truth so it always looks identical. Two things that used to
 * break across pages/browsers are fixed here:
 *  - The wrapper is a *definite square* (`aspect-square` + a width), so the SVG
 *    viewBox always maps 1:1 and the rings stay concentric. Previous copies used
 *    `w-md h-md` (h-md is not a real utility -> indeterminate height) or mixed
 *    280px / 448px sizes.
 *  - The centre disc is centred with an explicit translate instead of relying on
 *    an absolutely-positioned flex child's static position, which iOS Safari
 *    does not centre reliably (that's the off-centre logo in the report).
 * All inner sizes are percentages so the whole thing scales as one unit.
 */
export default function BrandedLoader() {
  return (
    <div className="relative aspect-square w-[280px] max-w-[82vw] shrink-0">
      {/*
       * Three concentric SVG rings — each group rotates independently, each with
       * a small solid "leading dot" so the motion reads as an orbiting body.
       * Radii: outer 128 · middle 103 · inner 80. SVG origin (140,140).
       */}
      <svg
        className="absolute inset-0 w-full h-full overflow-visible"
        viewBox="0 0 280 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer ring — slow clockwise */}
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
          <circle cx="140" cy="12" r="4" fill="#e45b00" opacity="0.45" />
        </g>

        {/* Middle ring — counter-clockwise */}
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
          <circle cx="140" cy="37" r="5" fill="#e45b00" opacity="0.7" />
        </g>

        {/* Inner arc — fast clockwise */}
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
          <circle cx="140" cy="60" r="6.5" fill="#e45b00" />
        </g>
      </svg>

      {/* Centre: nested circles + pulsing logo, explicitly centred on the rings */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[46%] h-[46%] rounded-full flex items-center justify-center"
        style={{
          background: "radial-gradient(circle, #fff7f0 0%, #ffe8d6 100%)",
        }}
      >
        <div className="w-[74%] h-[74%] rounded-full bg-orange-100 flex items-center justify-center animate-pulse">
          <Image
            src="/logo-simple-orange.svg"
            alt="Ticketwaze"
            width={52}
            height={52}
            className="w-[34%] h-auto object-contain"
            priority
          />
        </div>
      </div>
    </div>
  );
}
