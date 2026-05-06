'use client'
import BackButton from "@/components/shared/BackButton";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ButtonBlack,
    ButtonPrimary,
    ButtonRed,
} from "@/components/shared/buttons";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar2, Location, Clock } from "iconsax-reactjs";
// import Information from "./Informations";
import Separator from "@/components/shared/Separator";
import { useTranslations } from "next-intl";
import Rema from "@ticketwaze/ui/assets/images/rema.png";
import Image from "next/image";
import Link from "next/link";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import { WithdrawalRequest } from "@ticketwaze/typescript-config";
import VerifiedOrganisationCheckMark from "@/components/VerifiedOrganisationCheckMark";

export default function PayoutRequestPageWrapper({ request }: { request: WithdrawalRequest }) {
    const t = useTranslations('Payouts');
    return (
        <div className="flex flex-col gap-8 h-full overflow-hidden">
            <BackButton text={t("back")}></BackButton>
            <div className="mb-6 flex justify-between items-center">
                <h2 className="items-center font-primary leading-12 font-medium text-[2.6rem]">
                    {request.organisation.organisationName} {request.organisation.isVerified && <VerifiedOrganisationCheckMark />}
                </h2>
                <div className="flex gap-4 items-center h-fit">
                    <ButtonRed className="py-[7.5px]">
                        {t("cancel")}
                    </ButtonRed>
                    <ButtonPrimary className="py-[7.5px]">
                        {t("paid")}
                    </ButtonPrimary>
                </div>
            </div>
            <main className="w-full gap-16 flex flex-col lg:grid lg:grid-cols-[15fr_21fr] lg:min-h-0">
                <div className="flex flex-col gap-8 overflow-y-auto min-h-0 max-h-[calc(100vh-200px)]">
                    <div className="w-fit max-h-[29.8rem] overflow-hidden rounded-[10px] shrink-0">
                        {request.organisation.profileImageUrl ? <Image
                            src={request.organisation.profileImageUrl}
                            width={400}
                            height={298}
                            alt="img"
                            className="w-full"
                        /> : <div className="h-[150px] w-full flex items-center justify-center bg-black text-white text-9xl font-primary">
                            {request.organisation.organisationName.slice()[0]?.toUpperCase()}
                        </div>}

                    </div>
                    <Separator />
                    <div className="flex flex-col gap-4">
                        <span className="font-semibold text-[1.6rem] leading-8 text-deep-100">
                            {request.organisation.organisationName} 
                        </span>
                        <p className="text-[1.5rem] leading-12 text-neutral-700">
                            {request.organisation.organisationDescription}
                        </p>
                    </div>
                    <div></div>
                </div>

                <div className="min-h-[75vh]">
                    <Tabs defaultValue="performance" className="w-full h-full">
                        <TabsList className={"w-full lg:w-fit mx-auto lg:mx-0 mb-8"}>
                            <TabsTrigger value="performance">
                                {t("activity.title")}
                            </TabsTrigger>
                            <TabsTrigger value="stats">
                                {t("stats.title")}
                            </TabsTrigger>
                        </TabsList>
                        <TabsContent value="performance" className="">
                            
                        </TabsContent>
                        {/* <ActivityAttendances /> */}
                    </Tabs>
                </div>
            </main>
        </div>
    )
}
