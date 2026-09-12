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
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ButtonNeutral, ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import formatDate from "@/lib/FormatDate";
import { InviteUsersAction, RemindUsersAction } from "@/actions/Waitlist";
import SearchInput from "@/components/shared/SearchInput";
import PageTitle, { PAGE_SCROLLER } from "@/components/shared/PageTitle";

export type WaitlistEntry = {
  waitlistUserId: string;
  email: string;
  entity: "attendee" | "business" | "both";
  invitedAt: string | null;
  createdAt: string;
  /** Whether an account exists for this address. Resolved by the API per page. */
  hasAccount: boolean;
  remindedAt: string | null;
  reminderCount: number;
};

export type WaitlistStats = {
  total: number;
  invited: number;
  pending: number;
  attendee: number;
  business: number;
  both: number;
  noAccount: number;
};

type Props = {
  users: WaitlistEntry[];
  stats: WaitlistStats;
  accessToken: string;
};

type Tab = "all" | "pending" | "invited" | "no_account";

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
  const [term, setTerm] = useState("");
  const [isInvitingSelected, setIsInvitingSelected] = useState(false);
  const [invitingOneId, setInvitingOneId] = useState<string | null>(null);
  const [isRemindingSelected, setIsRemindingSelected] = useState(false);
  const [remindingOneId, setRemindingOneId] = useState<string | null>(null);
  const [confirmRemindOpen, setConfirmRemindOpen] = useState(false);

  // "All" shows everyone; "Not invited" only those still pending; "Invited"
  // only those already invited; "No account" the people who joined the waitlist
  // and never came back to sign up. The entity Select filters within the
  // active tab.
  const tabUsers =
    tab === "invited"
      ? users.filter((u) => u.invitedAt)
      : tab === "pending"
        ? users.filter((u) => !u.invitedAt)
        : tab === "no_account"
          ? users.filter((u) => !u.hasAccount)
          : users;
  // Email is the only identifying field on an entry, so it is the only thing
  // worth matching on. Narrows within the tab and entity pill rather than
  // replacing them.
  const query = term.trim().toLowerCase();
  const isSearching = query.length > 0;
  const displayedUsers = tabUsers
    .filter((u) => entityFilter === "all" || u.entity === entityFilter)
    .filter((u) => !isSearching || u.email.toLowerCase().includes(query));

  // What the checkboxes are *for* changes with the tab: on "No account" they
  // pick recipients for the reminder, everywhere else they pick people to
  // invite. Only the "Invited" tab has neither (nothing left to re-invite, and
  // signed-up members are not reminder material).
  const mode: "invite" | "remind" = tab === "no_account" ? "remind" : "invite";
  const showSelection = tab !== "invited";
  const isBulkSending = isInvitingSelected || isRemindingSelected;

  // Rows the current mode can actually act on — the rest render a disabled box
  // rather than vanishing, so the list still reads as the whole waitlist.
  const selectableUsers = displayedUsers.filter((u) =>
    mode === "remind" ? !u.hasAccount : !u.invitedAt,
  );

  const allChecked =
    selectableUsers.length > 0 &&
    selectableUsers.every((u) => selectedIds.has(u.waitlistUserId));

  const someChecked = displayedUsers.some((u) =>
    selectedIds.has(u.waitlistUserId),
  );

  function handleTabChange(value: string) {
    setTab(value as Tab);
    setSelectedIds(new Set());
  }

  // Invite and remind both send every id in the set, not just the visible ones,
  // so narrowing the list has to drop the selection — otherwise "select all,
  // then search" silently mails the people the search just hid. Same reason the
  // tabs do it.
  function handleTermChange(value: string) {
    setTerm(value);
    setSelectedIds(new Set());
  }

  function handleEntityFilterChange(value: string) {
    setEntityFilter(value as "all" | "attendee" | "business" | "both");
    setSelectedIds(new Set());
  }

  function toggleSelectAll() {
    if (allChecked) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableUsers.map((u) => u.waitlistUserId)));
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

  /**
   * The API drops anyone who signed up or unsubscribed since this page was
   * rendered, so the toast reports what actually went out rather than echoing
   * how many rows were ticked.
   */
  async function sendReminder(userIds: string[]) {
    const result = await RemindUsersAction({ userIds, accessToken, locale });
    if (!("status" in result)) {
      toast.error(result.error);
      return;
    }
    if (result.skipped > 0) {
      toast.success(
        t("remind.partial", { sent: result.sent, skipped: result.skipped }),
      );
    } else {
      toast.success(t("remind.success"));
    }
    // Pull fresh data so the reminder date and count on each row are current.
    router.refresh();
  }

  async function handleRemindSelected() {
    setConfirmRemindOpen(false);
    setIsRemindingSelected(true);
    try {
      await sendReminder(Array.from(selectedIds));
      setSelectedIds(new Set());
    } catch {
      toast.error(t("remind.error"));
    } finally {
      setIsRemindingSelected(false);
    }
  }

  async function handleRemindOne(userId: string) {
    setRemindingOneId(userId);
    try {
      await sendReminder([userId]);
    } catch {
      toast.error(t("remind.error"));
    } finally {
      setRemindingOneId(null);
    }
  }

  // One source for both tab controls — the desktop pills and the mobile Select
  // have to stay in step, and a second hand-written list is how they drift.
  const tabOptions: { value: Tab; label: string }[] = [
    { value: "all", label: `${t("tabs.all")} (${stats.total})` },
    { value: "pending", label: `${t("tabs.pending")} (${stats.pending})` },
    { value: "invited", label: `${t("tabs.invited")} (${stats.invited})` },
    {
      value: "no_account",
      label: `${t("tabs.no_account")} (${stats.noAccount})`,
    },
  ];

  const statCards = [
    { key: "total", label: t("stats.total"), value: stats.total },
    { key: "pending", label: t("stats.pending"), value: stats.pending },
    {
      key: "no_account",
      label: t("stats.no_account"),
      value: stats.noAccount,
    },
    { key: "attendee", label: t("stats.attendee"), value: stats.attendee },
    { key: "business", label: t("stats.business"), value: stats.business },
    { key: "both", label: t("stats.both"), value: stats.both },
  ];

  return (
    <div className={PAGE_SCROLLER}>
      {/* The heading is the only thing that stays put. It is a direct child of
          the scroller because `sticky` is confined to its parent's box — the
          bulk-send button used to share a wrapper with it, which pinned the
          button too and, on mobile, stuck the pair to a wrapper that scrolled
          away almost immediately. */}
      <PageTitle>{t("title")}</PageTitle>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 divide-x divide-neutral-100 border-neutral-100 border-b">
        {statCards.map((card) => (
          <div
            key={card.key}
            // `max-lg:odd:border-l-0` cancels the divider on the cell that
            // starts each row of the two-column mobile grid — `divide-x` only
            // knows to skip the very first child, not the first of each row.
            className="pl-6 first:pl-0 max-lg:odd:border-l-0 max-lg:odd:pl-0 pb-8 lg:pl-10 lg:first:pl-0 lg:pb-12"
          >
            <span className="text-[14px] text-neutral-600 leading-8 pb-2 block">
              {card.label}
            </span>
            <p className="font-medium text-[1.6rem] lg:text-[25px] leading-12 font-primary">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs + entity filter + the bulk action for the active tab.
          On mobile every control is a full-width pill stacked in one column:
          tab picker, then type, then search. The four tab pills do not fit a
          phone — they scrolled off the right edge with no sign they were there
          — so below `lg` the tabs become a Select shaped like the type filter. */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={tab}
          onValueChange={handleTabChange}
          className="hidden lg:flex"
        >
          <TabsList className="w-fit">
            {tabOptions.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Select value={tab} onValueChange={handleTabChange}>
          <SelectTrigger className="bg-neutral-100 w-full cursor-pointer rounded-[3rem] py-[0.8rem] px-6 border-none lg:hidden text-[1.4rem] text-neutral-700 leading-8">
            <SelectValue placeholder="" />
          </SelectTrigger>
          <SelectContent className="bg-neutral-100 text-[1.4rem]">
            <SelectGroup>
              {tabOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  className="text-[1.4rem] text-deep-100"
                  value={option.value}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        {/* `order-*` is what lets one markup order serve both axes: stacked as
            type / search / action on mobile, and read as action / search /
            count / type across the desktop row. */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 w-full lg:w-auto">
          <Select value={entityFilter} onValueChange={handleEntityFilterChange}>
            <SelectTrigger className="order-1 lg:order-4 bg-neutral-100 w-full cursor-pointer rounded-[3rem] py-[0.8rem] px-6 border-none lg:w-fit text-[1.4rem] text-neutral-700 leading-8">
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

          <SearchInput
            className="order-2"
            value={term}
            onChange={handleTermChange}
            placeholder={t("filters.search")}
          />

          {showSelection && someChecked && (
            <span className="order-4 lg:order-3 text-[1.4rem] text-neutral-500 font-normal hidden lg:inline">
              {selectedIds.size} {t("list.selected")}
            </span>
          )}

          {showSelection && selectedIds.size > 0 && (
            <button
              onClick={
                mode === "remind"
                  ? () => setConfirmRemindOpen(true)
                  : handleInviteSelected
              }
              disabled={isBulkSending}
              className="order-3 lg:order-1 flex items-center justify-center gap-2 px-6 py-[0.8rem] rounded-[3rem] bg-primary-500 text-white text-[1.4rem] leading-8 font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              {isBulkSending ? (
                <LoadingCircleSmall />
              ) : mode === "remind" ? (
                t("remind.selected", { count: selectedIds.size })
              ) : (
                t("invite.selected", { count: selectedIds.size })
              )}
            </button>
          )}
        </div>
      </div>

      {/* A bulk send is one click away from every address on the list, and it
          cannot be recalled — so it asks first. The single-row send in the
          drawer does not: that one is deliberate by construction. */}
      <Dialog open={confirmRemindOpen} onOpenChange={setConfirmRemindOpen}>
        <DialogContent>
          <DialogTitle className="font-primary font-medium text-[2rem] leading-10 text-black">
            {t("remind.confirm_title")}
          </DialogTitle>
          <p className="text-[1.4rem] leading-8 text-neutral-600">
            {t("remind.confirm_body", { count: selectedIds.size })}
          </p>
          <DialogFooter className="flex gap-6 pt-8">
            <DialogClose asChild>
              <ButtonNeutral className="flex-1">
                {t("remind.cancel")}
              </ButtonNeutral>
            </DialogClose>
            <ButtonPrimary
              className="flex-1"
              disabled={isRemindingSelected}
              onClick={handleRemindSelected}
            >
              {isRemindingSelected ? (
                <LoadingCircleSmall />
              ) : (
                t("remind.confirm_cta")
              )}
            </ButtonPrimary>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table. `shrink-0` is load-bearing: without it the table's own
          overflow wrapper collapses to the leftover height and scrolls by
          itself, leaving the title, stats and filters pinned above it. See the
          note on the Table component. */}
      <Table containerClassName="shrink-0">
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
            <TableHead className="font-bold hidden lg:table-cell text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
              {t("list.table.account")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedUsers.map((user) => {
            const isSelectable =
              mode === "remind" ? !user.hasAccount : !user.invitedAt;
            return (
              <TableRow key={user.waitlistUserId}>
                {showSelection && (
                  <TableCell
                    onClick={(e) =>
                      isSelectable && toggleSelect(user.waitlistUserId, e)
                    }
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(user.waitlistUserId)}
                      disabled={!isSelectable}
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
                      className={
                        "w-xl lg:w-208 bg-white my-6 p-12 rounded-[30px]"
                      }
                    >
                      <div
                        className={
                          "w-full flex flex-col items-center overflow-y-scroll"
                        }
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
                                className={
                                  "text-deep-100 font-medium leading-8"
                                }
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
                                className={
                                  "text-deep-100 font-medium leading-8"
                                }
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
                                  className={
                                    "text-deep-100 font-medium leading-8"
                                  }
                                >
                                  {formatDate(user.invitedAt, locale, "local")}
                                </span>
                              </span>
                            )}
                            <span
                              className={
                                "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                              }
                            >
                              {t("drawer.account")}
                              <AccountBadge
                                hasAccount={user.hasAccount}
                                yes={t("drawer.has_account")}
                                no={t("drawer.no_account")}
                              />
                            </span>
                            {user.reminderCount > 0 && (
                              <span
                                className={
                                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                                }
                              >
                                {t("drawer.reminder_count")}
                                <span
                                  className={
                                    "text-deep-100 font-medium leading-8"
                                  }
                                >
                                  {user.reminderCount}
                                </span>
                              </span>
                            )}
                            {user.remindedAt && (
                              <span
                                className={
                                  "flex justify-between items-center text-[1.4rem] leading-8 text-neutral-600"
                                }
                              >
                                {t("drawer.reminded_at")}
                                <span
                                  className={
                                    "text-deep-100 font-medium leading-8"
                                  }
                                >
                                  {formatDate(user.remindedAt, locale, "local")}
                                </span>
                              </span>
                            )}
                          </span>
                        </DrawerDescription>
                      </div>
                      <DrawerFooter>
                        <div className={"flex flex-col gap-6 w-full"}>
                          {/* Reminding somebody who already has an account is
                              the one thing this mail must never do, so the
                              button is not offered for them at all. */}
                          {!user.hasAccount && (
                            <button
                              onClick={() =>
                                handleRemindOne(user.waitlistUserId)
                              }
                              disabled={remindingOneId === user.waitlistUserId}
                              className={
                                "w-full border-primary-500 bg-primary-50 text-primary-500 px-12 py-6 border-2 rounded-[100px] text-center font-medium text-[1.5rem] h-auto leading-8 cursor-pointer transition-all duration-400 flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
                              }
                            >
                              {remindingOneId === user.waitlistUserId ? (
                                <LoadingCircleSmall />
                              ) : user.reminderCount > 0 ? (
                                t("drawer.remind_again")
                              ) : (
                                t("drawer.remind")
                              )}
                            </button>
                          )}
                          <div className={"flex gap-8 w-full items-center"}>
                            <button
                              onClick={() =>
                                handleInviteOne(user.waitlistUserId)
                              }
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
                <TableCell className="hidden lg:table-cell py-6">
                  <AccountBadge
                    hasAccount={user.hasAccount}
                    yes={t("status.has_account")}
                    no={t("status.no_account")}
                  />
                </TableCell>
              </TableRow>
            );
          })}
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
            {isSearching
              ? t("no_results")
              : tab === "no_account"
                ? t("no_account_empty")
                : t("list.empty")}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Signed-up / not-signed-up chip. Amber rather than red for the negative case:
 * a waitlist member without an account is the person this page exists to go
 * after, not an error state.
 */
function AccountBadge({
  hasAccount,
  yes,
  no,
}: {
  hasAccount: boolean;
  yes: string;
  no: string;
}) {
  return (
    <span
      className={`py-[0.3rem] px-2 rounded-[30px] text-[11px] font-bold uppercase whitespace-nowrap ${
        hasAccount
          ? "bg-neutral-100 text-success"
          : "bg-orange-50 text-orange-600"
      }`}
    >
      {hasAccount ? yes : no}
    </span>
  );
}
