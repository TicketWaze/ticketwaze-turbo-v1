"use client";
import {
  CreateDiscountCode,
  MarkDiscountCodeAsActive,
  MarkDiscountCodeAsInactive,
} from "@/actions/EventActions";
import { usePathname } from "@/i18n/navigation";
import { generateDiscountCode } from "@/lib/GenerateDiscountCode";
import { zodResolver } from "@hookform/resolvers/zod";
import { Event } from "@ticketwaze/typescript-config";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CloseCircle,
  Money3,
  MoreCircle,
  RefreshCircle,
  TickCircle,
  TicketDiscount,
} from "iconsax-reactjs";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import TopBar from "@/components/shared/TopBar";
import { ButtonPrimary } from "@/components/shared/buttons";
import Capitalize from "@/lib/Capitalize";
import { Input } from "@/components/shared/Inputs";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";

export default function DiscountPageContent({ event }: { event: Event }) {
  const t = useTranslations("Events.single_event.discount");
  const locale = useLocale();
  const pathname = usePathname();
  const { data: session } = useSession();

  async function MarkAsInactive(discountCodeId: string) {
    const result = await MarkDiscountCodeAsInactive(
      event.eventId,
      discountCodeId,
      session?.user.accessToken ?? "",
      pathname,
      locale,
    );
    if (result.status === "success") {
      toast.success("success");
    }
    if (result.error) {
      toast.error(result.error);
    }
  }

  async function MarkAsActive(discountCodeId: string) {
    const result = await MarkDiscountCodeAsActive(
      event.eventId,
      discountCodeId,
      session?.user.accessToken ?? "",
      pathname,
      locale,
    );
    if (result.status === "success") {
      toast.success("success");
    }
    if (result.error) {
      toast.error(result.error);
    }
  }
  return (
    <div className="flex flex-col gap-8">
      <TopBar title={t("subtitle")}>
        <Drawer direction={"right"}>
          <DrawerTrigger asChild className={"w-full hidden lg:flex"}>
            <ButtonPrimary>{t("title")}</ButtonPrimary>
          </DrawerTrigger>
          <DiscountDrawerContent event={event} />
        </Drawer>
      </TopBar>
      <Drawer direction={"right"}>
        <DrawerTrigger
          asChild
          className={"lg:hidden absolute bottom-40 right-8"}
        >
          <ButtonPrimary>{t("title")}</ButtonPrimary>
        </DrawerTrigger>
        <DiscountDrawerContent event={event} />
      </Drawer>
      <div>
        <Tabs defaultValue="all" className="w-full h-full ">
          <div className={"flex justify-between"}>
            <TabsList
              className={`w-full  lg:max-w-[318px] lg:w-auto mx-auto lg:mx-0`}
            >
              <TabsTrigger value={"all"}>{t("all")}</TabsTrigger>
              <TabsTrigger value={"active"}>{t("active")}</TabsTrigger>
              <TabsTrigger value={"inactive"}>{t("inactive")}</TabsTrigger>
            </TabsList>
            <div></div>
          </div>
          <TabsContent value="all" className={"w-full h-full "}>
            {event.discountCodes.length > 0 ? (
              <Table className={"mt-4"}>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className={
                        "font-bold text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                      }
                    >
                      {t("code")}
                    </TableHead>
                    <TableHead
                      className={
                        "font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                      }
                    >
                      {t("type")}
                    </TableHead>
                    <TableHead
                      className={
                        "font-bold text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                      }
                    >
                      {t("value")}
                    </TableHead>
                    <TableHead
                      className={
                        "font-bold text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                      }
                    >
                      {t("times_used")}
                    </TableHead>
                    <TableHead
                      className={
                        "font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                      }
                    >
                      {t("quantity")}
                    </TableHead>
                    <TableHead
                      className={
                        "font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                      }
                    >
                      {t("expires_at")}
                    </TableHead>
                    <TableHead
                      className={
                        "font-bold  text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                      }
                    >
                      {/*{single_event.table.date_purchased}*/}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {event.discountCodes.map(
                    ({
                      code,
                      discountCodeId,
                      expiresAt,
                      usageLimit,
                      usageCount,
                      type,
                      value,
                      isActive,
                    }) => {
                      const expires = new Date(expiresAt);
                      return (
                        <TableRow key={discountCodeId}>
                          <TableCell
                            className={
                              "text-[1.5rem] py-[15px] leading-8 text-neutral-900"
                            }
                          >
                            <span
                              className={`${isActive ? "text-success" : "text-failure"}`}
                            >
                              {code}
                            </span>
                          </TableCell>
                          <TableCell
                            className={
                              "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                            }
                          >
                            <span
                              className={`${isActive ? "text-success" : "text-failure"}`}
                            >
                              {Capitalize(type)}
                            </span>
                          </TableCell>
                          <TableCell
                            className={
                              "text-[1.5rem] leading-8 text-neutral-900"
                            }
                          >
                            <span
                              className={`${isActive ? "text-success" : "text-failure"}`}
                            >
                              {type === "percentage" ? value + "%" : value}
                            </span>
                          </TableCell>
                          <TableCell
                            className={
                              "text-[1.5rem] leading-8 text-neutral-900"
                            }
                          >
                            <span
                              className={`${isActive ? "text-success" : "text-failure"}`}
                            >
                              {usageCount}
                            </span>
                          </TableCell>
                          <TableCell
                            className={
                              "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                            }
                          >
                            <span
                              className={`${isActive ? "text-success" : "text-failure"}`}
                            >
                              {usageLimit}
                            </span>
                          </TableCell>
                          <TableCell
                            className={
                              "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                            }
                          >
                            <span
                              className={`${isActive ? "text-success" : "text-failure"}`}
                            >
                              {expires.toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell
                            className={
                              "text-[1.5rem] leading-8 text-neutral-900"
                            }
                          >
                            <Popover>
                              <PopoverTrigger>
                                <div
                                  className={
                                    "w-[35px] h-[35px] cursor-pointer rounded-full bg-neutral-100 flex items-center justify-center"
                                  }
                                >
                                  <MoreCircle
                                    variant={"Bulk"}
                                    size={20}
                                    color={"#737C8A"}
                                  />
                                </div>
                              </PopoverTrigger>
                              <PopoverContent
                                className={
                                  "w-[250px] p-0 m-0 bg-none shadow-none border-none mx-4"
                                }
                              >
                                <div
                                  className={
                                    "bg-neutral-100 border border-neutral-200 right-8 p-4  mb-8 rounded-[1rem] shadow-xl bottom-full flex flex-col gap-4"
                                  }
                                >
                                  <span
                                    className={
                                      "font-medium py-[5px] border-b-[1px] border-neutral-200 text-[1.4rem] text-deep-100 leading-[20px]"
                                    }
                                  >
                                    {t("more")}
                                  </span>
                                  <div className={"flex flex-col gap-4"}>
                                    {isActive ? (
                                      <button
                                        onClick={() =>
                                          MarkAsInactive(discountCodeId)
                                        }
                                        className={`font-normal cursor-pointer group text-[1.5rem] py-4 leading-[20px] text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full`}
                                      >
                                        <span className={"text-failure"}>
                                          {t("mark_as_inactive")}
                                        </span>
                                        <CloseCircle
                                          size="20"
                                          variant="Bulk"
                                          color={"#DE0028"}
                                        />
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() =>
                                          MarkAsActive(discountCodeId)
                                        }
                                        className={`font-normal cursor-pointer group text-[1.5rem] py-4 leading-[20px] text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full`}
                                      >
                                        <span className={"text-primary-500"}>
                                          {t("mark_as_active")}
                                        </span>
                                        <TickCircle
                                          size="20"
                                          variant="Bulk"
                                          color={"#E45B00"}
                                        />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </TableCell>
                        </TableRow>
                      );
                    },
                  )}
                </TableBody>
              </Table>
            ) : (
              <div
                className={
                  " h-full w-full justify-center mx-auto mt-8 flex flex-col items-center gap-[3rem]"
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
                  className={
                    "flex flex-col gap-[3rem] items-center text-center"
                  }
                >
                  <p
                    className={
                      "text-[1.8rem] leading-[25px] text-neutral-600 max-w-[330px] lg:max-w-[422px]"
                    }
                  >
                    {t("nothing")}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
          <TabsContent value="active" className={"w-full h-full "}>
            {event.discountCodes.filter((code) => code.isActive).length > 0 ? (
              <Table className={"mt-4"}>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className={
                        "font-bold text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                      }
                    >
                      {t("code")}
                    </TableHead>
                    <TableHead
                      className={
                        "font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                      }
                    >
                      {t("type")}
                    </TableHead>
                    <TableHead
                      className={
                        "font-bold text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                      }
                    >
                      {t("value")}
                    </TableHead>
                    <TableHead
                      className={
                        "font-bold text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                      }
                    >
                      {t("times_used")}
                    </TableHead>
                    <TableHead
                      className={
                        "font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                      }
                    >
                      {t("quantity")}
                    </TableHead>
                    <TableHead
                      className={
                        "font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                      }
                    >
                      {t("expires_at")}
                    </TableHead>
                    <TableHead
                      className={
                        "font-bold  text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                      }
                    >
                      {/*{single_event.table.date_purchased}*/}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {event.discountCodes
                    .filter((code) => code.isActive)
                    .map(
                      ({
                        code,
                        discountCodeId,
                        expiresAt,
                        usageLimit,
                        usageCount,
                        type,
                        value,
                        isActive,
                      }) => {
                        const expires = new Date(expiresAt);
                        return (
                          <TableRow key={discountCodeId}>
                            <TableCell
                              className={
                                "text-[1.5rem] py-[15px] leading-8 text-neutral-900"
                              }
                            >
                              <span
                                className={`${isActive ? "text-success" : "text-failure"}`}
                              >
                                {code}
                              </span>
                            </TableCell>
                            <TableCell
                              className={
                                "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                              }
                            >
                              <span
                                className={`${isActive ? "text-success" : "text-failure"}`}
                              >
                                {Capitalize(type)}
                              </span>
                            </TableCell>
                            <TableCell
                              className={
                                "text-[1.5rem] leading-8 text-neutral-900"
                              }
                            >
                              <span
                                className={`${isActive ? "text-success" : "text-failure"}`}
                              >
                                {type === "percentage" ? value + "%" : value}
                              </span>
                            </TableCell>
                            <TableCell
                              className={
                                "text-[1.5rem] leading-8 text-neutral-900"
                              }
                            >
                              <span
                                className={`${isActive ? "text-success" : "text-failure"}`}
                              >
                                {usageCount}
                              </span>
                            </TableCell>
                            <TableCell
                              className={
                                "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                              }
                            >
                              <span
                                className={`${isActive ? "text-success" : "text-failure"}`}
                              >
                                {usageLimit}
                              </span>
                            </TableCell>
                            <TableCell
                              className={
                                "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                              }
                            >
                              <span
                                className={`${isActive ? "text-success" : "text-failure"}`}
                              >
                                {expires.toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell
                              className={
                                "text-[1.5rem] leading-8 text-neutral-900"
                              }
                            >
                              <Popover>
                                <PopoverTrigger>
                                  <div
                                    className={
                                      "w-[35px] h-[35px] cursor-pointer rounded-full bg-neutral-100 flex items-center justify-center"
                                    }
                                  >
                                    <MoreCircle
                                      variant={"Bulk"}
                                      size={20}
                                      color={"#737C8A"}
                                    />
                                  </div>
                                </PopoverTrigger>
                                <PopoverContent
                                  className={
                                    "w-[250px] p-0 m-0 bg-none shadow-none border-none mx-4"
                                  }
                                >
                                  <div
                                    className={
                                      "bg-neutral-100 border border-neutral-200 right-8 p-4  mb-8 rounded-[1rem] shadow-xl bottom-full flex flex-col gap-4"
                                    }
                                  >
                                    <span
                                      className={
                                        "font-medium py-[5px] border-b-[1px] border-neutral-200 text-[1.4rem] text-deep-100 leading-[20px]"
                                      }
                                    >
                                      {t("more")}
                                    </span>
                                    <div className={"flex flex-col gap-4"}>
                                      {isActive ? (
                                        <button
                                          onClick={() =>
                                            MarkAsInactive(discountCodeId)
                                          }
                                          className={`font-normal cursor-pointer group text-[1.5rem] py-4 leading-[20px] text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full`}
                                        >
                                          <span className={"text-failure"}>
                                            {t("mark_as_inactive")}
                                          </span>
                                          <CloseCircle
                                            size="20"
                                            variant="Bulk"
                                            color={"#DE0028"}
                                          />
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() =>
                                            MarkAsActive(discountCodeId)
                                          }
                                          className={`font-normal cursor-pointer group text-[1.5rem] py-4 leading-[20px] text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full`}
                                        >
                                          <span className={"text-primary-500"}>
                                            {t("mark_as_active")}
                                          </span>
                                          <TickCircle
                                            size="20"
                                            variant="Bulk"
                                            color={"#E45B00"}
                                          />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </TableCell>
                          </TableRow>
                        );
                      },
                    )}
                </TableBody>
              </Table>
            ) : (
              <div
                className={
                  " h-full w-full justify-center mx-auto mt-8 flex flex-col items-center gap-[3rem]"
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
                  className={
                    "flex flex-col gap-[3rem] items-center text-center"
                  }
                >
                  <p
                    className={
                      "text-[1.8rem] leading-[25px] text-neutral-600 max-w-[330px] lg:max-w-[422px]"
                    }
                  >
                    {t("nothing")}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
          <TabsContent value="inactive" className={"w-full h-full "}>
            {event.discountCodes.filter((code) => !code.isActive).length > 0 ? (
              <Table className={"mt-4"}>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className={
                        "font-bold text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                      }
                    >
                      {t("code")}
                    </TableHead>
                    <TableHead
                      className={
                        "font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                      }
                    >
                      {t("type")}
                    </TableHead>
                    <TableHead
                      className={
                        "font-bold text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                      }
                    >
                      {t("value")}
                    </TableHead>
                    <TableHead
                      className={
                        "font-bold text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                      }
                    >
                      {t("times_used")}
                    </TableHead>
                    <TableHead
                      className={
                        "font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                      }
                    >
                      {t("quantity")}
                    </TableHead>
                    <TableHead
                      className={
                        "font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                      }
                    >
                      {t("expires_at")}
                    </TableHead>
                    <TableHead
                      className={
                        "font-bold  text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
                      }
                    >
                      {/*{single_event.table.date_purchased}*/}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {event.discountCodes
                    .filter((code) => !code.isActive)
                    .map(
                      ({
                        code,
                        discountCodeId,
                        expiresAt,
                        usageLimit,
                        usageCount,
                        type,
                        value,
                        isActive,
                      }) => {
                        const expires = new Date(expiresAt);
                        return (
                          <TableRow key={discountCodeId}>
                            <TableCell
                              className={
                                "text-[1.5rem] py-[15px] leading-8 text-neutral-900"
                              }
                            >
                              <span
                                className={`${isActive ? "text-success" : "text-failure"}`}
                              >
                                {code}
                              </span>
                            </TableCell>
                            <TableCell
                              className={
                                "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                              }
                            >
                              <span
                                className={`${isActive ? "text-success" : "text-failure"}`}
                              >
                                {Capitalize(type)}
                              </span>
                            </TableCell>
                            <TableCell
                              className={
                                "text-[1.5rem] leading-8 text-neutral-900"
                              }
                            >
                              <span
                                className={`${isActive ? "text-success" : "text-failure"}`}
                              >
                                {type === "percentage" ? value + "%" : value}
                              </span>
                            </TableCell>
                            <TableCell
                              className={
                                "text-[1.5rem] leading-8 text-neutral-900"
                              }
                            >
                              <span
                                className={`${isActive ? "text-success" : "text-failure"}`}
                              >
                                {usageCount}
                              </span>
                            </TableCell>
                            <TableCell
                              className={
                                "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                              }
                            >
                              <span
                                className={`${isActive ? "text-success" : "text-failure"}`}
                              >
                                {usageLimit}
                              </span>
                            </TableCell>
                            <TableCell
                              className={
                                "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
                              }
                            >
                              <span
                                className={`${isActive ? "text-success" : "text-failure"}`}
                              >
                                {expires.toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell
                              className={
                                "text-[1.5rem] leading-8 text-neutral-900"
                              }
                            >
                              <Popover>
                                <PopoverTrigger>
                                  <div
                                    className={
                                      "w-[35px] h-[35px] cursor-pointer rounded-full bg-neutral-100 flex items-center justify-center"
                                    }
                                  >
                                    <MoreCircle
                                      variant={"Bulk"}
                                      size={20}
                                      color={"#737C8A"}
                                    />
                                  </div>
                                </PopoverTrigger>
                                <PopoverContent
                                  className={
                                    "w-[250px] p-0 m-0 bg-none shadow-none border-none mx-4"
                                  }
                                >
                                  <div
                                    className={
                                      "bg-neutral-100 border border-neutral-200 right-8 p-4  mb-8 rounded-[1rem] shadow-xl bottom-full flex flex-col gap-4"
                                    }
                                  >
                                    <span
                                      className={
                                        "font-medium py-[5px] border-b-[1px] border-neutral-200 text-[1.4rem] text-deep-100 leading-[20px]"
                                      }
                                    >
                                      {t("more")}
                                    </span>
                                    <div className={"flex flex-col gap-4"}>
                                      {isActive ? (
                                        <button
                                          onClick={() =>
                                            MarkAsInactive(discountCodeId)
                                          }
                                          className={`font-normal cursor-pointer group text-[1.5rem] py-4 leading-[20px] text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full`}
                                        >
                                          <span className={"text-failure"}>
                                            {t("mark_as_inactive")}
                                          </span>
                                          <CloseCircle
                                            size="20"
                                            variant="Bulk"
                                            color={"#DE0028"}
                                          />
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() =>
                                            MarkAsActive(discountCodeId)
                                          }
                                          className={`font-normal cursor-pointer group text-[1.5rem] py-4 leading-[20px] text-neutral-700 hover:text-primary-500 flex items-center justify-between w-full`}
                                        >
                                          <span className={"text-primary-500"}>
                                            {t("mark_as_active")}
                                          </span>
                                          <TickCircle
                                            size="20"
                                            variant="Bulk"
                                            color={"#E45B00"}
                                          />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </TableCell>
                          </TableRow>
                        );
                      },
                    )}
                </TableBody>
              </Table>
            ) : (
              <div
                className={
                  " h-full w-full justify-center mx-auto mt-8 flex flex-col items-center gap-[3rem]"
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
                  className={
                    "flex flex-col gap-[3rem] items-center text-center"
                  }
                >
                  <p
                    className={
                      "text-[1.8rem] leading-[25px] text-neutral-600 max-w-[330px] lg:max-w-[422px]"
                    }
                  >
                    {t("nothing")}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function DiscountDrawerContent({ event }: { event: Event }) {
  const t = useTranslations("Events.single_event.discount");
  const locale = useLocale();
  const { data: session } = useSession();
  const pathname = usePathname();

  const DiscountCodeSchema = z.object({
    code: z
      .string()
      .min(6, { error: t("errors.code.min") })
      .max(10, { error: t("errors.code.max") }),
    type: z.string(),
    value: z
      .string()
      .min(1, { error: t("errors.value.min") })
      .refine((val) => Number(val) >= 1, { error: t("errors.value.negative") }),
    expiresIn: z
      .string()
      .min(1, { error: t("errors.expiresIn.min") })
      .refine((val) => Number(val) >= 1, {
        error: t("errors.expiresIn.negative"),
      }),
    usageLimit: z
      .string()
      .min(1, { error: t("errors.quantity.min") })
      .refine((val) => Number(val) >= 1, {
        error: t("errors.quantity.negative"),
      }),
  });
  type TDiscountCodeSchema = z.infer<typeof DiscountCodeSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<TDiscountCodeSchema>({
    resolver: zodResolver(DiscountCodeSchema),
    defaultValues: {
      type: "percentage",
    },
  });

  async function submitHandler(data: TDiscountCodeSchema) {
    const result = await CreateDiscountCode(
      event.eventId,
      session?.user.accessToken!,
      { ...data },
      pathname,
      locale,
    );
    if (result.status === "success") {
      toast.success("success");
    }
    if (result.error) {
      toast.error(result.error);
    }
  }
  return (
    <DrawerContent
      className={"my-6 bg-white p-[30px] rounded-[30px] lg:w-[580px]"}
    >
      <div className={"w-full flex flex-col items-center overflow-y-scroll"}>
        <DrawerTitle className={"pb-[40px]"}>
          <span
            className={
              "font-primary font-medium text-center text-[2.6rem] leading-[30px] text-black"
            }
          >
            {t("title")}
          </span>
        </DrawerTitle>
        <DrawerDescription className="sr-only">
          Discount Codes
        </DrawerDescription>
        <div className={"w-full flex flex-col gap-6"}>
          <div>
            <div
              className={
                "bg-neutral-100 w-full rounded-[5rem] py-4 px-8 text-[1.5rem] leading-[20px] placeholder:text-neutral-600 text-deep-200 outline-none border disabled:text-neutral-600 disabled:cursor-not-allowed border-transparent focus:border-primary-500 flex items-center"
              }
            >
              <div className="w-full flex flex-col">
                <span className={"text-neutral-600 text-[1.2rem]"}>
                  {t("code")}
                </span>
                <input
                  type="text"
                  className="outline-none"
                  {...register("code")}
                  autoFocus
                />
              </div>
              <RefreshCircle
                className="cursor-pointer"
                onClick={() => {
                  const generatedCode = generateDiscountCode(event.eventName);
                  setValue("code", generatedCode);
                }}
                size="32"
                color="#FF8A65"
              />
            </div>
            <span className={"text-[1.2rem] px-8 py-2 text-failure"}>
              {errors.code && errors.code.message}
            </span>
          </div>
          <div>
            <div className={"flex items-center w-full gap-4"}>
              <Select
                onValueChange={(e) => setValue("type", e)}
                defaultValue="percentage"
              >
                <SelectTrigger className="bg-neutral-100 w-full rounded-[5rem] p-12 text-[1.5rem] leading-[20px] placeholder:text-neutral-600 text-deep-200 outline-none border border-transparent focus:border-primary-500">
                  <SelectValue placeholder={t("type")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    className={
                      "text-[1.5rem] leading-[20px] border-b border-neutral-100 mb-3 pb-3"
                    }
                    value={"fixed"}
                  >
                    {t("fixed")}
                  </SelectItem>
                  <SelectItem
                    className={
                      "text-[1.5rem] leading-[20px] border-b border-neutral-100 mb-3 pb-3"
                    }
                    value={"percentage"}
                  >
                    {t("percentage")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <input
                className={
                  "bg-neutral-100 w-full rounded-[5rem] p-8 text-[1.5rem] leading-[20px] placeholder:text-neutral-600 text-deep-200 outline-none border disabled:text-neutral-600 disabled:cursor-not-allowed border-transparent focus:border-primary-500"
                }
                type="number"
                {...register("value")}
                placeholder={t("value")}
              />
            </div>
            <div className={"flex"}>
              <div className={"flex-1"}>
                <span className={"text-[1.2rem] px-8 py-2 text-failure"}>
                  {errors.type && errors.type.message}
                </span>
              </div>
              <div className={"flex-1"}>
                <span className={"text-[1.2rem] px-8 py-2 text-failure"}>
                  {errors.value && errors.value.message}
                </span>
              </div>
            </div>
          </div>
          <div>
            <div
              className={
                "bg-neutral-100 w-full rounded-[5rem] py-4 px-8 text-[1.5rem] leading-[20px] placeholder:text-neutral-600 text-deep-200 outline-none border disabled:text-neutral-600 disabled:cursor-not-allowed border-transparent focus:border-primary-500 flex items-center"
              }
            >
              <div className="w-full">
                <span className={"text-neutral-600 text-[1.2rem]"}>
                  {t("expires_in")}
                </span>
                <input
                  type={"number"}
                  min={1}
                  defaultValue={1}
                  className={"w-full outline-none"}
                  {...register("expiresIn")}
                />
              </div>
              <span className="text-[1.5rem] leading-[20px] text-neutral-600">
                {t("days")}
              </span>
            </div>
            <span className={"text-[1.2rem] px-8 py-2 text-failure"}>
              {errors.expiresIn && errors.expiresIn.message}
            </span>
          </div>
          <div>
            <Input
              type="number"
              {...register("usageLimit")}
              min={1}
              defaultValue={1}
              error={errors.usageLimit && errors.usageLimit.message}
            >
              {t("quantity")}
            </Input>
            {/* <input
              className={
                'bg-neutral-100 w-full rounded-[5rem] p-8 text-[1.5rem] leading-[20px] placeholder:text-neutral-600 text-deep-200 outline-none border disabled:text-neutral-600 disabled:cursor-not-allowed border-transparent focus:border-primary-500'
              }
              type="number"
              placeholder={t('quantity')}
              min={1}
              defaultValue={1}
              
            />
            <span className={"text-[1.2rem] px-8 py-2 text-failure"}>
              {errors.usageLimit && errors.usageLimit.message}
            </span> */}
          </div>
        </div>
      </div>

      <DrawerFooter>
        <div className={"flex gap-8"}>
          <DrawerClose className={"flex-1 cursor-pointer"}>
            <div
              className={
                "w-full border-primary-500 text-primary-500 bg-primary-100 px-[3rem] py-[15px] border-2 rounded-[100px] text-center font-medium text-[1.5rem] h-auto leading-[20px] cursor-pointer transition-all duration-400 flex items-center justify-center"
              }
            >
              {t("close")}
            </div>
          </DrawerClose>
          <ButtonPrimary
            onClick={handleSubmit(submitHandler)}
            className={"flex-1"}
          >
            {isSubmitting ? <LoadingCircleSmall /> : t("add")}
          </ButtonPrimary>
        </div>
      </DrawerFooter>
    </DrawerContent>
  );
}
