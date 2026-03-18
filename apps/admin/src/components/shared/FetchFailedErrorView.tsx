import { Link } from "@/i18n/navigation";
import { Warning2 } from "iconsax-reactjs";
import { getLocale, getTranslations } from "next-intl/server";

export default async function FetchFailedErrorView() {
  const locale = await getLocale();
  const t = await getTranslations("Layout");
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-8">
      <Warning2 size="60" color="#de0028" variant="Bulk" />
      <p className="text-[1.4rem] text-failure text-center leading-8">
        {t("fetchFailedError")}{" "}
        <Link
          className="font-bold underline inline-flex items-center gap-1"
          href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/${locale}/contact`}
        >
          support
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
        </Link>
      </p>
    </div>
  );
}
