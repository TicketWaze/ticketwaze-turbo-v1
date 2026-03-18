export default function maskEmail(
  email: string,
  visibleChars: number = 4
): string {
  const [localPart, domain] = email.split("@");

  if (!localPart || !domain) {
    return email;
  }
  const maskedLocalPart = localPart.slice(0, visibleChars) + "****";

  return `${maskedLocalPart}@${domain}`;
}
