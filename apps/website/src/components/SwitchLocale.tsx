import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/LanguageSelect";
import Image from "next/image";
import US from "@/assets/flags/us.svg";
import FR from "@/assets/flags/fr.svg";
import { ArrowDown2 } from "iconsax-reactjs";

export default function SwitchLocale() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };
  return (
    <Select onValueChange={(e) => switchLocale(e)}>
      <SelectTrigger>
        {locale === "en" ? (
          <Image src={US} alt={"us flag"} width={30} height={30} />
        ) : (
          <Image src={FR} alt={"french flag"} width={30} height={30} />
        )}
        <span
          className={
            "text-[1.4rem] leading-[20px] font-medium uppercase text-deep-100"
          }
        >
          {locale}
        </span>
        <ArrowDown2 size="20" color="#000000" variant="Bulk" />
      </SelectTrigger>
      <SelectContent className={"bg-neutral-100"}>
        <SelectItem
          className={`${locale === "fr" ? "bg-neutral-300 hover:bg-neutral-300" : ""} flex items-center gap-4`}
          value="fr"
        >
          <Image src={FR} alt={"french flag"} width={30} height={30} />
          <span>Français</span>
        </SelectItem>
        <SelectItem
          className={`${locale === "en" ? "bg-neutral-300 hover:bg-neutral-300" : ""} flex items-center gap-4`}
          value="en"
        >
          <Image src={US} alt={"us flag"} width={30} height={30} />
          <span>English</span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
