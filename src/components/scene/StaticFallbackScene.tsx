"use client";

/**
 * Lightweight atmospheric SVG/CSS fallback rendered when:
 * - prefers-reduced-motion is enabled
 * - WebGL is unavailable or context is lost
 * - The user toggles "Static Backdrop" for low-power devices
 */
export function StaticFallbackScene() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none"
      style={{
        background:
          "linear-gradient(180deg, #0b101d 0%, #1d2236 32%, #593b44 62%, #c97b4b 88%, #141925 100%)",
      }}
    >
      {/* Soft Golden-Hour Sun Halo */}
      <div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-55"
        style={{
          left: "32%",
          top: "44%",
          width: "min(56vw, 520px)",
          height: "min(56vw, 520px)",
          background:
            "radial-gradient(circle, rgba(255,214,158,0.85) 0%, rgba(232,146,84,0.35) 45%, transparent 72%)",
        }}
      />

      {/* Layered Alpine Ridges & Stylized Summit Weeping Tree Silhouette */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <linearGradient id="ridgeFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a3347" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#1b2030" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="ridgeMid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#272c3c" />
            <stop offset="100%" stopColor="#121723" />
          </linearGradient>
          <linearGradient id="summitNear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1d222d" />
            <stop offset="100%" stopColor="#0a0e16" />
          </linearGradient>
        </defs>

        {/* Distant Jagged Peaks */}
        <path
          d="M0 620 L160 470 L290 540 L460 390 L610 495 L790 360 L960 480 L1140 385 L1310 490 L1440 420 L1440 900 L0 900 Z"
          fill="url(#ridgeFar)"
        />

        {/* Midground Alpine Slopes */}
        <path
          d="M0 680 L230 555 L420 630 L640 520 L850 615 L1080 510 L1290 605 L1440 560 L1440 900 L0 900 Z"
          fill="url(#ridgeMid)"
        />

        {/* Summit Outcrop */}
        <path
          d="M0 780 Q320 695 720 660 Q1120 690 1440 770 L1440 900 L0 900 Z"
          fill="url(#summitNear)"
        />

        {/* Stylized Weeping Tree at the Summit */}
        <g transform="translate(760, 665)">
          <path
            d="M0 10 C8 -55 24 -120 18 -195 C14 -215 -10 -235 -30 -248 M18 -195 C46 -225 96 -235 135 -205 M14 -175 C-35 -215 -98 -220 -138 -182 M20 -190 C55 -195 102 -175 126 -140 M12 -185 C-25 -185 -74 -165 -102 -130"
            stroke="#151921"
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
          />
          {/* Drooping Weeping Foliage Curtains */}
          <g stroke="#29352f" strokeWidth="4" strokeLinecap="round" opacity="0.88">
            <path d="M-126 -184 Q-132 -120 -122 -55" />
            <path d="M-104 -195 Q-112 -125 -98 -45" />
            <path d="M-80 -208 Q-86 -130 -74 -40" />
            <path d="M-54 -222 Q-60 -135 -48 -52" />
            <path d="M-26 -236 Q-32 -140 -18 -58" />
            <path d="M12 -232 Q18 -135 28 -55" />
            <path d="M46 -226 Q56 -130 62 -46" />
            <path d="M78 -220 Q92 -125 96 -42" />
            <path d="M108 -210 Q120 -125 124 -54" />
            <path d="M132 -198 Q142 -120 138 -62" />
          </g>
        </g>

        {/* Foreground Overlook Silhouette */}
        <path
          d="M0 845 L210 795 L380 845 L1090 855 L1260 800 L1440 835 L1440 900 L0 900 Z"
          fill="#090c13"
        />
      </svg>
    </div>
  );
}
