"use client";
import { useState } from "react";
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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import formatDate from "@/lib/FormatDate";
import { InviteUsersAction } from "@/actions/Waitlist";

export type WaitlistEntry = {
  waitlistUserId: string;
  email: string;
  entity: "personal" | "business";
  invitedAt: string | null;
  createdAt: string;
};

export type WaitlistStats = {
  total: number;
  invited: number;
  pending: number;
  personal: number;
  business: number;
};

type Props = {
  users: WaitlistEntry[];
  stats: WaitlistStats;
  accessToken: string;
};

export default function WaitlistPageContent({
  users,
  stats,
  accessToken,
}: Props) {
  const t = useTranslations("Waitlist");
  const locale = useLocale();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [entityFilter, setEntityFilter] = useState<
    "all" | "personal" | "business"
  >("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerUser, setDrawerUser] = useState<WaitlistEntry | null>(null);
  const [isInvitingSelected, setIsInvitingSelected] = useState(false);
  const [invitingOneId, setInvitingOneId] = useState<string | null>(null);

  const filteredUsers =
    entityFilter === "all"
      ? users
      : users.filter((u) => u.entity === entityFilter);

  const pendingUsers = filteredUsers.filter((u) => !u.invitedAt);

  const allChecked =
    pendingUsers.length > 0 &&
    pendingUsers.every((u) => selectedIds.has(u.waitlistUserId));

  const someChecked = filteredUsers.some((u) =>
    selectedIds.has(u.waitlistUserId),
  );

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

  function openDrawer(user: WaitlistEntry) {
    setDrawerUser(user);
    setDrawerOpen(true);
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
        setDrawerOpen(false);
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(t("invite.error"));
    } finally {
      setInvitingOneId(null);
    }
  }

  function getInitials(user: WaitlistEntry) {
    return user.email[0].toUpperCase();
  }

  return (
    <div className="overflow-y-scroll flex flex-col gap-8">
      {/* Topbar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h3 className="font-medium font-primary text-[2.6rem] leading-12 text-black">
          {t("title")}
        </h3>
        {selectedIds.size > 0 && (
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
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-neutral-100 border-neutral-100 border-b">
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
            {t("stats.personal")}
          </span>
          <p className="font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary">
            {stats.personal}
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
      </div>

      {/* Table header */}
      <div className="flex justify-between items-center">
        <h4 className="font-medium hidden lg:inline-flex items-center gap-2 font-primary text-[1.8rem] leading-10 text-black">
          {t("list.title")}
          {someChecked && (
            <span className="text-[1.4rem] text-neutral-500 font-normal">
              ({selectedIds.size} {t("list.selected")})
            </span>
          )}
        </h4>
        <Select
          defaultValue="all"
          onValueChange={(v) =>
            setEntityFilter(v as "all" | "personal" | "business")
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
                value="personal"
              >
                {t("filters.personal")}
              </SelectItem>
              <SelectItem
                className="text-[1.4rem] text-deep-100"
                value="business"
              >
                {t("filters.business")}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 pb-6">
              <input
                type="checkbox"
                checked={allChecked}
                onChange={toggleSelectAll}
                className="w-5 h-5 accent-primary-500 cursor-pointer"
              />
            </TableHead>
            <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
              {t("list.table.name")}
            </TableHead>
            <TableHead className="font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
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
          {filteredUsers.map((user) => (
            <TableRow
              key={user.waitlistUserId}
              className="cursor-pointer"
              onClick={() => openDrawer(user)}
            >
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
              <TableCell className="text-[1.5rem] py-6 leading-8 text-neutral-900 max-w-56 lg:max-w-none">
                <span className="block truncate">{user.email}</span>
              </TableCell>
              <TableCell className="text-[1.5rem] py-6 leading-8 text-neutral-900">
                <span
                  className={`py-[0.3rem] px-2 rounded-[30px] text-[11px] font-bold uppercase ${
                    user.entity === "personal"
                      ? "bg-blue-50 text-blue-600"
                      : "bg-orange-50 text-orange-600"
                  }`}
                >
                  {user.entity === "personal"
                    ? t("filters.personal")
                    : t("filters.business")}
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

      {filteredUsers.length === 0 && (
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

      {/* User detail drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
        <DrawerContent>
          <DrawerHeader className="px-8 pt-8 pb-4 border-b border-neutral-100">
            <DrawerTitle className="text-[1.8rem] font-primary font-semibold text-black">
              {t("drawer.title")}
            </DrawerTitle>
          </DrawerHeader>

          {drawerUser && (
            <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-6">
              {/* Avatar + email */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-500 font-bold text-[1.8rem]">
                    {getInitials(drawerUser)}
                  </span>
                </div>
                <p className="font-semibold text-[1.6rem] leading-8 text-neutral-900 font-primary">
                  {drawerUser.email}
                </p>
              </div>

              {/* Details */}
              <div className="flex flex-col gap-4">
                <div className="flex justify-between py-4 border-b border-neutral-100">
                  <span className="text-[1.4rem] text-neutral-500 leading-8">
                    {t("drawer.email")}
                  </span>
                  <span className="text-[1.4rem] text-neutral-900 leading-8 font-medium">
                    {drawerUser.email}
                  </span>
                </div>
                <div className="flex justify-between py-4 border-b border-neutral-100">
                  <span className="text-[1.4rem] text-neutral-500 leading-8">
                    {t("drawer.entity")}
                  </span>
                  <span
                    className={`py-[0.3rem] px-2 rounded-[30px] text-[11px] font-bold uppercase ${
                      drawerUser.entity === "personal"
                        ? "bg-blue-50 text-blue-600"
                        : "bg-orange-50 text-orange-600"
                    }`}
                  >
                    {drawerUser.entity === "personal"
                      ? t("filters.personal")
                      : t("filters.business")}
                  </span>
                </div>
                <div className="flex justify-between py-4 border-b border-neutral-100">
                  <span className="text-[1.4rem] text-neutral-500 leading-8">
                    {t("drawer.joined")}
                  </span>
                  <span className="text-[1.4rem] text-neutral-900 leading-8 font-medium">
                    {formatDate(drawerUser.createdAt, locale, "local")}
                  </span>
                </div>
                <div className="flex justify-between py-4 border-b border-neutral-100">
                  <span className="text-[1.4rem] text-neutral-500 leading-8">
                    {t("drawer.status")}
                  </span>
                  <span
                    className={`py-[0.3rem] px-2 rounded-[30px] text-[11px] font-bold uppercase ${
                      drawerUser.invitedAt
                        ? "bg-neutral-100 text-success"
                        : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {drawerUser.invitedAt
                      ? t("status.invited")
                      : t("status.pending")}
                  </span>
                </div>
                {drawerUser.invitedAt && (
                  <div className="flex justify-between py-4 border-b border-neutral-100">
                    <span className="text-[1.4rem] text-neutral-500 leading-8">
                      {t("drawer.invited_at")}
                    </span>
                    <span className="text-[1.4rem] text-neutral-900 leading-8 font-medium">
                      {formatDate(drawerUser.invitedAt, locale, "local")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DrawerFooter className="px-8 pb-8 flex flex-col gap-3">
            <button
              onClick={() =>
                drawerUser && handleInviteOne(drawerUser.waitlistUserId)
              }
              disabled={
                invitingOneId === drawerUser?.waitlistUserId ||
                !!drawerUser?.invitedAt
              }
              className="w-full flex items-center justify-center px-6 py-4 rounded-[3rem] bg-primary-500 text-white text-[1.5rem] font-medium leading-8 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {invitingOneId === drawerUser?.waitlistUserId ? (
                <LoadingCircleSmall />
              ) : drawerUser?.invitedAt ? (
                t("drawer.already_invited")
              ) : (
                t("drawer.invite")
              )}
            </button>
            <DrawerClose asChild>
              <button className="w-full px-6 py-4 rounded-[3rem] border border-neutral-200 text-neutral-700 text-[1.5rem] font-medium leading-8 cursor-pointer">
                {t("drawer.close")}
              </button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
