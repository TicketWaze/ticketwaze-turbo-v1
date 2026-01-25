import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import { SimpleTopbar } from "@/components/Layouts/Topbars";
import { Link } from "@/i18n/navigation";
import {
  ArrowRight2,
  CardPos,
  I24Support,
  Icon,
  Notification,
  Profile2User,
  SecuritySafe,
  User,
} from "iconsax-reactjs";
import { getLocale, getTranslations } from "next-intl/server";
import Signout from "./Signout";
import SwitchOrganisationMobile from "./SwitchOrganisationMobile";

export default async function Settings() {
  const t = await getTranslations("Settings");
  const locale = await getLocale();
  const links = [
    // {
    //   label: t("account.title"),
    //   href: "/settings/account",
    //   Icon: Setting5,
    // },
    {
      label: t("profile.title"),
      href: "/settings/profile",
      Icon: User,
    },
    {
      label: t("team.title"),
      href: "/settings/team",
      Icon: Profile2User,
    },
    {
      label: t("security.title"),
      href: "/settings/security",
      Icon: SecuritySafe,
    },
    {
      label: t("payment.title"),
      href: "/settings/payment",
      Icon: CardPos,
    },
    {
      label: t("notification.title"),
      href: "/settings/notification",
      Icon: Notification,
    },
  ];
  return (
    <OrganizerLayout title={t("title")}>
      <SimpleTopbar title={t("title")} />
      <ul className="list-3 w-full overflow-y-scroll pb-4 lg:pb-0">
        {links.map(({ Icon, label, href }) => {
          return (
            <li key={label} className={"cursor-pointer"}>
              <SettingsCardLink Icon={Icon} href={href} label={label} />
            </li>
          );
        })}
        <li className="lg:hidden">
          <Link
            target={"_blank"}
            rel={"noreferrer"}
            href={`${process.env.NEXT_PUBLIC_WEBSITE_URL}/${locale}/contact`}
            className={
              "py-14 px-6 rounded-[10px] bg-neutral-100 hover:bg-primary-50 flex justify-between transition-all duration-500 cursor-pointer group"
            }
          >
            <div className={"flex items-center gap-6"}>
              <I24Support
                size="25"
                className=" transition-all duration-500 stroke-neutral-900 fill-neutral-900 group-hover:stroke-primary-500 group-hover:fill-primary-500"
                variant="Bulk"
              />
              <span
                className={
                  "font-primary font-medium text-[2.2rem] transition-all duration-500 leading-12 text-neutral-900 group-hover:text-primary-500"
                }
              >
                {t("help")}
              </span>
            </div>
            <div
              className={
                "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 bg-neutral-200 group-hover:bg-primary-100"
              }
            >
              <ArrowRight2
                size="20"
                className=" transition-all duration-500 stroke-neutral-900 fill-neutral-900 group-hover:stroke-primary-500 group-hover:fill-primary-500"
                variant="Bulk"
              />
            </div>
          </Link>
        </li>
        <SwitchOrganisationMobile />
        {/* <li className="lg:hidden">
          <SettingsCardLink
            Icon={Add}
            href={"/auth/create-organisation"}
            label={t("new")}
          />
        </li> */}
        <Signout />
      </ul>
    </OrganizerLayout>
  );
}

function SettingsCardLink({
  href,
  Icon,
  label,
}: {
  href: string;
  Icon: Icon;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={
        "py-14 px-6 rounded-[10px] bg-neutral-100 hover:bg-primary-50 flex justify-between transition-all duration-500 cursor-pointer group"
      }
    >
      <div className={"flex items-center gap-6"}>
        <Icon
          size="25"
          className=" transition-all duration-500 stroke-neutral-900 fill-neutral-900 group-hover:stroke-primary-500 group-hover:fill-primary-500"
          variant="Bulk"
        />
        <span
          className={
            "font-primary font-medium text-[2.2rem] transition-all duration-500 leading-12 text-neutral-900 group-hover:text-primary-500"
          }
        >
          {label}
        </span>
      </div>
      <div
        className={
          "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 bg-neutral-200 group-hover:bg-primary-100"
        }
      >
        <ArrowRight2
          size="20"
          className=" transition-all duration-500 stroke-neutral-900 fill-neutral-900 group-hover:stroke-primary-500 group-hover:fill-primary-500"
          variant="Bulk"
        />
      </div>
    </Link>
  );
}
