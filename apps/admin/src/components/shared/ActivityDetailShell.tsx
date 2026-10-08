"use client";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Calendar2, Clock, Location, Call } from "iconsax-reactjs";
import BackButton from "@/components/shared/BackButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const ICONS = { calendar: Calendar2, clock: Clock, location: Location, phone: Call } as const;

export type DetailItem = { icon: keyof typeof ICONS; text: string; wide?: boolean };

/**
 * The Figma activity page (4325:86299) for the raffle, sale and restaurant
 * pages, so all four kinds read alike: Back, the title with its badges and
 * the header actions, any notices, then two columns — picture, About and More
 * details (organisation + dates/places) on the left, tabs on the right.
 */
export default function ActivityDetailShell({
  title,
  badges,
  actions,
  notices,
  imageUrl,
  aboutTitle,
  aboutHtml,
  organisation,
  details,
  tabs,
}: {
  title: string;
  badges?: React.ReactNode;
  actions: React.ReactNode;
  notices?: React.ReactNode;
  imageUrl: string | null;
  aboutTitle: string;
  aboutHtml: string;
  organisation: {
    organisationId: string;
    organisationName: string;
    profileImageUrl: string | null;
    followersCount?: number;
  } | null;
  details: DetailItem[];
  tabs: { value: string; label: string; content: React.ReactNode }[];
}) {
  const t = useTranslations("ActivitiesList.detail");
  const divider = <div className="h-[2px] w-full shrink-0 bg-neutral-100" />;

  return (
    <div className="flex flex-col gap-8 h-full overflow-hidden">
      <BackButton text={t("back")} />
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
        <div className="flex items-center gap-4 min-w-0 flex-wrap">
          <h2 className="font-primary font-medium text-[2.6rem] leading-[3rem] text-black capitalize min-w-0">
            {title}
          </h2>
          {badges}
        </div>
        {actions}
      </div>
      {notices}

      <main className="w-full gap-16 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden flex flex-col lg:grid lg:grid-cols-[15fr_21fr]">
        <div className="flex flex-col gap-8 lg:overflow-y-auto lg:min-h-0 pb-6">
          {imageUrl ? (
            <div className="relative w-full h-[29.8rem] shrink-0 rounded-[1rem] overflow-hidden bg-neutral-100">
              <Image src={imageUrl} alt={title} fill sizes="40rem" className="object-cover" />
            </div>
          ) : (
            <div className="w-full h-[29.8rem] shrink-0 rounded-[1rem] bg-neutral-100" />
          )}
          {divider}
          <div className="flex flex-col gap-[1rem]">
            <span className="font-semibold text-[1.6rem] leading-[2.25rem] text-deep-100">
              {aboutTitle}
            </span>
            <div
              className="rich-text text-[1.5rem] leading-[3rem] text-neutral-700"
              dangerouslySetInnerHTML={{ __html: aboutHtml }}
            />
          </div>
          {divider}
          <div className="flex flex-col gap-8">
            <span className="font-semibold text-[1.6rem] leading-[2.25rem] text-deep-100">
              {t("more")}
            </span>
            {organisation && (
              <div className="flex items-center justify-between gap-4 w-full">
                <Link
                  href={`/organisations/${organisation.organisationId}`}
                  className="flex items-center gap-4 min-w-0"
                >
                  {organisation.profileImageUrl ? (
                    <Image
                      src={organisation.profileImageUrl}
                      width={35}
                      height={35}
                      alt={organisation.organisationName}
                      className="rounded-full w-14 h-14 object-cover shrink-0"
                    />
                  ) : (
                    <span className="flex shrink-0 rounded-full w-14 h-14 bg-black border border-neutral-700 justify-center items-center text-white font-medium font-primary text-[2.2rem] uppercase">
                      {organisation.organisationName.charAt(0)}
                    </span>
                  )}
                  <span className="flex flex-col min-w-0">
                    <span className="text-[1.4rem] leading-8 text-deep-100 truncate">
                      {organisation.organisationName}
                    </span>
                    {organisation.followersCount !== undefined && (
                      <span className="text-[1.2rem] leading-[1.65rem] text-neutral-600">
                        {t("followers", { count: organisation.followersCount })}
                      </span>
                    )}
                  </span>
                </Link>
                <Link
                  href={`/organisations/${organisation.organisationId}`}
                  className="h-[3.5rem] px-[1.5rem] shrink-0 inline-flex items-center rounded-[10rem] bg-black border-2 border-[#070707] text-white text-[1.4rem] leading-8 hover:bg-neutral-900"
                >
                  {t("view_profile")}
                </Link>
              </div>
            )}
            {details.length > 0 && (
              <div className="grid grid-cols-2 gap-x-[2rem] gap-y-8">
                {details.map((item) => {
                  const Icon = ICONS[item.icon];
                  return (
                    <div
                      key={`${item.icon}-${item.text}`}
                      className={cn("flex items-center gap-2 min-w-0", item.wide && "col-span-2")}
                    >
                      <span className="w-14 h-14 shrink-0 flex items-center justify-center bg-neutral-100 rounded-full">
                        <Icon size="20" color="#737c8a" variant="Bulk" />
                      </span>
                      <span className="text-[1.4rem] leading-8 text-deep-100 min-w-0 break-words">
                        {item.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:overflow-y-auto lg:min-h-0 pb-6">
          <Tabs defaultValue={tabs[0]?.value} className="w-full">
            <TabsList className="w-full lg:w-fit mx-auto lg:mx-0 mb-8">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value}>
                {tab.content}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
    </div>
  );
}

/** Figma's performance row: 16px grey label, 16px medium value. */
export function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li className="flex justify-between items-start gap-8">
      <span className="text-[1.6rem] leading-[2.25rem] text-neutral-600 shrink-0">{label}</span>
      <span className="text-[1.6rem] leading-[2.2rem] font-medium text-deep-100 text-right min-w-0 break-words">
        {children}
      </span>
    </li>
  );
}

export function InfoList({ children }: { children: React.ReactNode }) {
  return <ul className="flex flex-col gap-8 pt-4">{children}</ul>;
}

/** A titled group of rows inside a tab (a second heading after a divider). */
export function InfoGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 pt-8 mt-8 border-t-2 border-neutral-100">
      <span className="font-semibold text-[1.6rem] leading-[2.25rem] text-deep-100">{title}</span>
      <InfoList>{children}</InfoList>
    </div>
  );
}
