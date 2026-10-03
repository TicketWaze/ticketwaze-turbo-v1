import { useTranslations } from "next-intl";

/** App-only legal line kept on the auth screens (not in Figma). */
export default function TermsNote() {
  const t = useTranslations("Auth.login.terms");
  return (
    <p className="text-[1.3rem] leading-6 text-neutral-500 text-center">
      {t("before")}
      <a
        href="https://ticketwaze.com/legals"
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary-500 hover:underline"
      >
        {t("terms")}
      </a>
      {t("and")}
      <a
        href="https://ticketwaze.com/legals"
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary-500 hover:underline"
      >
        {t("privacy")}
      </a>
    </p>
  );
}
