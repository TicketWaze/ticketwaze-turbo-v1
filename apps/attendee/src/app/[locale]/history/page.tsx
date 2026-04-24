import HistoryCard from "@/components/HistoryCard";
import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import Rema from "@ticketwaze/ui/assets/images/rema.png";
import { Clock } from "iconsax-reactjs";
import { getLocale, getTranslations } from "next-intl/server";

export default async function HistoryPage() {
  const locale = await getLocale();
  const session = await auth();
  if (!session) {
    redirect({ href: "/auth/login", locale });
  }
  const t = await getTranslations("History");
  const history = true;

  return (
    <AttendeeLayout title="HistoryPage" className="overflow-x-hidden">
      <>
        <header className="w-full flex items-center justify-between">
          {/* {!mobileSearch && ( */}
          <div className="flex flex-col gap-2">
            {session?.user && (
              <span className="text-[1.6rem] leading-8 text-neutral-600">
                {t("subtitle")}{" "}
                <span className="text-deep-100">{session?.user.firstName}</span>
              </span>
            )}
            <span className="font-primary font-medium text-[1.8rem] lg:text-[2.6rem] leading-10 lg:leading-12 text-black">
              {t("title")}
            </span>
          </div>
          {/* )} */}
          {/* <div
            className={`flex items-center gap-4 ${mobileSearch && "w-full"}`}
          >
            {mobileSearch && (
              <div
                className={
                  "bg-neutral-100 w-full rounded-[30px] flex items-center justify-between lg:hidden px-[1.5rem] py-4"
                }
              >
                <input
                  placeholder={t("search")}
                  className={
                    "text-black font-normal text-[1.4rem] leading-8 w-full outline-none"
                  }
                  autoFocus
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button
                  onClick={() => {
                    setMobileSearch(!mobileSearch);
                    setQuery("");
                  }}
                >
                  <CloseCircle size="20" color="#737c8a" variant="Bulk" />
                </button>
              </div>
            )}
            <div
              className={
                "hidden bg-neutral-100 rounded-[30px] lg:flex items-center justify-between w-[243px] px-[1.5rem] py-4"
              }
            >
              <input
                placeholder={t("search")}
                className={
                  "text-black font-normal text-[1.4rem] leading-8 w-full outline-none"
                }
                onChange={(e) => setQuery(e.target.value)}
              />
              <SearchNormal size="20" color="#737c8a" variant="Bulk" />
            </div>
            {!mobileSearch && (
              <button
                onClick={() => setMobileSearch(!mobileSearch)}
                className={
                  "w-[35px] h-[35px] bg-neutral-100 rounded-full flex lg:hidden items-center justify-center"
                }
              >
                <SearchNormal size="20" color="#737c8a" variant="Bulk" />
              </button>
            )}
          </div> */}
        </header>

        {/* main */}
        {history ? (
          <ul className="list pt-4 w-full overflow-y-auto lg:-mx-4 px-4 pb-8 flex flex-col gap-4">
            {Array.from({ length: 5 }).map((_, index) => {
              const randomStars = Math.floor(Math.random() * 5) + 1;

              return (
                <li key={index}>
                  <HistoryCard
                    href={`history/${index + 1}`}
                    image={Rema}
                    name={t("activity.card.name")}
                    day={1}
                    rated={randomStars}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          // no history
          <div
            className={
              "w-132 lg:w-184 mx-auto flex flex-col h-full justify-center items-center gap-20"
            }
          >
            <div
              className={
                "w-48 h-48 rounded-full flex items-center justify-center bg-neutral-100"
              }
            >
              <div
                className={
                  "w-36 h-36 rounded-full flex items-center justify-center bg-neutral-200"
                }
              >
                <Clock size="50" color="#0d0d0d" variant="Bulk" />
              </div>
            </div>
            <div className={"flex flex-col gap-12 items-center text-center"}>
              <p
                className={
                  "text-[1.8rem] leading-10 text-neutral-600 max-w-132 lg:max-w-[42.2rem]"
                }
              >
                {t("description")}
              </p>
            </div>
          </div>
        )}
      </>
    </AttendeeLayout>
  );
}
