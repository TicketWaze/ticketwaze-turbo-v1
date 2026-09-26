export function slugify(title: string, id: string): string {
  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return `${slug}-${id}`; // keep UUID unchanged
}

export function extractIdFromSlug(slug: string): string {
  const match = slug.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );

  if (!match) {
    throw new Error("Invalid slug format");
  }

  return match[0];
}
