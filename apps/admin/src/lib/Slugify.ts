export default function Slugify(text: string): string {
  return text
    .trim()
    .replace(/[^A-Za-z0-9\s-]/g, '') // remove special characters but keep capitals
    .replace(/\s+/g, '-')            // replace spaces with dashes
    .replace(/-+/g, '-'); 
}