"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Note } from "iconsax-reactjs";
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
} from "@/components/ui/drawer";
import { ButtonNeutral, ButtonPrimary } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { PAGE_SCROLLER } from "@/components/shared/PageTitle";
import SettingsHeader from "@/components/shared/SettingsHeader";
import FilterPill from "@/components/shared/FilterPill";
import SearchField from "@/components/shared/SearchField";
import TablePagination from "@/components/shared/TablePagination";
import { Reveal } from "@/components/shared/motion";
import {
  Badge,
  EmptyState,
  HEADER_PILL,
  PILL_TONE,
  RowMore,
  TABLE_CELL,
  TABLE_HEAD,
  TABLE_ROW,
  TableFrame,
  type BadgeTone,
} from "@/components/shared/DataTable";
import formatDate from "@/lib/FormatDate";
import { cn } from "@/lib/utils";
import { InviteUsersAction, RemindUsersAction } from "@/actions/Waitlist";
import { Metric } from "../analytics/parts";

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
type Entity = "all" | "attendee" | "business" | "both";

const PER_PAGE = 25;

const ENTITY_TONE: Record<WaitlistEntry["entity"], BadgeTone> = {
  attendee: "neutral",
  business: "primary",
  both: "warning",
};

/**
 * Settings → Waitlist. The whole list comes in one go (see page.tsx) and is
 * filtered here: a status pill (All / Not invited / Invited / No account), a
 * type pill and an email search, 25 rows a page. Ticked rows are invited — or,
 * on "No account", reminded — from the header; a row opens its drawer.
 */
export default function WaitlistPageContent({ users, stats, accessToken }: Props) {
  const t = useTranslations("Waitlist");
  const locale = useLocale();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("all");
  const [entityFilter, setEntityFilter] = useState<Entity>("all");
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "invite_selected" | "remind_selected" | "invite_one" | "remind_one">(
    null,
  );
  const [confirmRemindOpen, setConfirmRemindOpen] = useState(false);

  // "All" shows everyone; "Not invited" only those still pending; "Invited"
  // only those already invited; "No account" the people who joined the waitlist
  // and never came back to sign up. The type pill and search narrow within it.
  const tabUsers =
    tab === "invited"
      ? users.filter((u) => u.invitedAt)
      : tab === "pending"
        ? users.filter((u) => !u.invitedAt)
        : tab === "no_account"
          ? users.filter((u) => !u.hasAccount)
          : users;
  // Email is the only identifying field on an entry.
  const query = term.trim().toLowerCase();
  const isFiltering = query.length > 0 || entityFilter !== "all";
  const displayedUsers = tabUsers
    .filter((u) => entityFilter === "all" || u.entity === entityFilter)
    .filter((u) => !query || u.email.toLowerCase().includes(query));
  const pageCount = Math.max(1, Math.ceil(displayedUsers.length / PER_PAGE));
  const currentPage = Math.min(page, pageCount);
  const pageUsers = displayedUsers.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  // What the checkboxes are *for* changes with the tab: on "No account" they
  // pick recipients for the reminder, everywhere else people to invite. The
  // "Invited" tab has neither (nothing left to re-invite, and signed-up
  // members are not reminder material).
  const mode: "invite" | "remind" = tab === "no_account" ? "remind" : "invite";
  const showSelection = tab !== "invited";
  const canSelect = (u: WaitlistEntry) => (mode === "remind" ? !u.hasAccount : !u.invitedAt);

  // The header box ticks the rows ON THIS PAGE only: a bulk send must never
  // reach an address the admin has not had in front of them.
  const selectablePage = pageUsers.filter(canSelect);
  const allChecked =
    selectablePage.length > 0 && selectablePage.every((u) => selectedIds.has(u.waitlistUserId));

  const openUser = users.find((u) => u.waitlistUserId === openId) ?? null;

  // Invite and remind send every id in the set, so narrowing the list drops
  // the selection — otherwise "select all, then search" would mail the people
  // the search just hid.
  function narrow(apply: () => void) {
    apply();
    setPage(1);
    setSelectedIds(new Set());
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const u of selectablePage) {
        if (allChecked) next.delete(u.waitlistUserId);
        else next.add(u.waitlistUserId);
      }
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function invite(userIds: string[], action: "invite_selected" | "invite_one") {
    setBusy(action);
    try {
      const result = await InviteUsersAction({ userIds, accessToken, locale });
      if ("status" in result) {
        toast.success(t("invite.success"));
        if (action === "invite_selected") setSelectedIds(new Set());
        // Fresh data so newly-invited rows move to the Invited tab.
        router.refresh();
      } else toast.error(result.error);
    } catch {
      toast.error(t("invite.error"));
    } finally {
      setBusy(null);
    }
  }

  /**
   * The API drops anyone who signed up or unsubscribed since this page was
   * rendered, so the toast reports what actually went out rather than echoing
   * how many rows were ticked.
   */
  async function remind(userIds: string[], action: "remind_selected" | "remind_one") {
    setConfirmRemindOpen(false);
    setBusy(action);
    try {
      const result = await RemindUsersAction({ userIds, accessToken, locale });
      if (!("status" in result)) {
        toast.error(result.error);
        return;
      }
      toast.success(
        result.skipped > 0
          ? t("remind.partial", { sent: result.sent, skipped: result.skipped })
          : t("remind.success"),
      );
      if (action === "remind_selected") setSelectedIds(new Set());
      router.refresh();
    } catch {
      toast.error(t("remind.error"));
    } finally {
      setBusy(null);
    }
  }

  const tiles = [
    { key: "total", value: stats.total },
    { key: "pending", value: stats.pending },
    { key: "no_account", value: stats.noAccount },
    { key: "attendee", value: stats.attendee },
    { key: "business", value: stats.business },
    { key: "both", value: stats.both },
  ];

  const bulkAction =
    showSelection && selectedIds.size > 0 ? (
      <button
        type="button"
        onClick={
          mode === "remind"
            ? () => setConfirmRemindOpen(true)
            : () => invite(Array.from(selectedIds), "invite_selected")
        }
        disabled={busy !== null}
        className={cn(HEADER_PILL, PILL_TONE.primary)}
      >
        {busy === "invite_selected" || busy === "remind_selected" ? (
          <LoadingCircleSmall />
        ) : mode === "remind" ? (
          t("remind.selected", { count: selectedIds.size })
        ) : (
          t("invite.selected", { count: selectedIds.size })
        )}
      </button>
    ) : undefined;

  const row = (label: string, value: React.ReactNode) => (
    <p className="flex justify-between items-center gap-8 text-[1.4rem] leading-8 text-neutral-600">
      <span className="shrink-0">{label}</span>
      <span className="text-deep-100 font-medium text-right min-w-0 break-words">{value}</span>
    </p>
  );

  return (
    <div className={cn(PAGE_SCROLLER, "gap-0")}>
      <SettingsHeader title={t("title")} actions={bulkAction} />

      <Reveal className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 border-b border-neutral-100">
        {tiles.map((tile, i) => (
          <div
            key={tile.key}
            className={cn(
              "py-6 pr-6 border-neutral-100",
              // A rule before every tile that does not start a row.
              i % 2 === 1 && "max-sm:pl-6 max-sm:border-l",
              i % 3 !== 0 && "sm:max-xl:pl-6 sm:max-xl:border-l",
              i > 0 && "xl:pl-6 xl:border-l",
            )}
          >
            <Metric label={t(`stats.${tile.key}`)}>{tile.value.toLocaleString(locale)}</Metric>
          </div>
        ))}
      </Reveal>

      <Reveal delay={0.05} className="flex flex-col gap-6 pt-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <h4 className="font-primary font-medium text-[1.8rem] leading-10 text-black">
            {t("list.title")}
          </h4>
          <div className="flex flex-wrap items-center gap-4">
            <FilterPill
              label={t("filters.status_label")}
              value={tab}
              defaultValue="all"
              options={[
                { value: "all", label: `${t("tabs.all")} (${stats.total})` },
                { value: "pending", label: `${t("tabs.pending")} (${stats.pending})` },
                { value: "invited", label: `${t("tabs.invited")} (${stats.invited})` },
                { value: "no_account", label: `${t("tabs.no_account")} (${stats.noAccount})` },
              ]}
              onChange={(v) => narrow(() => setTab(v as Tab))}
            />
            <FilterPill
              label={t("filters.type_label")}
              value={entityFilter}
              defaultValue="all"
              options={(["all", "attendee", "business", "both"] as const).map((e) => ({
                value: e,
                label: t(`filters.${e}`),
              }))}
              onChange={(v) => narrow(() => setEntityFilter(v as Entity))}
            />
            <SearchField
              value={term}
              onChange={(v) => narrow(() => setTerm(v))}
              placeholder={t("filters.search")}
              className="flex w-full lg:w-[26rem]"
            />
          </div>
        </div>

        <TableFrame minWidth="76rem">
          <thead>
            <tr className="border-b border-neutral-100">
              {showSelection && (
                <th className={cn(TABLE_HEAD, "w-12")}>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    disabled={selectablePage.length === 0}
                    onChange={toggleSelectAll}
                    aria-label={t("list.select_page")}
                    className="w-5 h-5 accent-primary-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                  />
                </th>
              )}
              <th className={TABLE_HEAD}>{t("list.table.email")}</th>
              <th className={TABLE_HEAD}>{t("list.table.entity")}</th>
              <th className={TABLE_HEAD}>{t("list.table.joined")}</th>
              <th className={TABLE_HEAD}>{t("list.table.status")}</th>
              <th className={TABLE_HEAD}>{t("list.table.account")}</th>
              <th className={TABLE_HEAD}>
                <span className="sr-only">{t("list.table.actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {pageUsers.map((user) => {
              const selectable = canSelect(user);
              return (
                <tr
                  key={user.waitlistUserId}
                  className={TABLE_ROW}
                  onClick={() => setOpenId(user.waitlistUserId)}
                >
                  {showSelection && (
                    <td className="py-6 pr-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(user.waitlistUserId)}
                        disabled={!selectable}
                        onChange={() => toggleSelect(user.waitlistUserId)}
                        aria-label={user.email}
                        className="w-5 h-5 accent-primary-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                      />
                    </td>
                  )}
                  <td className={cn(TABLE_CELL, "font-medium")}>
                    <span className="block max-w-[32rem] truncate" title={user.email}>
                      {user.email}
                    </span>
                  </td>
                  <td className="py-6 pr-4">
                    <Badge tone={ENTITY_TONE[user.entity]}>{t(`filters.${user.entity}`)}</Badge>
                  </td>
                  <td className={cn(TABLE_CELL, "whitespace-nowrap")}>
                    {formatDate(user.createdAt, locale, "local")}
                  </td>
                  <td className="py-6 pr-4">
                    <Badge tone={user.invitedAt ? "success" : "neutral"}>
                      {user.invitedAt ? t("status.invited") : t("status.pending")}
                    </Badge>
                  </td>
                  <td className="py-6 pr-4">
                    <AccountBadge
                      hasAccount={user.hasAccount}
                      yes={t("status.has_account")}
                      no={t("status.no_account")}
                    />
                  </td>
                  <td className="py-6 text-right">
                    <RowMore />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableFrame>

        {displayedUsers.length === 0 && (
          <EmptyState
            Icon={Note}
            filtered={isFiltering}
            text={
              isFiltering
                ? t("no_results")
                : tab === "no_account"
                  ? t("no_account_empty")
                  : t("list.empty")
            }
          />
        )}

        {pageCount > 1 && (
          <TablePagination
            page={currentPage}
            count={pageCount}
            onChange={setPage}
            prevLabel={t("list.prev")}
            nextLabel={t("list.next")}
          />
        )}
      </Reveal>

      {/* A bulk send is one click away from every ticked address, and it
          cannot be recalled — so it asks first. The single send in the drawer
          does not: that one is deliberate by construction. */}
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
              <ButtonNeutral className="flex-1">{t("remind.cancel")}</ButtonNeutral>
            </DialogClose>
            <ButtonPrimary
              className="flex-1"
              disabled={busy !== null}
              onClick={() => remind(Array.from(selectedIds), "remind_selected")}
            >
              {busy === "remind_selected" ? <LoadingCircleSmall /> : t("remind.confirm_cta")}
            </ButtonPrimary>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Drawer
        direction="right"
        open={openUser !== null}
        onOpenChange={(open) => !open && setOpenId(null)}
      >
        {openUser && (
          <DrawerContent className="my-8 p-12 rounded-[30px] w-full">
            <div className="w-full flex flex-col items-center overflow-y-auto">
              <DrawerTitle className="pb-12 max-w-full">
                <span className="block font-primary font-medium text-center text-[2.6rem] leading-12 text-black break-words">
                  {t("drawer.title")}
                </span>
              </DrawerTitle>
              <DrawerDescription asChild className="w-full">
                <div className="flex flex-col gap-6">
                  {row(t("drawer.email"), openUser.email)}
                  {row(
                    t("drawer.entity"),
                    <Badge tone={ENTITY_TONE[openUser.entity]}>
                      {t(`filters.${openUser.entity}`)}
                    </Badge>,
                  )}
                  {row(t("drawer.joined"), formatDate(openUser.createdAt, locale, "local"))}
                  <div className="h-[2px] w-full bg-neutral-100" />
                  {row(
                    t("drawer.status"),
                    <Badge tone={openUser.invitedAt ? "success" : "neutral"}>
                      {openUser.invitedAt ? t("status.invited") : t("status.pending")}
                    </Badge>,
                  )}
                  {openUser.invitedAt &&
                    row(t("drawer.invited_at"), formatDate(openUser.invitedAt, locale, "local"))}
                  {row(
                    t("drawer.account"),
                    <AccountBadge
                      hasAccount={openUser.hasAccount}
                      yes={t("drawer.has_account")}
                      no={t("drawer.no_account")}
                    />,
                  )}
                  {openUser.reminderCount > 0 &&
                    row(t("drawer.reminder_count"), openUser.reminderCount)}
                  {openUser.remindedAt &&
                    row(t("drawer.reminded_at"), formatDate(openUser.remindedAt, locale, "local"))}
                </div>
              </DrawerDescription>
            </div>
            <DrawerFooter>
              <div className="flex flex-col gap-4 w-full">
                {/* Reminding somebody who already has an account is the one
                    thing this mail must never do, so it is not offered. */}
                {!openUser.hasAccount && (
                  <button
                    type="button"
                    onClick={() => remind([openUser.waitlistUserId], "remind_one")}
                    disabled={busy !== null}
                    className={cn(HEADER_PILL, PILL_TONE.neutral, "w-full lg:w-full h-[4.8rem]")}
                  >
                    {busy === "remind_one" ? (
                      <LoadingCircleSmall />
                    ) : openUser.reminderCount > 0 ? (
                      t("drawer.remind_again")
                    ) : (
                      t("drawer.remind")
                    )}
                  </button>
                )}
                <div className="flex gap-4 w-full">
                  <DrawerClose asChild>
                    <button
                      type="button"
                      className={cn(HEADER_PILL, PILL_TONE.neutral, "flex-1 lg:flex-1 h-[4.8rem]")}
                    >
                      {t("drawer.close")}
                    </button>
                  </DrawerClose>
                  <button
                    type="button"
                    onClick={() => invite([openUser.waitlistUserId], "invite_one")}
                    disabled={busy !== null || Boolean(openUser.invitedAt)}
                    className={cn(HEADER_PILL, PILL_TONE.primary, "flex-1 lg:flex-1 h-[4.8rem]")}
                  >
                    {busy === "invite_one" ? (
                      <LoadingCircleSmall />
                    ) : openUser.invitedAt ? (
                      t("drawer.already_invited")
                    ) : (
                      t("drawer.invite")
                    )}
                  </button>
                </div>
              </div>
            </DrawerFooter>
          </DrawerContent>
        )}
      </Drawer>
    </div>
  );
}

/**
 * Signed-up / not-signed-up chip. Amber rather than red for the negative case:
 * a waitlist member without an account is the person this page exists to go
 * after, not an error state.
 */
function AccountBadge({ hasAccount, yes, no }: { hasAccount: boolean; yes: string; no: string }) {
  return <Badge tone={hasAccount ? "success" : "warning"}>{hasAccount ? yes : no}</Badge>;
}
