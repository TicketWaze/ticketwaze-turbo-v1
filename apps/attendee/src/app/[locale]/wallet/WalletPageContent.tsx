"use client";
import { Money3, SearchNormal, Gift, Copy } from "iconsax-reactjs";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import FormatDate from "@/lib/FormatDate";
import TruncateUrl from "@/lib/TruncateUrl";
import WalletOrderDrawerContent from "./WalletOrderDrawerContent";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import Whatsapp from "@/assets/icons/whatsApp.svg";
import Twitter from "@/assets/icons/twitter.svg";
import Linkedin from "@/assets/icons/linkedIn.svg";
import { Order, UserWallet } from "@ticketwaze/typescript-config";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";

export default function WalletPageContent({
  orders,
  wallet,
}: {
  orders: Order[];
  wallet: UserWallet;
}) {
  const t = useTranslations("Wallet");
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const filteredOrders = orders.filter((order) => {
    const search = query.toLowerCase();
    return order.orderName.toLowerCase().includes(search);
  });
  const referralLink = `${process.env.NEXT_PUBLIC_ATTENDEE_URL}/auth/register?referral=${session?.user.referralCode}`;
  return (
    <div className="flex flex-col gap-10 overflow-y-hidden">
      <header className="w-full flex items-center justify-between">
        <div className="flex flex-col gap-[5px]">
          {session?.user && (
            <span className="text-[1.6rem] leading-8 text-neutral-600">
              {t("subtitle")}{" "}
              <span className="text-deep-100">{session?.user.firstName}</span>
            </span>
          )}
          <span className="font-primary font-medium text-[1.8rem] lg:text-[2.6rem] leading-[2.5rem] lg:leading-12 text-black">
            {t("title")}
          </span>
        </div>
      </header>
      <div
        className={
          "grid grid-cols-2 lg:grid-cols-4 divide-x divide-neutral-100 border-neutral-100 border-b"
        }
      >
        <div className={"pb-[30px]"}>
          <span
            className={"text-[14px] text-neutral-600 leading-[20px] pb-[5px]"}
          >
            {t("amounts.available")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-[30px] font-primary"
            }
          >
            {session?.user.userPreference.currency === "USD"
              ? wallet.usdAvailableBalance
              : wallet.htgAvailableBalance}{" "}
            <span
              className={
                "font-normal text-[1.6rem] lg:text-[20px] text-neutral-500"
              }
            >
              {session?.user.userPreference.currency}
            </span>
          </p>
        </div>
        <div className={"pb-[30px] pl-[30px]"}>
          <span
            className={"text-[14px] text-neutral-600 leading-[20px] pb-[5px]"}
          >
            {t("amounts.pending")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-[30px] font-primary"
            }
          >
            {session?.user.userPreference.currency === "USD"
              ? wallet.usdPendingBalance
              : wallet.htgPendingBalance}{" "}
            <span
              className={
                "font-normal text-[1.6rem] lg:text-[20px] text-neutral-500"
              }
            >
              {session?.user.userPreference.currency}
            </span>
          </p>
        </div>
        <div className={"pb-[30px] lg:pl-[30px]"}>
          <span
            className={"text-[14px] text-neutral-600 leading-[20px] pb-[5px]"}
          >
            {t("ticketwazeToken")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-[30px] font-primary"
            }
          >
            {wallet.ticketwazeToken}{" "}
            <span
              className={
                "font-normal text-[1.6rem] lg:text-[20px] text-neutral-500"
              }
            >
              {t("token")}
            </span>
          </p>
        </div>
        <div className={"pb-[30px] pl-[30px] flex gap-6 items-start"}>
          <div className="">
            <span
              className={"text-[14px] text-neutral-600 leading-[20px] pb-[5px]"}
            >
              {t("invitedUser")}
            </span>

            <p
              className={
                "font-medium text-[1.6rem] lg:text-[25px] leading-[30px] font-primary"
              }
            >
              {wallet.userInvited}{" "}
              <span
                className={
                  "font-normal text-[1.6rem] lg:text-[20px] text-neutral-500"
                }
              >
                {t("user")}
              </span>
            </p>
          </div>

          <Dialog>
            <DialogTrigger>
              <Gift
                size="24"
                color="#E45B00"
                variant="Bulk"
                className="cursor-pointer"
              />
            </DialogTrigger>
            <DialogContent className={"w-[360px] lg:w-[520px] "}>
              <DialogHeader>
                <DialogTitle
                  className={
                    "font-medium border-b border-neutral-100 pb-[2rem]  text-[2.6rem] leading-[30px] text-black font-primary"
                  }
                >
                  {t("referralTitle")}
                </DialogTitle>
                <DialogDescription className={"sr-only"}>
                  <span>Share event</span>
                </DialogDescription>
              </DialogHeader>
              <div
                className={
                  "flex flex-col w-auto justify-center items-center gap-[30px]"
                }
              >
                <p
                  className={
                    "font-sans text-[1.8rem] leading-[25px] text-[#cdcdcd] text-center w-[320px] lg:w-full"
                  }
                >
                  {t("referralDescription")}
                </p>
                <div
                  className={
                    "border w-auto border-neutral-100 rounded-[100px] p-4 flex  items-center gap-4"
                  }
                >
                  <span
                    className={
                      "lg:hidden text-neutral-700 text-[1.8rem] max-w-[335px]"
                    }
                  >
                    {TruncateUrl(referralLink, 22)}
                  </span>
                  <span
                    className={
                      "hidden lg:block text-neutral-700 text-[1.8rem] max-w-[335px]"
                    }
                  >
                    {TruncateUrl(referralLink)}
                  </span>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(referralLink);
                        toast.success("Url copied to clipboard");
                      } catch {
                        toast.error("Failed to copy url");
                      }
                    }}
                    className={
                      "border-2 border-primary-500 px-[15px] py-[7px] rounded-[10rem] font-normal text-[1.5rem] text-primary-500 leading-[20px] bg-primary-50 cursor-pointer flex"
                    }
                  >
                    <Copy size="20" color="#e45b00" variant="Bulk" />
                    {t("copy")}
                  </button>
                </div>
                <div className="flex w-full justify-center items-center gap-12">
                  <Link
                    href={`https://wa.me/?text=${encodeURIComponent(`*Check this out — it’s worth your time!* \n\nI've been using TicketWaze for tickets to concerts, shows, sports and more. Join me with my referral code and let's experience great moments together!\nTap the link to explore - Reserve your spot now! \n\n${referralLink}`)}`}
                    target="_blank"
                    className="flex items-center justify-center w-[45px] h-[45px] bg-neutral-100 rounded-full"
                  >
                    <Image src={Whatsapp} alt="whatsapp Icon" />
                  </Link>
                  {/* <div className="flex items-center justify-center w-[45px] h-[45px] bg-neutral-100 rounded-full">
                      <Image src={Instagram} alt="instagram Icon" />
                    </div> */}
                  <Link
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                      `Check this out — it’s worth your time! 🚀\nI've been using TicketWaze for tickets to concerts, shows, sports and more. Join me with my referral code and let's experience great moments together!\nReserve your spot now: ${referralLink}`,
                    )}`}
                    target="_blank"
                    className="flex items-center justify-center w-[45px] h-[45px] bg-neutral-100 rounded-full"
                  >
                    <Image src={Twitter} alt="Twitter Icon" />
                  </Link>
                  {/* <div className="flex items-center justify-center w-[45px] h-[45px] bg-neutral-100 rounded-full">
                      <Image src={Tiktok} alt="tiktok Icon" />
                    </div> */}
                  <Link
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`}
                    target="_blank"
                    className="flex items-center justify-center w-[45px] h-[45px] bg-neutral-100 rounded-full"
                  >
                    <Image src={Linkedin} alt="LinkedIn Icon" />
                  </Link>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="flex flex-col gap-10 overflow-y-scroll h-full">
        <div className={"flex flex-col gap-8"}>
          <div
            className={
              "flex flex-col gap-8 lg:gap-0 lg:flex-row w-full items-center justify-between"
            }
          >
            <span
              className={
                "font-primary  w-full font-medium text-[18px] leading-[25px] text-black"
              }
            >
              {t("transactions.title")}
            </span>
            <div
              className={
                "bg-neutral-100 rounded-[30px] flex items-center gap-2 w-full lg:w-auto lg:min-w-[243px] px-[1.5rem] py-4"
              }
            >
              <input
                placeholder={t("search")}
                onChange={(e) => setQuery(e.target.value)}
                className={
                  "text-black font-normal text-[1.4rem] leading-[20px] w-full outline-none"
                }
              />
              <SearchNormal size="20" color="#737c8a" variant="Bulk" />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className={
                    "font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                  }
                >
                  {t("transactions.table.id")}
                </TableHead>
                <TableHead
                  className={
                    "font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                  }
                >
                  {t("transactions.table.provider")}
                </TableHead>
                <TableHead
                  className={
                    "font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                  }
                >
                  {t("transactions.table.class")}
                </TableHead>
                <TableHead
                  className={
                    "font-bold text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                  }
                >
                  {t("transactions.table.amount")}
                </TableHead>
                <TableHead
                  className={
                    "font-bold text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                  }
                >
                  {t("transactions.table.status")}
                </TableHead>
                <TableHead
                  className={
                    "font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                  }
                >
                  {t("transactions.table.date")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                return (
                  <TableRow key={order.orderId}>
                    <TableCell
                      className={
                        "text-[1.5rem] hidden lg:table-cell py-[15px] leading-8 text-neutral-900"
                      }
                    >
                      <Drawer direction={"right"}>
                        <DrawerTrigger>
                          <span className={"cursor-pointer"}>
                            {TruncateUrl(order.orderName, 12)}
                          </span>
                        </DrawerTrigger>
                        <WalletOrderDrawerContent order={order} />
                      </Drawer>
                    </TableCell>
                    <TableCell
                      className={
                        "text-[1.5rem] py-[15px] hidden lg:table-cell leading-8 text-neutral-900"
                      }
                    >
                      <Drawer direction={"right"}>
                        <DrawerTrigger>
                          <span className={"cursor-pointer"}>
                            {order.provider.toUpperCase()}
                          </span>
                        </DrawerTrigger>
                        <WalletOrderDrawerContent order={order} />
                      </Drawer>
                    </TableCell>
                    <TableCell
                      className={
                        "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
                      }
                    >
                      {order.tickets.length}
                    </TableCell>
                    <TableCell
                      className={
                        "text-[1.5rem] font-medium leading-8 text-neutral-900"
                      }
                    >
                      <Drawer direction={"right"}>
                        <DrawerTrigger>
                          <span className={"cursor-pointer py-[15px]"}>
                            {session?.user.userPreference.currency === "USD"
                              ? `${order.usdPrice} USD`
                              : `${order.amount} HTG`}
                          </span>
                        </DrawerTrigger>
                        <WalletOrderDrawerContent order={order} />
                      </Drawer>
                    </TableCell>
                    <TableCell className="py-[15px]">
                      <Drawer direction={"right"}>
                        <DrawerTrigger>
                          {order?.status === "SUCCESSFUL" && (
                            <span
                              className={
                                "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#349C2E]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                              }
                            >
                              {t("filters.successful")}
                            </span>
                          )}
                          {order?.status === "PENDING" && (
                            <span
                              className={
                                "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#EA961C]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                              }
                            >
                              {t("filters.pending")}
                            </span>
                          )}
                        </DrawerTrigger>
                        <WalletOrderDrawerContent order={order} />
                      </Drawer>
                    </TableCell>
                    <TableCell
                      className={
                        "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                      }
                    >
                      {FormatDate(order.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {orders.length === 0 && (
            <div
              className={
                "w-[330px] lg:w-[460px] mx-auto flex flex-col items-center gap-[5rem]"
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
                  <Money3 size="50" color="#0d0d0d" variant="Bulk" />
                </div>
              </div>
              <div
                className={"flex flex-col gap-[3rem] items-center text-center"}
              >
                <p
                  className={
                    "text-[1.8rem] leading-[25px] text-neutral-600 max-w-[330px] lg:max-w-[422px]"
                  }
                >
                  {t("transactions.description")}
                </p>
              </div>
            </div>
          )}
          {/* {tickets.length > 0 && (
          <div className={"w-full flex justify-end"}>
            <Link
              href={"/finance/transactions"}
              className={
                "text-primary-500 justify-end flex gap-4 items-center text-[1.5rem] leading-[20px]"
              }
            >
              {t("transactions.more")}
              <ArrowRight2 size="20" color="#E45B00" variant="Bulk" />
            </Link>
          </div>
        )} */}
          <div></div>
        </div>
        <div className={"flex flex-col gap-8"}>
          <div
            className={
              "flex flex-col gap-8 lg:gap-0 lg:flex-row w-full items-center justify-between"
            }
          >
            <span
              className={
                "font-primary  w-full font-medium text-[18px] leading-[25px] text-black"
              }
            >
              {t("withdrawal.title")}
            </span>
            <div
              className={
                "bg-neutral-100 rounded-[30px] flex items-center gap-2 w-full lg:w-auto lg:min-w-[243px] px-[1.5rem] py-4"
              }
            >
              <input
                placeholder={t("search")}
                className={
                  "text-black font-normal text-[1.4rem] leading-[20px] w-full outline-none"
                }
              />
              <SearchNormal size="20" color="#737c8a" variant="Bulk" />
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className={
                    "font-bold text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                  }
                >
                  {t("withdrawal.table.id")}
                </TableHead>
                <TableHead
                  className={
                    "font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                  }
                >
                  {t("withdrawal.table.provider")}
                </TableHead>
                <TableHead
                  className={
                    "font-bold text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                  }
                >
                  {t("withdrawal.table.amount")}
                </TableHead>
                <TableHead
                  className={
                    "font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                  }
                >
                  {t("withdrawal.table.status")}
                </TableHead>
                <TableHead
                  className={
                    "font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                  }
                >
                  {t("withdrawal.table.date")}
                </TableHead>
              </TableRow>
            </TableHeader>
            {/* <TableBody>
            {orders.map((order, index) => {
              return (
                <TableRow key={order.orderId}>
                  <TableCell
                    className={
                      "text-[1.5rem] py-[15px] leading-8 text-neutral-900"
                    }
                  >
                    <Drawer direction={"right"}>
                      <DrawerTrigger>
                        <span className={"cursor-pointer"}>
                          {TruncateUrl(order.orderName, 12)}
                        </span>
                      </DrawerTrigger>
                      <WalletOrderDrawerContent order={order} />
                    </Drawer>
                  </TableCell>
                  <TableCell
                    className={
                      "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                    }
                  >
                    <Drawer direction={"right"}>
                      <DrawerTrigger>
                        <span className={"cursor-pointer"}>
                          {order.provider.toUpperCase()}
                        </span>
                      </DrawerTrigger>
                      <WalletOrderDrawerContent order={order} />
                    </Drawer>
                  </TableCell>
                  <TableCell
                    className={
                      "text-[1.5rem] font-medium leading-8 text-neutral-900"
                    }
                  >
                    <Drawer direction={"right"}>
                      <DrawerTrigger>
                        <span className={"cursor-pointer"}>
                          {session?.user.userPreference.currency === "USD"
                            ? `${order.usdPrice} USD`
                            : `${order.amount} HTG`}
                        </span>
                      </DrawerTrigger>
                      <WalletOrderDrawerContent order={order} />
                    </Drawer>
                  </TableCell>
                  <TableCell className={"hidden lg:table-cell"}>
                    {order?.status === "SUCCESSFUL" && (
                      <span
                        className={
                          "py-[3px] text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#349C2E]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                        }
                      >
                        {t("filters.successful")}
                      </span>
                    )}
                    {order?.status === "PENDING" && (
                      <span
                        className={
                          "py-[3px] text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#EA961C]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                        }
                      >
                        {t("filters.pending")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell
                    className={
                      "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                    }
                  >
                    {FormatDate(order.createdAt)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody> */}
          </Table>
          {true && (
            <div
              className={
                "w-[330px] lg:w-[460px] mx-auto flex flex-col items-center gap-[5rem]"
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
                  <Money3 size="50" color="#0d0d0d" variant="Bulk" />
                </div>
              </div>
              <div
                className={"flex flex-col gap-[3rem] items-center text-center"}
              >
                <p
                  className={
                    "text-[1.8rem] leading-[25px] text-neutral-600 max-w-[330px] lg:max-w-[422px]"
                  }
                >
                  {t("withdrawal.description")}
                </p>
              </div>
            </div>
          )}
          {/* {tickets.length > 0 && (
          <div className={"w-full flex justify-end"}>
            <Link
              href={"/finance/transactions"}
              className={
                "text-primary-500 justify-end flex gap-4 items-center text-[1.5rem] leading-[20px]"
              }
            >
              {t("transactions.more")}
              <ArrowRight2 size="20" color="#E45B00" variant="Bulk" />
            </Link>
          </div>
        )} */}
          <div></div>
        </div>
      </div>
    </div>
  );
}
