export const siteUrl = "https://ticketwaze.com";

/**
 * Renders a JSON-LD script tag. The serialized JSON is escaped so `<` can
 * never terminate the script tag, even if translated copy contains markup.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

/**
 * Breadcrumb trail for inner pages. Pass `path: ""` for the home crumb and
 * omit `path` on the last (current) page, per Google's guidelines.
 */
export function buildBreadcrumbs(
  crumbs: { name: string; path?: string }[],
  localePath: string = "",
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      ...(crumb.path !== undefined && {
        item: `${siteUrl}${localePath}${crumb.path}`,
      }),
    })),
  };
}
