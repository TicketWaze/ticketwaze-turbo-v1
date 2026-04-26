// utils/generateDiscountCode.ts
export function generateDiscountCode(eventName: string): string {
  // Take first 3 letters of event name
  const cleanName = eventName
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 3);

  // Random 5 chars
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();

  // Combine and trim to max 10 chars
  return (cleanName + randomPart).slice(0, 10);
}
