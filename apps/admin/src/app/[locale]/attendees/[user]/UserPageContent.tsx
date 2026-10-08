"use client";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { MoreCircle } from "iconsax-reactjs";
import AdminLayout from "@/components/Layouts/AdminLayout";
import BackButton from "@/components/shared/BackButton";
import { PAGE_SCROLLER } from "@/components/shared/PageTitle";
import Separator from "@/components/shared/Separator";
import FilterPill from "@/components/shared/FilterPill";
import SearchField from "@/components/shared/SearchField";
import TablePagination from "@/components/shared/TablePagination";
import SuspensionNotice from "@/components/shared/SuspensionNotice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Drawer, DrawerTrigger } from "@/components/ui/drawer";
import { useRouter } from "@/i18n/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import formatDate from "@/lib/FormatDate";
import { cn } from "@/lib/utils";
import { formatMoney } from "@ticketwaze/currency";
import { AdminUser, Ticket } from "@ticketwaze/typescript-config";
import Informations from "./Informations";
import ProfileActions from "./ProfileActions";
import { PersonalInformation, ProfileCard, type ProfileFields } from "./ProfileDetails";
import { analyticsStart } from "./periodStart";
import { PERIODS, type Period } from "../../analytics/periods";

/**
 * A ticket's price in its own activity's currency. Tickets carry both columns,
 * so reading the HTG one and labelling it with the activity's currency
 * misreported every ticket sold in USD. Read off the normalized `activity` —
 * `ticket.event` is null for a raffle entry.
 */
export function formatTicketPrice(ticket: Ticket, locale: string): string {
  const currency = ticket.activity?.currency ?? "HTG";
  return formatMoney(
    currency === "USD" ? ticket.ticketUsdPrice : ticket.ticketPrice,
    currency,
    locale,
  );
}

export type AttendeeSummary = {
  eventCount: number;
  ticketsBought: number;
  eventsMissed: number;
  totalSpent: { htg: number; usd: number };
};

const USERNAME_PATTERN = /^@?[a-zA-Z0-9_.]{3,30}$/;

function fieldsOf(user: AdminUser): ProfileFields {
  const u = user as AdminUser & { username?: string | null; address?: string | null };
  return {
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    username: u.username ?? "",
    address: u.address ?? "",
    country: user.country || "",
    state: user.state ?? "",
    city: user.city ?? "",
    dateOfBirth: user.dateOfBirth ? String(user.dateOfBirth).slice(0, 10) : "",
    gender: user.gender ?? "",
  };
}

/**
 * Figma "Admin" → Attendee → User Profile (4227:68377 summary, 4227:68704
 * ticket history, 4229:69669 ticket details): Suspend account / Edit profile
 * in the header, the orange identity card, Personal Information (editable on
 * Edit), and the Activity Summary / Ticket History tabs. The suspension and
 * deletion notices, and wallet credit (⋯), are kept from before.
 */
export default function UserPageContent({
  user,
  summary,
}: {
  user: AdminUser | null;
  summary: AttendeeSummary | null;
}) {
  const t = useTranslations("Attendees.profile");
  const router = useRouter();
  const { data: session } = useSession();
  const { can } = usePermissions();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(() => (user ? fieldsOf(user) : null));
  const [draft, setDraft] = useState(saved);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFields, string>>>({});

  if (!user || !saved || !draft) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-[1.6rem] text-neutral-600">{t("not_found")}</p>
        </div>
      </AdminLayout>
    );
  }

  async function save() {
    if (!draft || !user) return;
    const found: typeof errors = {};
    if (draft.firstName.trim().length < 2) found.firstName = t("errors.name");
    if (draft.lastName.trim().length < 2) found.lastName = t("errors.name");
    if (draft.username.trim() && !USERNAME_PATTERN.test(draft.username.trim()))
      found.username = t("errors.username");
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/attendees/${user.userId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user.accessToken}`,
        },
        body: JSON.stringify({
          firstName: draft.firstName.trim(),
          lastName: draft.lastName.trim(),
          username: draft.username.trim() || null,
          address: draft.address.trim() || null,
          country: draft.country || null,
          state: draft.state || null,
          city: draft.city || null,
          dateOfBirth: draft.dateOfBirth || null,
          gender: draft.gender || null,
        }),
      },
    ).catch(() => null);
    const data = await response?.json().catch(() => null);
    setSaving(false);
    if (data?.status === "success") {
      setSaved(draft);
      setEditing(false);
      toast.success(t("edit.saved"));
      router.refresh();
    } else if (data?.code === "USERNAME_TAKEN") {
      setErrors({ username: t("errors.username_taken") });
    } else {
      toast.error(t("edit.failed"));
    }
  }

  return (
    <AdminLayout>
      <div className={PAGE_SCROLLER}>
        <BackButton text={t("back")} />
        <div className="sticky top-0 z-20 bg-white pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <h2 className="font-medium font-primary text-[2.6rem] leading-12 text-black">
            {t("title")}
          </h2>
          <ProfileActions
            userId={user.userId}
            isSuspended={user.isSuspended}
            editing={editing}
            saving={saving}
            onEdit={() => setEditing(true)}
            onCancel={() => {
              setDraft(saved);
              setErrors({});
              setEditing(false);
            }}
            onSave={save}
          />
        </div>
        {user.suspension && <SuspensionNotice suspension={user.suspension} />}
        {user.deletion && <DeletionNotice deletion={user.deletion} />}

        <div className="w-full grid grid-cols-1 lg:grid-cols-[15fr_21fr] gap-8 lg:gap-16">
          <div className="w-full min-w-0 flex flex-col gap-12 pb-4">
            <ProfileCard
              userId={user.userId}
              name={`${saved.firstName} ${saved.lastName}`}
              imageUrl={user.profileImageUrl ?? null}
              canEdit={can("attendees.edit")}
            />
            <PersonalInformation
              email={user.email}
              value={draft}
              onChange={(next) => {
                setDraft(next);
                setErrors({});
              }}
              editing={editing}
              errors={errors}
            />
          </div>

          <div className="min-w-0 lg:min-h-[75vh]">
            <Tabs defaultValue="summary" className="w-full h-full">
              <TabsList className="w-full min-w-0 lg:w-fit mx-auto lg:mx-0 mb-8">
                <TabsTrigger value="summary" className="whitespace-normal lg:whitespace-nowrap">
                  {t("summary.title")}
                </TabsTrigger>
                <TabsTrigger value="ticket_history" className="whitespace-normal lg:whitespace-nowrap">
                  {t("ticket_history.title")}
                </TabsTrigger>
              </TabsList>
              <ActivitySummary summary={summary} createdAt={user.createdAt} deletion={user.deletion} />
              <TicketHistory tickets={user.tickets ?? []} />
            </Tabs>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

type AccountDeletion = NonNullable<AdminUser["deletion"]>;

/**
 * The pending-deletion callout. Amber rather than red: nothing has been lost
 * yet, and logging in still cancels it — but the date is fixed and the outcome
 * is irreversible, so it states both plainly.
 */
function DeletionNotice({ deletion }: { deletion: AccountDeletion }) {
  const t = useTranslations("Attendees.profile.deletion");
  const locale = useLocale();
  return (
    <div className="flex flex-col gap-2 rounded-[15px] border border-[#EA961C]/30 bg-[#FEF6E7] p-6">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-[1.4rem] font-medium text-warning">{t("title")}</span>
        <span className="text-[1.1rem] font-bold uppercase text-warning bg-white/70 rounded-[30px] py-[0.3rem] px-3">
          {t("countdown", { days: deletion.daysLeft })}
        </span>
      </div>
      <p className="text-[1.4rem] leading-8 text-neutral-700">
        {t("body", { date: formatDate(deletion.scheduledFor, locale, "local") })}
      </p>
      {deletion.reason && (
        <p className="text-[1.4rem] leading-8 text-neutral-700">
          <span className="text-neutral-600">{t("reason")}: </span>
          {deletion.reason}
        </p>
      )}
    </div>
  );
}

function SummaryRow({ label, children, tone }: { label: string; children: React.ReactNode; tone?: string }) {
  return (
    <li className="flex justify-between gap-8">
      <span className="text-[1.5rem] text-neutral-600 leading-8 shrink-0">{label}</span>
      <span className={cn("text-[1.5rem] text-deep-100 font-medium leading-8 text-right", tone)}>
        {children}
      </span>
    </li>
  );
}

/** Figma "Activity Summary": counts, total spent (HTG, USD under it), joined on. */
function ActivitySummary({
  summary,
  createdAt,
  deletion,
}: {
  summary: AttendeeSummary | null;
  createdAt: string;
  deletion?: AccountDeletion | null;
}) {
  const t = useTranslations("Attendees.profile");
  const locale = useLocale();
  return (
    <TabsContent value="summary">
      <ul className="flex flex-col pt-4 gap-8">
        <SummaryRow label={t("summary.count")}>{summary?.eventCount ?? 0}</SummaryRow>
        <SummaryRow label={t("summary.total_ticket_bought")}>{summary?.ticketsBought ?? 0}</SummaryRow>
        <SummaryRow label={t("summary.missed")}>{summary?.eventsMissed ?? 0}</SummaryRow>
        <SummaryRow label={t("summary.total_spent")}>
          {formatMoney(summary?.totalSpent.htg ?? 0, "HTG", locale)}
          <span className="block text-[1.2rem] font-normal text-neutral-500">
            {formatMoney(summary?.totalSpent.usd ?? 0, "USD", locale)}
          </span>
        </SummaryRow>
        <Separator />
        <SummaryRow label={t("summary.joined_on")}>{formatDate(createdAt, locale, "local")}</SummaryRow>
        {/* Repeated from the banner on purpose: the banner is the alert, these
            are the record. */}
        {deletion && (
          <>
            <Separator />
            <SummaryRow label={t("deletion.requested_on")}>
              {formatDate(deletion.requestedAt, locale, "local")}
            </SummaryRow>
            <SummaryRow label={t("deletion.scheduled_for")} tone="text-warning">
              {formatDate(deletion.scheduledFor, locale, "local")}
            </SummaryRow>
            <SummaryRow label={t("deletion.reason")}>{deletion.reason || t("deletion.no_reason")}</SummaryRow>
          </>
        )}
      </ul>
    </TabsContent>
  );
}

const CLASS_TONES = ["text-[#EF1870]", "text-[#7B2FF7]", "text-deep-100"];
const PAGE_SIZE = 8;

/**
 * Figma "Ticket History": status / time / event search, then Event name,
 * Ticket class, Amount paid, Check-in status, Purchase date and a ⋯ that opens
 * the Ticket Details panel (also opened by clicking the row).
 */
function TicketHistory({ tickets }: { tickets: Ticket[] }) {
  const t = useTranslations("Attendees.profile.ticket_history");
  const tPeriods = useTranslations("Analytics.filters.periods");
  const locale = useLocale();
  const [status, setStatus] = useState("all");
  const [period, setPeriod] = useState<Period>("all");
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);

  const classes = useMemo(
    () => [...new Set(tickets.map((ticket) => ticket.ticketType))],
    [tickets],
  );

  const filtered = useMemo(() => {
    const from = analyticsStart(period);
    const needle = term.trim().toLowerCase();
    return tickets
      .filter((ticket) => {
        if (status === "checked" && ticket.status !== "CHECKED") return false;
        if (status === "pending" && ticket.status !== "PENDING") return false;
        if (status === "returned" && ticket.status !== "RETURNED") return false;
        if (from && new Date(ticket.createdAt as unknown as string) < from) return false;
        if (needle && !(ticket.activity?.name ?? "").toLowerCase().includes(needle)) return false;
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt as unknown as string).getTime() -
          new Date(a.createdAt as unknown as string).getTime(),
      );
  }, [tickets, status, period, term]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const head = "font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase text-left";

  return (
    <TabsContent value="ticket_history" className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-end gap-4">
        <FilterPill
          label={t("filters.status_label")}
          value={status}
          defaultValue="all"
          options={[
            { value: "all", label: t("filters.status") },
            { value: "checked", label: t("status.checked") },
            { value: "pending", label: t("status.pending") },
            { value: "returned", label: t("status.returned") },
          ]}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
        <FilterPill
          label={t("filters.period_label")}
          value={period}
          defaultValue="all"
          placeholder={t("filters.period")}
          options={PERIODS.map((p) => ({ value: p, label: tPeriods(p) }))}
          onChange={(v) => {
            setPeriod(v as Period);
            setPage(1);
          }}
        />
        <SearchField
          value={term}
          onChange={(v) => {
            setTerm(v);
            setPage(1);
          }}
          placeholder={t("filters.search")}
          className="flex w-full sm:w-[22rem]"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[60rem] border-collapse">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className={head}>{t("table.name")}</th>
              <th className={head}>{t("table.class")}</th>
              <th className={head}>{t("table.amount")}</th>
              <th className={head}>{t("table.status")}</th>
              <th className={head}>{t("table.purchase")}</th>
              <th className={head}>
                <span className="sr-only">{t("table.details")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((ticket) => (
              <Drawer key={ticket.ticketId} direction="right">
                <DrawerTrigger asChild>
                  <tr className="border-b border-neutral-100 cursor-pointer hover:bg-neutral-50 transition-colors">
                    <td className="py-5 pr-4 text-[1.5rem] leading-8 text-deep-100">
                      <span className="block max-w-[18rem] truncate" title={ticket.activity?.name}>
                        {ticket.activity?.name ?? "—"}
                      </span>
                    </td>
                    <td className="py-5 pr-4">
                      <span
                        className={cn(
                          "py-[0.3rem] px-3 rounded-[30px] bg-neutral-100 text-[1.1rem] font-bold uppercase whitespace-nowrap",
                          CLASS_TONES[Math.max(0, classes.indexOf(ticket.ticketType)) % CLASS_TONES.length],
                        )}
                      >
                        {ticket.ticketType}
                      </span>
                    </td>
                    <td className="py-5 pr-4 text-[1.5rem] leading-8 text-deep-100 whitespace-nowrap">
                      {formatTicketPrice(ticket, locale)}
                    </td>
                    <td className="py-5 pr-4">
                      <span
                        className={cn(
                          "py-[0.3rem] px-3 rounded-[30px] text-[1.1rem] font-bold uppercase whitespace-nowrap",
                          ticket.status === "CHECKED"
                            ? "bg-success/10 text-success"
                            : ticket.status === "RETURNED"
                              ? "bg-failure/10 text-failure"
                              : "bg-warning/15 text-[#C98A00]",
                        )}
                      >
                        {ticket.status === "CHECKED"
                          ? t("status.checked")
                          : ticket.status === "RETURNED"
                            ? t("status.returned")
                            : t("status.pending")}
                      </span>
                    </td>
                    <td className="py-5 pr-4 text-[1.5rem] leading-8 text-deep-100 whitespace-nowrap">
                      {formatDate(ticket.createdAt as unknown as string, locale, "local")}
                    </td>
                    <td className="py-5 text-right">
                      <span className="relative w-[2rem] h-[2rem] shrink-0 rounded-full bg-neutral-100 inline-flex items-center justify-center after:absolute after:-inset-[0.8rem] after:content-['']">
                        <MoreCircle size="10" variant="Bulk" color="#737C8A" />
                      </span>
                    </td>
                  </tr>
                </DrawerTrigger>
                <Informations ticket={ticket} />
              </Drawer>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-[1.5rem] text-neutral-500 py-8">{t("empty")}</p>
      )}
      {pages > 1 && (
        <TablePagination
          page={current}
          count={pages}
          onChange={setPage}
          prevLabel={t("prev")}
          nextLabel={t("next")}
        />
      )}
    </TabsContent>
  );
}
