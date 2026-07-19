"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import formatDate from "@/lib/FormatDate";
import { InviteUsersAction } from "@/actions/Waitlist";

export type WaitlistEntry = {
  waitlistUserId: string;
  email: string;
  entity: "attendee" | "business" | "both";
  invitedAt: string | null;
  createdAt: string;
};

export type WaitlistStats = {
  total: number;
  invited: number;
  pending: number;
  attendee: number;
  business: number;
  both: number;
};

type Props = {
  users: WaitlistEntry[];
  stats: WaitlistStats;
  accessToken: string;
};

type Tab = "all" | "pending" | "invited";

export default function WaitlistPageContent({
  users,
  stats,
  accessToken,
}: Props) {
  const t = useTranslations("Waitlist");
  const locale = useLocale();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [entityFilter, setEntityFilter] = useState<
    "all" | "attendee" | "business" | "both"
  >("all");
  const [isInvitingSelected, setIsInvitingSelected] = useState(false);
  const [invitingOneId, setInvitingOneId] = useState<string | null>(null);

  // "All" shows everyone; "Not invited" only those still pending; "Invited"
  // only those already invited. The entity Select filters within the active tab.
  const tabUsers =
    tab === "invited"
      ? users.filter((u) => u.invitedAt)
      : tab === "pending"
        ? users.filter((u) => !u.invitedAt)
        : users;
  const displayedUsers =
    entityFilter === "all"
      ? tabUsers
      : tabUsers.filter((u) => u.entity === entityFilter);

  // Selection applies everywhere except the "Invited" tab (nothing to re-invite).
  const showSelection = tab !== "invited";
  const pendingUsers = displayedUsers.filter((u) => !u.invitedAt);

  const allChecked =
    pendingUsers.length > 0 &&
    pendingUsers.every((u) => selectedIds.has(u.waitlistUserId));

  const someChecked = displayedUsers.some((u) =>
    selectedIds.has(u.waitlistUserId),
  );

  function handleTabChange(value: string) {
    setTab(value as Tab);
    setSelectedIds(new Set());
  }

  function toggleSelectAll() {
    if (allChecked) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingUsers.map((u) => u.waitlistUserId)));
    }
  }

  function toggleSelect(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleInviteSelected() {
    setIsInvitingSelected(true);
    try {
      const result = await InviteUsersAction({
        userIds: Array.from(selectedIds),
        accessToken,
        locale,
      });
      if ("status" in result) {
        toast.success(t("invite.success"));
        setSelectedIds(new Set());
        // Pull fresh data so newly-invited rows move to the Invited tab.
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(t("invite.error"));
    } finally {
      setIsInvitingSelected(false);
    }
  }

  async function handleInviteOne(userId: string) {
    setInvitingOneId(userId);
    try {
      const result = await InviteUsersAction({
        userIds: [userId],
        accessToken,
        locale,
      });
      if ("status" in result) {
        toast.success(t("invite.success"));
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(t("invite.error"));
    } finally {
      setInvitingOneId(null);
    }
  }

  return (
    <div className="overflow-y-scroll flex flex-col gap-8">
      {/* Topbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h3 className="font-medium font-primary text-[2.6rem] leading-12 text-black">
          {t("title")}
        </h3>
        {showSelection && selectedIds.size > 0 && (
          <button
            onClick={handleInviteSelected}
            disabled={isInvitingSelected}
            className="flex items-center justify-center gap-2 px-6 py-[0.8rem] rounded-[3rem] bg-primary-500 text-white text-[1.4rem] leading-8 font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isInvitingSelected ? (
              <LoadingCircleSmall />
            ) : (
              t("invite.selected", { count: selectedIds.size })
            )}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 divide-x divide-neutral-100 border-neutral-100 border-b">
        <div className="pb-8 lg:pb-12">
          <span className="text-[14px] text-neutral-600 leading-8 pb-2 block">
            {t("stats.total")}
          </span>
          <p className="font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary">
            {stats.total}
          </p>
        </div>
        <div className="pl-6 lg:pl-10 pb-8 lg:pb-12">
          <span className="text-[14px] text-neutral-600 leading-8 pb-2 block">
            {t("stats.pending")}
          </span>
          <p className="font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary">
            {stats.pending}
          </p>
        </div>
        <div className="pt-8 lg:pt-0 lg:pl-10 pb-8 lg:pb-12">
          <span className="text-[14px] text-neutral-600 leading-8 pb-2 block">
            {t("stats.attendee")}
          </span>
          <p className="font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary">
            {stats.attendee}
          </p>
        </div>
        <div className="pl-6 lg:pl-10 pt-8 lg:pt-0 pb-8 lg:pb-12">
          <span className="text-[14px] text-neutral-600 leading-8 pb-2 block">
            {t("stats.business")}
          </span>
          <p className="font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary">
            {stats.business}
          </p>
        </div>
        <div className="pl-6 lg:pl-10 pt-8 lg:pt-0 pb-8 lg:pb-12">
          <span className="text-[14px] text-neutral-600 leading-8 pb-2 block">
            {t("stats.both")}
          </span>
          <p className="font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary">
            {stats.both}
          </p>
        </div>
      </div>

      {/* Tabs + entity filter */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={tab} onValueChange={handleTabChange}>
          <TabsList className="w-full lg:w-fit">
            <TabsTrigger value="all">
              {t("tabs.all")} ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="pending">
              {t("tabs.pending")} ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="invited">
              {t("tabs.invited")} ({stats.invited})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-4">
          {showSelection && someChecked && (
            <span className="text-[1.4rem] text-neutral-500 font-normal hidden lg:inline">
              {selectedIds.size} {t("list.selected")}
            </span>
          )}
          <Select
            defaultValue="all"
            onValueChange={(v) =>
              setEntityFilter(v as "all" | "attendee" | "business" | "both")
            }
          >
            <SelectTrigger className="bg-neutral-100 w-full cursor-pointer rounded-[3rem] py-[0.8rem] px-6 border-none lg:w-fit text-[1.4rem] text-neutral-700 leading-8">
              <SelectValue placeholder="" />
            </SelectTrigger>
            <SelectContent className="bg-neutral-100 text-[1.4rem]">
              <SelectGroup>
                <SelectItem className="text-[1.4rem] text-deep-100" value="all">
                  {t("filters.all")}
                </SelectItem>
                <SelectItem
                  className="text-[1.4rem] text-deep-100"
                  value="attendee"
                >
                  {t("filters.attendee")}
                </SelectItem>
                <SelectItem
                  className="text-[1.4rem] text-deep-100"
                  value="business"
                >
                  {t("filters.business")}
                </SelectItem>
                <SelectItem className="text-[1.4rem] text-deep-100" value="both">
                  {t("filters.both")}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            {showSelection && (
              <TableHead className="w-10 pb-6">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 accent-primary-500 cursor-pointer"
                />
              </TableHead>
            )}
            <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
              {t("list.table.email")}
            </TableHead>
            <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
              {t("list.table.entity")}
            </TableHead>
            <TableHead className="font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
              {t("list.table.joined")}
            </TableHead>
            <TableHead className="font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
              {t("list.table.status")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedUsers.map((user) => (
            <TableRow key={user.waitlistUserId}>
              {showSelection && (
                <TableCell
                  onClick={(e) =>
                    !user.invitedAt && toggleSelect(user.waitlistUserId, e)
                  }
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(user.waitlistUserId)}
                    disabled={!!user.invitedAt}
                    onChange={() => {}}
                    className="w-5 h-5 accent-primary-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                  />
                </TableCell>
              )}
              <TableCell className="text-[1.5rem] py-6 leading-8 text-neutral-900 max-w-56 lg:max-w-none">
                <Drawer direction="right">
                  <DrawerTrigger>
                    <span className="block truncate cursor-pointer">
                      {user.email}
                    </span>
                  </DrawerTrigger>
                  <DrawerContent
                    className={"w-xl lg:w-208 bg-white my-6 p-12 rounded-[30px]"}
                  >
                    <div
                      className={"w-full flex flex-col items-center overflow-y-scroll"}
                    >
                      <DrawerTitle className={"pb-16"}>
                        <span
                          className={
                            "font-primary font-medium text-center text-[2.6rem] leading-12 text-black"
                          }
                        >
                          {user.email}
                        </span>
                      </DrawerTitle>
                      <DrawerDescription className={"w-full"}>
                        <span className={"w-full flex flex-col gap-8"}>
                          <span
                            className={
                              "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                            }
                          >
                            {t("drawer.email")}
                            <span
                              className={"text-deep-100 font-medium leading-8"}
                            >
                              {user.email}
                            </span>
                          </span>
                          <span
                            className={
                              "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                            }
                          >
                            {t("drawer.entity")}
                            <span
                              className={`py-[0.3rem] px-2 rounded-[30px] text-[11px] font-bold uppercase ${
                                user.entity === "attendee"
                                  ? "bg-blue-50 text-blue-600"
                                  : user.entity === "business"
                                    ? "bg-orange-50 text-orange-600"
                                    : "bg-purple-50 text-purple-600"
                              }`}
                            >
                              {t(`filters.${user.entity}`)}
                            </span>
                          </span>
                          <span
                            className={
                              "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                            }
                          >
                            {t("drawer.joined")}
                            <span
                              className={"text-deep-100 font-medium leading-8"}
                            >
                              {formatDate(user.createdAt, locale, "local")}
                            </span>
                          </span>
                          <span
                            className={
                              "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                            }
                          >
                            {t("drawer.status")}
                            <span
                              className={`py-[0.3rem] px-2 rounded-[30px] text-[11px] font-bold uppercase ${
                                user.invitedAt
                                  ? "bg-neutral-100 text-success"
                                  : "bg-neutral-100 text-neutral-500"
                              }`}
                            >
                              {user.invitedAt
                                ? t("status.invited")
                                : t("status.pending")}
                            </span>
                          </span>
                          {user.invitedAt && (
                            <span
                              className={
                                "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                              }
                            >
                              {t("drawer.invited_at")}
                              <span
                                className={"text-deep-100 font-medium leading-8"}
                              >
                                {formatDate(user.invitedAt, locale, "local")}
                              </span>
                            </span>
                          )}
                        </span>
                      </DrawerDescription>
                    </div>
                    <DrawerFooter>
                      <div className={"flex gap-8 w-full items-center"}>
                        <button
                          onClick={() => handleInviteOne(user.waitlistUserId)}
                          disabled={
                            invitingOneId === user.waitlistUserId ||
                            !!user.invitedAt
                          }
                          className={
                            "w-full bg-primary-500 disabled:bg-primary-500/50 hover:bg-primary-500/80 px-12 py-6 border-2 border-transparent rounded-[100px] text-center text-white font-medium text-[1.5rem] h-auto leading-8 cursor-pointer transition-all duration-400 flex items-center justify-center disabled:cursor-not-allowed"
                          }
                        >
                          {invitingOneId === user.waitlistUserId ? (
                            <LoadingCircleSmall />
                          ) : user.invitedAt ? (
                            t("drawer.already_invited")
                          ) : (
                            t("drawer.invite")
                          )}
                        </button>
                        <DrawerClose asChild>
                          <button
                            className={
                              "w-full border-neutral-200 text-neutral-700 bg-neutral-100 px-4 py-6 border-2 rounded-[100px] text-center font-medium text-[1.5rem] h-auto leading-8 cursor-pointer transition-all duration-400 flex items-center justify-center"
                            }
                          >
                            {t("drawer.close")}
                          </button>
                        </DrawerClose>
                      </div>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              </TableCell>
              <TableCell className="text-[1.5rem] py-6 leading-8 text-neutral-900">
                <span
                  className={`py-[0.3rem] px-2 rounded-[30px] text-[11px] font-bold uppercase ${
                    user.entity === "attendee"
                      ? "bg-blue-50 text-blue-600"
                      : user.entity === "business"
                        ? "bg-orange-50 text-orange-600"
                        : "bg-purple-50 text-purple-600"
                  }`}
                >
                  {t(`filters.${user.entity}`)}
                </span>
              </TableCell>
              <TableCell className="text-[1.5rem] hidden lg:table-cell leading-8 text-neutral-900">
                {formatDate(user.createdAt, locale, "local")}
              </TableCell>
              <TableCell className="hidden lg:table-cell py-6">
                <span
                  className={`py-[0.3rem] px-2 rounded-[30px] text-[11px] font-bold uppercase ${
                    user.invitedAt
                      ? "bg-neutral-100 text-success"
                      : "bg-neutral-100 text-neutral-500"
                  }`}
                >
                  {user.invitedAt ? t("status.invited") : t("status.pending")}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {displayedUsers.length === 0 && (
        <div className="flex flex-col w-fit gap-12 items-center mt-8 self-center">
          <div className="rounded-full bg-neutral-100 p-6 w-fit">
            <div className="flex items-center rounded-full bg-neutral-200 p-8 w-fit justify-center">
              <span className="text-[3rem]">📋</span>
            </div>
          </div>
          <p className="max-w-172 text-[1.8rem] text-neutral-600 leading-10 text-center">
            {t("list.empty")}
          </p>
        </div>
      )}
    </div>
  );
}
