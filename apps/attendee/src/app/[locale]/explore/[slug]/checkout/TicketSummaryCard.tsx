"use client";
import Image from "next/image";
import { Warning2 } from "iconsax-reactjs";
import { useTranslations } from "next-intl";
import { Event, EventTicketType } from "@ticketwaze/typescript-config";
import Capitalize from "@/lib/Capitalize";
import ticketBG from "./ticket-bg.svg";
import { FeeBreakdown, PaymentType, SelectedTicket } from "./checkout.types";
import { getPlatformFeePerTicket } from "./checkoutUtils";
import Logo from "./Logo.svg";

interface Props {
  selectedWithIndex: SelectedTicket[];
  ticketTypes: EventTicketType[];
  event: Event;
  isFree: boolean;
  feeBreakdown: FeeBreakdown;
  paymentType: PaymentType;
}

export default function TicketSummaryCard({
  selectedWithIndex,
  ticketTypes,
  event,
  isFree,
  feeBreakdown,
  paymentType,
}: Props) {
  // const t = useTranslations("Checkout");

  return (
    <div className="lg:flex items-center justify-center h-full hidden ">
      <Image src={Logo} width={300} alt="Ticketwaze" />
    </div>
    // <div className="flex flex-col gap-8 h-[500px] bg-[rgba(0,0,0,0.05)] w-full lg:h-[681px] relative shadow-[0_15px_25px_0_rgba(0,0,0,0.05)]">
    //   <Image src={ticketBG} alt="ticket bg" className="h-full" />
    //   <div className="absolute top-0 w-full px-4 left-[50%] -translate-x-[50%] flex flex-col items-center gap-8">
    //     <span className="font-primary font-medium pt-4 text-[2.2rem] leading-[30px] text-black">
    //       {t("ticket.summary")}
    //     </span>
    //     <div className="w-full h-[250px] lg:h-[296px] bg-neutral-100 p-[15px] text-center flex flex-col justify-between items-center">
    //       <div className="flex flex-col gap-8 w-full">
    //         <span className="font-mono text-[14px] leading-[22px] text-deep-100 text-center">
    //           {t("ticket.select")}
    //         </span>
    //         <div className="flex flex-col gap-4">
    //           {selectedWithIndex.length > 0 ? (
    //             selectedWithIndex.map((ticket) => {
    //               const ticketType = ticketTypes.find(
    //                 (tt) => tt.eventTicketTypeId === ticket.ticketTypeId,
    //               );
    //               const unitPrice = ticketType
    //                 ? Number(
    //                     event.currency === "USD"
    //                       ? ticketType.usdPrice
    //                       : ticketType.ticketTypePrice,
    //                   )
    //                 : 0;
    //               return (
    //                 <div
    //                   key={ticket.ticketTypeId}
    //                   className="w-full flex justify-between"
    //                 >
    //                   <span className="font-mono text-[1.4rem] leading-[22px] text-neutral-600">
    //                     x{ticket.quantity}{" "}
    //                     {ticketType
    //                       ? Capitalize(ticketType.ticketTypeName)
    //                       : "Unknown"}
    //                   </span>
    //                   {isFree ? (
    //                     <span className="font-medium text-[1.4rem] leading-[22px] text-deep-100">
    //                       {t("free")}
    //                     </span>
    //                   ) : (
    //                     <span className="font-medium text-[1.4rem] leading-[22px] text-deep-100">
    //                       {(unitPrice * ticket.quantity).toFixed(2)}{" "}
    //                       {event.currency}
    //                     </span>
    //                   )}
    //                 </div>
    //               );
    //             })
    //           ) : (
    //             <div className="w-full flex justify-center">
    //               <span className="font-mono text-[1.4rem] leading-[22px] text-neutral-400">
    //                 No tickets selected
    //               </span>
    //             </div>
    //           )}
    //           {!isFree && selectedWithIndex.length > 0 && (
    //             <div className="w-full flex justify-between">
    //               <span className="font-mono text-[1.4rem] leading-[22px] text-neutral-600">
    //                 {t("ticket.platform")}
    //               </span>
    //               <span className="font-medium text-[1.4rem] leading-[22px] text-deep-100">
    //                 {platformFeeLabel}
    //               </span>
    //             </div>
    //           )}
    //         </div>
    //       </div>
    //     </div>
    //     {!ticketTypes[0].isRefundable && (
    //       <span className="text-warning flex gap-4 items-center text-[1.3rem]">
    //         <Warning2 size="16" color="#ea961c" variant="TwoTone" />
    //         {t("ticket.ticketWarning")}
    //       </span>
    //     )}
    //   </div>
    //   <div className="absolute bottom-[7%] h-[83px] left-[50%] -translate-x-[50%] flex flex-col gap-8 items-center">
    //     {selectedWithIndex.length > 0 && (
    //       <>
    //         <div className="flex gap-4 justify-center flex-wrap">
    //           {selectedWithIndex.map((ticket) => {
    //             const ticketType = ticketTypes.find(
    //               (tt) => tt.eventTicketTypeId === ticket.ticketTypeId,
    //             );
    //             return (
    //               <span
    //                 key={ticket.ticketTypeId}
    //                 className="text-primary-500 text-[1.4rem] leading-8 px-[15px] py-[5px] bg-primary-50 rounded-[20px]"
    //               >
    //                 {ticketType ? Capitalize(ticketType.ticketTypeName) : "Unknown"}
    //               </span>
    //             );
    //           })}
    //         </div>
    //         {isFree ? (
    //           <span className="font-primary font-medium text-[28px] leading-[32px] text-[#000]">
    //             {t("free")}
    //           </span>
    //         ) : (
    //           <span className="font-primary font-medium text-[28px] leading-[32px] text-[#000]">
    //             {feeBreakdown.total.toFixed(2)} {event.currency}
    //           </span>
    //         )}
    //       </>
    //     )}
    //   </div>
    // </div>
  );
}
