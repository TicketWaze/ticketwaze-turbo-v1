import Script from "next/script";

/**
 * Google Consent Mode v2 defaults. Runs before any GA tag so that, even if a
 * tag loads, storage stays denied until the visitor accepts. Also seeds the
 * `window.gtag` shim used by ConsentProvider to push consent updates.
 */
export default function ConsentModeScript() {
  return (
    // beforeInteractive in the root layout is the App Router-supported location
    // for this (the lint rule still references the legacy pages/_document).
    // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
    <Script id="ga-consent-default" strategy="beforeInteractive">
      {`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = window.gtag || gtag;
        gtag('consent', 'default', {
          ad_storage: 'denied',
          analytics_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          wait_for_update: 500
        });
      `}
    </Script>
  );
}
