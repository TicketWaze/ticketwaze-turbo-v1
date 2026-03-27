import AdminLayout from "@/components/Layouts/AdminLayout";
import { useTranslations } from "next-intl";
import Filter from "./filter";
import ActivitiesPageTopbar from "./ActivitiesPageTopbar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";

export default function ActivitiesPageContent() {
  const t = useTranslations("Activities");
  return (
    <AdminLayout>
      <ActivitiesPageTopbar
        title={t("title")}
        filter={t("filters.period.actual")}
      />
      ;
      <div
        className={
          "grid grid-cols-2 lg:grid-cols-4 divide-x divide-neutral-100 border-neutral-100 border-b"
        }
      >
        <div className={"pb-12"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("total")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary"
            }
          >
            0
          </p>
        </div>
        <div className={"pl-10"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("active")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary"
            }
          >
            0
          </p>
        </div>
        <div className={"pl-0 lg:pl-10"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("suspended")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary"
            }
          >
            0
          </p>
        </div>

        <div className={"pl-0 lg:pl-10"}>
          <span className={"text-[14px] text-neutral-600 leading-8 pb-2"}>
            {t("suspended")}
          </span>
          <p
            className={
              "font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary"
            }
          >
            0
          </p>
        </div>
      </div>
      <div className="flex justify-between">
        <h4 className="font-medium inline-flex items-center gap-2 font-primary text-[1.8rem] leading-10 text-black">
          {t("list.title")}
        </h4>
        <div className="flex gap-4">
          <Filter filter={t("filters.list.status")} />
          <Filter filter={t("filters.list.period")} />
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
              {t("list.table.name")}
            </TableHead>
            <TableHead
              className={
                "font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
              }
            >
              {t("list.table.organizer")}
            </TableHead>
            <TableHead
              className={
                "font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
              }
            >
              {t("list.table.start")}
            </TableHead>
            <TableHead
              className={
                "font-bold text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
              }
            >
              {t("list.table.sold")}
            </TableHead>
            <TableHead
              className={
                "font-bold text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
              }
            >
              {t("list.table.status")}
            </TableHead>
            <TableHead
              className={
                "font-bold hidden lg:table-cell text-[1.1rem] pb-[15px] leading-[15px] text-deep-100 uppercase"
              }
            >
              {t("list.table.created")}
            </TableHead>
          </TableRow>
        </TableHeader>
        
        <TableBody>
          <TableRow>
            <TableCell
              className={"text-[1.5rem] py-6 leading-8 text-neutral-900"}
            >
              <Drawer direction={"right"}>
                <DrawerTrigger>
                  <span className={"cursor-pointer"}>
                    {/* {TruncateUrl(order.orderName, 12)} */}
                    All night long
                  </span>
                </DrawerTrigger>
                {/* <WalletOrderDrawerContent order={order} /> */}
              </Drawer>
            </TableCell>
            <TableCell
              className={
                "text-[1.5rem] py-6 hidden lg:table-cell leading-8 text-neutral-900"
              }
            >
              <Drawer direction={"right"}>
                <DrawerTrigger>
                  <span className={"cursor-pointer"}>
                    {/* {order.provider.toUpperCase()} */}
                    Global Events Hub
                  </span>
                </DrawerTrigger>
                {/* <WalletOrderDrawerContent order={order} /> */}
              </Drawer>
            </TableCell>
            <TableCell
              className={
                "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
              }
            >
              {/* {order.tickets.length} */}
              Jan 16, 2025 12:21 PM
            </TableCell>
            <TableCell
              className={"text-[1.5rem] font-medium leading-8 text-neutral-900"}
            >
              <Drawer direction={"right"}>
                <DrawerTrigger>
                  <span className={"cursor-pointer py-6"}>
                    {/* {session?.user.userPreference.currency === "USD"
                      ? `${order.usdPrice} USD`
                      : `${order.amount} HTG`} */}
                    3500
                  </span>
                </DrawerTrigger>
                {/* <WalletOrderDrawerContent order={order} /> */}
              </Drawer>
            </TableCell>
            <TableCell className="py-6">
              <Drawer direction={"right"}>
                <DrawerTrigger>
                  {/* {order?.status === "ONGOING" && ( */}
                  <span
                    className={
                      "py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase text-[#349C2E]  px-2 rounded-[30px] bg-[#f5f5f5]"
                    }
                  >
                    {t("list.filters.ongoing")}
                  </span>
                  {/* )} */}
                  {/* {order?.status === "PAST" && (
                    <span
                      className={
                        "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#3F3F3F]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      {t("list.filters.past")}
                    </span>
                  )}
                  {order?.status === "UPCOMING" && (
                    <span
                      className={
                        "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#EA961C]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      {t("list.filters.upcoming")}
                    </span>
                  )}
                  {order?.status === "ACTIVE" && (
                    <span
                      className={
                        "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#349C2E]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      {t("list.filters.active")}
                    </span>
                  )} */}
                </DrawerTrigger>
                {/* <WalletOrderDrawerContent order={order} /> */}
              </Drawer>
            </TableCell>
            <TableCell
              className={
                "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
              }
            >
              Jan 16, 2025 12:21 PM
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell
              className={"text-[1.5rem] py-6 leading-8 text-neutral-900"}
            >
              <Drawer direction={"right"}>
                <DrawerTrigger>
                  <span className={"cursor-pointer"}>
                    {/* {TruncateUrl(order.orderName, 12)} */}
                    All night long
                  </span>
                </DrawerTrigger>
                {/* <WalletOrderDrawerContent order={order} /> */}
              </Drawer>
            </TableCell>
            <TableCell
              className={
                "text-[1.5rem] py-6 hidden lg:table-cell leading-8 text-neutral-900"
              }
            >
              <Drawer direction={"right"}>
                <DrawerTrigger>
                  <span className={"cursor-pointer"}>
                    {/* {order.provider.toUpperCase()} */}
                    Global Events Hub
                  </span>
                </DrawerTrigger>
                {/* <WalletOrderDrawerContent order={order} /> */}
              </Drawer>
            </TableCell>
            <TableCell
              className={
                "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
              }
            >
              {/* {order.tickets.length} */}
              Jan 16, 2025 12:21 PM
            </TableCell>
            <TableCell
              className={"text-[1.5rem] font-medium leading-8 text-neutral-900"}
            >
              <Drawer direction={"right"}>
                <DrawerTrigger>
                  <span className={"cursor-pointer py-6"}>
                    {/* {session?.user.userPreference.currency === "USD"
                      ? `${order.usdPrice} USD`
                      : `${order.amount} HTG`} */}
                    3500
                  </span>
                </DrawerTrigger>
                {/* <WalletOrderDrawerContent order={order} /> */}
              </Drawer>
            </TableCell>
            <TableCell className="py-6">
              <Drawer direction={"right"}>
                <DrawerTrigger>
                  {/* {order?.status === "ONGOING" && ( */}
                  {/* <span
                    className={
                      "py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase text-[#349C2E]  px-2 rounded-[30px] bg-[#f5f5f5]"
                    }
                  >
                    {t("list.filters.ongoing")}
                  </span> */}
                  {/* )} */}
                  {/* {order?.status === "PAST" && (
                    <span
                      className={
                        "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#3F3F3F]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      {t("list.filters.past")}
                    </span>
                  )} */}
                  {/* {order?.status === "UPCOMING" && ( */}
                    <span
                      className={
                        "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#EA961C]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      {t("list.filters.upcoming")}
                    </span>
                  {/* )} */}
                  {/* {order?.status === "ACTIVE" && (
                    <span
                      className={
                        "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#349C2E]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      {t("list.filters.active")}
                    </span>
                  )} */}
                </DrawerTrigger>
                {/* <WalletOrderDrawerContent order={order} /> */}
              </Drawer>
            </TableCell>
            <TableCell
              className={
                "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
              }
            >
              Jan 16, 2025 12:21 PM
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell
              className={"text-[1.5rem] py-6 leading-8 text-neutral-900"}
            >
              <Drawer direction={"right"}>
                <DrawerTrigger>
                  <span className={"cursor-pointer"}>
                    {/* {TruncateUrl(order.orderName, 12)} */}
                    All night long
                  </span>
                </DrawerTrigger>
                {/* <WalletOrderDrawerContent order={order} /> */}
              </Drawer>
            </TableCell>
            <TableCell
              className={
                "text-[1.5rem] py-6 hidden lg:table-cell leading-8 text-neutral-900"
              }
            >
              <Drawer direction={"right"}>
                <DrawerTrigger>
                  <span className={"cursor-pointer"}>
                    {/* {order.provider.toUpperCase()} */}
                    Global Events Hub
                  </span>
                </DrawerTrigger>
                {/* <WalletOrderDrawerContent order={order} /> */}
              </Drawer>
            </TableCell>
            <TableCell
              className={
                "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
              }
            >
              {/* {order.tickets.length} */}
              Jan 16, 2025 12:21 PM
            </TableCell>
            <TableCell
              className={"text-[1.5rem] font-medium leading-8 text-neutral-900"}
            >
              <Drawer direction={"right"}>
                <DrawerTrigger>
                  <span className={"cursor-pointer py-6"}>
                    {/* {session?.user.userPreference.currency === "USD"
                      ? `${order.usdPrice} USD`
                      : `${order.amount} HTG`} */}
                    3500
                  </span>
                </DrawerTrigger>
                {/* <WalletOrderDrawerContent order={order} /> */}
              </Drawer>
            </TableCell>
            <TableCell className="py-6">
              <Drawer direction={"right"}>
                <DrawerTrigger>
                  {/* {order?.status === "ONGOING" && ( */}
                  {/* <span
                    className={
                      "py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase text-[#349C2E]  px-2 rounded-[30px] bg-[#f5f5f5]"
                    }
                  >
                    {t("list.filters.ongoing")}
                  </span> */}
                  {/* )} */}
                  {/* {order?.status === "PAST" && ( */}
                    <span
                      className={
                        "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#3F3F3F]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      {t("list.filters.past")}
                    </span>
                  {/* )} */}
                  {/* {order?.status === "UPCOMING" && (
                    <span
                      className={
                        "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#EA961C]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      {t("list.filters.upcoming")}
                    </span>
                  )}
                  {order?.status === "ACTIVE" && (
                    <span
                      className={
                        "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#349C2E]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      {t("list.filters.active")}
                    </span>
                  )} */}
                </DrawerTrigger>
                {/* <WalletOrderDrawerContent order={order} /> */}
              </Drawer>
            </TableCell>
            <TableCell
              className={
                "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
              }
            >
              Jan 16, 2025 12:21 PM
            </TableCell>
          </TableRow>

          <TableRow>
            <TableCell
              className={"text-[1.5rem] py-6 leading-8 text-neutral-900"}
            >
              <Drawer direction={"right"}>
                <DrawerTrigger>
                  <span className={"cursor-pointer"}>
                    {/* {TruncateUrl(order.orderName, 12)} */}
                    All night long
                  </span>
                </DrawerTrigger>
                {/* <WalletOrderDrawerContent order={order} /> */}
              </Drawer>
            </TableCell>
            <TableCell
              className={
                "text-[1.5rem] py-6 hidden lg:table-cell leading-8 text-neutral-900"
              }
            >
              <Drawer direction={"right"}>
                <DrawerTrigger>
                  <span className={"cursor-pointer"}>
                    {/* {order.provider.toUpperCase()} */}
                    Global Events Hub
                  </span>
                </DrawerTrigger>
                {/* <WalletOrderDrawerContent order={order} /> */}
              </Drawer>
            </TableCell>
            <TableCell
              className={
                "hidden lg:table-cell text-[1.5rem] leading-8 text-neutral-900"
              }
            >
              {/* {order.tickets.length} */}
              Jan 16, 2025 12:21 PM
            </TableCell>
            <TableCell
              className={"text-[1.5rem] font-medium leading-8 text-neutral-900"}
            >
              <Drawer direction={"right"}>
                <DrawerTrigger>
                  <span className={"cursor-pointer py-6"}>
                    {/* {session?.user.userPreference.currency === "USD"
                      ? `${order.usdPrice} USD`
                      : `${order.amount} HTG`} */}
                    3500
                  </span>
                </DrawerTrigger>
                {/* <WalletOrderDrawerContent order={order} /> */}
              </Drawer>
            </TableCell>
            <TableCell className="py-6">
              <Drawer direction={"right"}>
                <DrawerTrigger>
                  {/* {order?.status === "ONGOING" && ( */}
                  {/* <span
                      className={
                        "py-[0.3rem] cursor-pointer text-[1.1rem] font-bold leading-6 text-center uppercase text-[#349C2E]  px-2 rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      {t("list.filters.ongoing")}
                    </span> */}
                  {/* )} */}
                  {/* {order?.status === "PAST" && (
                    <span
                      className={
                        "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#3F3F3F]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      {t("list.filters.past")}
                    </span>
                  )}
                  {order?.status === "UPCOMING" && (
                    <span
                      className={
                        "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#EA961C]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                      }
                    >
                      {t("list.filters.upcoming")}
                    </span>
                  )} */}
                  {/* {order?.status === "ACTIVE" && ( */}
                  <span
                    className={
                      "py-[3px] cursor-pointer text-[1.1rem] font-bold leading-[15px] text-center uppercase text-[#349C2E]  px-[5px] rounded-[30px] bg-[#f5f5f5]"
                    }
                  >
                    {t("list.filters.active")}
                  </span>
                  {/* )} */}
                </DrawerTrigger>
                {/* <WalletOrderDrawerContent order={order} /> */}
              </Drawer>
            </TableCell>
            <TableCell
              className={
                "text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900"
              }
            >
              Jan 16, 2025 12:21 PM
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </AdminLayout>
  );
}
