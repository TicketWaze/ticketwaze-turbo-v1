import localFont from "next/font/local";

/*
 * The three Ticketwaze typefaces, self-hosted (latin subset, as the apps
 * requested from Google before).
 *
 * They used to come from next/font/google, which downloads them from Google
 * during every build. Google sometimes answers with extensionless
 * `/l/font?kit=…&skey=…` URLs that Turbopack cannot parse ("next/font/google
 * queries have exactly one entry"), failing deploys at random. Files in the
 * repo make builds independent of that fetch; the browser gets the same
 * self-hosted, preloaded files either way.
 */

export const bricolageGrotesque = localFont({
  src: "./assets/fonts/BricolageGrotesque-latin-variable.woff2",
  weight: "200 800",
  variable: "--font-primary",
  display: "swap",
});

export const dmSans = localFont({
  src: "./assets/fonts/DMSans-latin-variable.woff2",
  // The file is variable; 300–500 is what the apps requested from Google, so
  // text renders exactly as before (heavier weights stay synthesised).
  weight: "300 500",
  variable: "--font-sans",
  display: "swap",
});

export const dmMono = localFont({
  src: [
    { path: "./assets/fonts/DMMono-latin-300.woff2", weight: "300" },
    { path: "./assets/fonts/DMMono-latin-400.woff2", weight: "400" },
    { path: "./assets/fonts/DMMono-latin-500.woff2", weight: "500" },
  ],
  variable: "--font-mono",
  display: "swap",
  // Used in a handful of places: fetched when a page shows it, not preloaded
  // (three files) on every first visit.
  preload: false,
});
