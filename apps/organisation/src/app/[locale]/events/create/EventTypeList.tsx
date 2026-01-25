"use client";
import { useRouter } from "@/i18n/navigation";
import { SearchNormal } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useState } from "react";
import InPerson from "@/assets/images/in-person.jpg";
import GoogleMeet from "@/assets/images/meet.jpg";
import Private from "@/assets/images/private.jpeg";
import cinema from "@/assets/images/cinema.jpg";
import match from "@/assets/images/match.jpg";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import BackButton from "@/components/shared/BackButton";
import TopBar from "@/components/shared/TopBar";
import { ButtonPrimary } from "@/components/shared/buttons";

export default function EventTypeList() {
  const t = useTranslations("Events.create_event");
  const { data: session } = useSession();
  const [selected, setSelected] = useState("");
  const [query, setQuery] = useState("");
  const eventTypes = [
    {
      title: t("list.inPerson.title"),
      description: t("list.inPerson.description"),
      image: InPerson,
      value: "in-person",
    },
    {
      title: t("list.meet.title"),
      description: t("list.meet.description"),
      image: GoogleMeet,
      value: "meet",
    },
    {
      title: t("list.private.title"),
      description: t("list.private.description"),
      image: Private,
      value: "private",
    },
    // {
    //     title: 'Cinema',
    //     description: 'Watch the latest movies on the big screen.',
    //     image: cinema,
    //     value: 'cinema',
    // },
    // {
    //     title: 'Match',
    //     description: 'Live sports events and thrilling matches.',
    //     image: match,
    //     value: 'match',
    // },
  ];
  const router = useRouter();

  const filteredCategories = eventTypes.filter((category) => {
    const search = query.toLowerCase();
    return category.title.toLowerCase().includes(search);
  });

  async function Proceed() {
    if (selected === "meet") {
      const request = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/events/google/callback`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user.accessToken}`,
          },
        },
      );
      const response = await request.json();
      if (response.status === "success") {
        router.push(response.authorizationUrl);
      } else {
        toast.error(response.message);
      }
    } else {
      router.push(`/events/create/${selected}`);
    }
  }

  return (
    <div className="flex flex-col gap-8 overflow-y-scroll">
      <div className="flex flex-col gap-8">
        <BackButton text={t("back")}>
          <div
            className={
              " bg-neutral-100 rounded-[30px] flex lg:hidden items-center justify-between w-[200px] px-[1.5rem] py-4"
            }
          >
            <input
              placeholder={t("category_search")}
              className={
                "text-black font-normal text-[1.4rem] leading-[20px] w-full outline-none"
              }
              onChange={(e) => setQuery(e.target.value)}
            />
            {/* <SearchNormal size="20" color="#737c8a" variant="Bulk" /> */}
          </div>
        </BackButton>
        <TopBar title={t("title")}>
          <div
            className={
              "hidden bg-neutral-100 rounded-[30px] lg:flex items-center justify-between w-[243px] px-[1.5rem] py-4"
            }
          >
            <input
              placeholder={t("category_search")}
              className={
                "text-black font-normal text-[1.4rem] leading-[20px] w-full outline-none"
              }
              onChange={(e) => setQuery(e.target.value)}
            />
            <SearchNormal size="20" color="#737c8a" variant="Bulk" />
          </div>
          <ButtonPrimary
            className="hidden lg:block"
            onClick={Proceed}
            disabled={!selected}
          >
            {t("proceed")}
          </ButtonPrimary>
          <ButtonPrimary
            className="lg:hidden fixed bottom-40 right-8 z-50 "
            onClick={Proceed}
            disabled={!selected}
          >
            {t("proceed")}
          </ButtonPrimary>
          {/* <ButtonPrimary className='fixed bottom-36 left-0 w-[90vw] mx-auto z-50 lg:hidden' disabled={!selected}>{t('proceed')}</ButtonPrimary> */}
        </TopBar>
      </div>
      <ul className="list overflow-y-scroll py-2 px-2">
        {filteredCategories.map((category, index) => {
          return (
            <li key={index}>
              <label className="block relative cursor-pointer group">
                <input
                  type="radio"
                  name="eventType"
                  value={category.value}
                  checked={selected === category.value}
                  onChange={() => setSelected(category.value)}
                  className="sr-only"
                />
                <div
                  className={`h-[165px] lg:h-[280px] rounded-2xl overflow-hidden relative transition-all duration-300 ${
                    selected === category.value
                      ? "ring-4 ring-primary-500"
                      : "ring-0"
                  }`}
                >
                  <Image
                    src={category.image}
                    alt={category.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    width={255}
                    height={191}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/10" />
                  <div className="absolute bottom-8 left-4 right-4 text-white z-10 flex flex-col gap-2">
                    <h3 className="text-[2.6rem] font-primary leading-[30px] font-bold">
                      {category.title}
                    </h3>
                    <p className="text-[1.5rem] text-neutral-300">
                      {category.description}
                    </p>
                  </div>
                </div>
              </label>
            </li>
          );
        })}
      </ul>
      {filteredCategories.length === 0 && (
        <div
          className={
            " h-full w-full justify-center mx-auto flex flex-col items-center gap-[3rem]"
          }
        >
          <div
            className={
              "w-[120px] h-[120px] rounded-full flex items-center justify-center bg-neutral-100"
            }
          >
            <div
              className={
                "w-[90px] h-[90px] rounded-full flex items-center justify-center bg-neutral-200"
              }
            >
              <SearchNormal size="50" color="#0d0d0d" variant="Bulk" />
            </div>
          </div>
          <div className={"flex flex-col gap-[3rem] items-center text-center"}>
            <p
              className={
                "text-[1.8rem] leading-[25px] text-neutral-600 max-w-[330px] lg:max-w-[422px]"
              }
            >
              {t("no_result")} <span className="text-neutral-800">{query}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
