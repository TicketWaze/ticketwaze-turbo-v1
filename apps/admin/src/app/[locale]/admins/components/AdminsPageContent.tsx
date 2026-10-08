"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowRight2, SecurityUser, Warning2 } from "iconsax-reactjs";
import FilterPill from "@/components/shared/FilterPill";
import SearchField from "@/components/shared/SearchField";
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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import formatDate from "@/lib/FormatDate";
import { cn } from "@/lib/utils";

export type AdminRecord = {
  adminId: string;
  email: string;
  role: number;
  roleLabel: string;
  customPermissions: string[] | null;
  effectivePermissionKeys: string[];
  isVerified: boolean;
  createdAt: string;
};

/** The roles an admin can be given here (Owner is never assignable). */
export const ASSIGNABLE_ROLES = [0, 1, 2, 3, 4] as const;

const ROLE_TONE: Record<number, BadgeTone> = {
  0: "warning",
  1: "neutral",
  2: "neutral",
  3: "neutral",
  4: "primary",
  5: "success",
};

const ACTIONS = ["view", "create", "edit", "delete"];

/**
 * The grid in the permissions modal, one row per resource.
 *
 * `actions` is per-group rather than the shared ACTIONS list because the
 * permission set is not a clean CRUD matrix and never was: `payouts.send`,
 * `campaigns.send`, `activity.manage`, `tickets.giveaway`, `attendees.credit`
 * and `tickets.checking` are powers in their own right, and campaigns has no
 * `edit` at all.
 *
 * `tickets.checking` is the door scanner. It is the one key here that is
 * usually granted DOWNWARD — to a Support or Moderator admin working an event
 * — rather than held back, so it deliberately reads as an ordinary tick.
 */
const PERMISSION_GROUPS: { resource: string; actions: string[] }[] = [
  { resource: "analytics", actions: ACTIONS },
  { resource: "support_chat", actions: ACTIONS },
  { resource: "contact_message", actions: ACTIONS },
  { resource: "waitlist", actions: ACTIONS },
  { resource: "attendees", actions: [...ACTIONS, "credit"] },
  { resource: "organisations", actions: ACTIONS },
  { resource: "admins", actions: ACTIONS },
  { resource: "activity", actions: [...ACTIONS, "manage"] },
  { resource: "tickets", actions: [...ACTIONS, "giveaway", "checking"] },
  { resource: "payouts", actions: [...ACTIONS, "send"] },
  { resource: "payments", actions: ACTIONS },
  { resource: "campaigns", actions: ["view", "create", "delete", "send"] },
];

/**
 * Actions that spend money or reach every account, and cannot be undone once
 * pressed. Called out in the grid so granting one is a decision rather than a
 * tick alongside four harmless ones — these are the keys deliberately held out
 * of the Admin role bundle on the API side.
 */
const IRREVERSIBLE_ACTIONS = new Set([
  "payouts.send",
  "campaigns.send",
  "tickets.giveaway",
  "attendees.credit",
]);

/**
 * Settings → Administrators → the team: every admin with their role, access
 * and verification, a role pill and an email search. A row opens the drawer
 * (assign a role, custom permissions, remove). The Owner and yourself cannot
 * be removed; the Owner's role cannot be changed.
 */
export default function AdminsPageContent({ admins: initialAdmins }: { admins: AdminRecord[] }) {
  const t = useTranslations("Admins.team");
  const tRoles = useTranslations("Admins.roles");
  const tPerm = useTranslations("Admins.permissions");
  const { data: session } = useSession();
  const locale = useLocale();

  const [admins, setAdmins] = useState<AdminRecord[]>(initialAdmins ?? []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState("all");
  const [term, setTerm] = useState("");
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [busy, setBusy] = useState<null | "role" | "permissions" | "delete">(null);
  const [draftPermissions, setDraftPermissions] = useState<string[]>([]);

  const accessToken = session?.user.accessToken;
  const currentAdminId = session?.user.adminId;
  const myPermissions = (session?.user.effectivePermissionKeys ?? []) as string[];
  const canEdit = myPermissions.includes("admins.edit");
  const canDelete = myPermissions.includes("admins.delete");

  const selected = admins.find((a) => a.adminId === selectedId) ?? null;
  const isOwner = (a: AdminRecord) => a.role === 5;
  const isSelf = (a: AdminRecord) => a.adminId === currentAdminId;
  const roleName = (role: number) => (tRoles.has(String(role)) ? tRoles(String(role)) : "—");

  const query = term.trim().toLowerCase();
  const rows = admins
    .filter((a) => roleFilter === "all" || String(a.role) === roleFilter)
    .filter((a) => !query || a.email.toLowerCase().includes(query));

  /** PATCH/DELETE one admin; returns the updated record, or null after a toast. */
  async function call(
    action: NonNullable<typeof busy>,
    path: string,
    method: "PATCH" | "DELETE",
    body?: object,
  ) {
    if (!selected || !accessToken) return null;
    setBusy(action);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/administrator/${selected.adminId}${path}`,
        {
          method,
          headers: {
            ...(body ? { "Content-Type": "application/json" } : {}),
            Authorization: `Bearer ${accessToken}`,
          },
          body: body ? JSON.stringify(body) : undefined,
        },
      );
      const data = await res.json().catch(() => null);
      if (data?.status !== "success") {
        toast.error(data?.message ?? t("error"));
        return null;
      }
      return data as { admin?: AdminRecord };
    } catch {
      toast.error(t("error"));
      return null;
    } finally {
      setBusy(null);
    }
  }

  function replace(updated: AdminRecord) {
    setAdmins((prev) => prev.map((a) => (a.adminId === updated.adminId ? updated : a)));
  }

  async function handleRoleChange(value: string) {
    const data = await call("role", "/role", "PATCH", { role: Number(value) });
    if (data?.admin) {
      replace(data.admin);
      toast.success(t("role_updated"));
    }
  }

  function openPermissionsModal() {
    if (!selected) return;
    setDraftPermissions([...(selected.customPermissions ?? [])]);
    setPermissionsModalOpen(true);
  }

  function togglePermission(key: string) {
    setDraftPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key],
    );
  }

  function toggleGroup(resource: string) {
    const group = PERMISSION_GROUPS.find((g) => g.resource === resource);
    const groupKeys = (group?.actions ?? ACTIONS).map((a) => `${resource}.${a}`);
    const allChecked = groupKeys.every((k) => draftPermissions.includes(k));
    setDraftPermissions((prev) =>
      allChecked ? prev.filter((p) => !groupKeys.includes(p)) : [...new Set([...prev, ...groupKeys])],
    );
  }

  async function handleSavePermissions() {
    const data = await call("permissions", "/permissions", "PATCH", {
      permissions: draftPermissions,
    });
    if (data?.admin) {
      replace(data.admin);
      setPermissionsModalOpen(false);
      toast.success(t("permissions_updated"));
    }
  }

  async function handleDelete() {
    if (!selected) return;
    const id = selected.adminId;
    const data = await call("delete", "", "DELETE");
    if (data) {
      setDeleteConfirmOpen(false);
      setSelectedId(null);
      setAdmins((prev) => prev.filter((a) => a.adminId !== id));
      toast.success(t("removed"));
    }
  }

  const accessText = (a: AdminRecord) =>
    a.effectivePermissionKeys.length === 0
      ? t("no_access")
      : t("permission_count", { count: a.effectivePermissionKeys.length });

  const detailRow = (label: string, value: React.ReactNode) => (
    <p className="flex justify-between items-center gap-8 text-[1.4rem] leading-8 text-neutral-600">
      <span className="shrink-0">{label}</span>
      <span className="text-deep-100 font-medium text-right min-w-0 break-words">{value}</span>
    </p>
  );

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h4 className="font-primary font-medium text-[1.8rem] leading-10 text-black">
          {t("title")}
        </h4>
        <div className="flex flex-wrap items-center gap-4">
          <FilterPill
            label={t("role_label")}
            value={roleFilter}
            defaultValue="all"
            placeholder={t("all_roles")}
            options={[
              { value: "all", label: t("all_roles") },
              ...[5, 4, 3, 2, 1, 0].map((r) => ({ value: String(r), label: roleName(r) })),
            ]}
            onChange={setRoleFilter}
          />
          <SearchField
            value={term}
            onChange={setTerm}
            placeholder={t("search")}
            className="flex w-full lg:w-[26rem]"
          />
        </div>
      </div>

      <TableFrame minWidth="72rem">
        <thead>
          <tr className="border-b border-neutral-100">
            <th className={TABLE_HEAD}>{t("columns.email")}</th>
            <th className={TABLE_HEAD}>{t("columns.role")}</th>
            <th className={TABLE_HEAD}>{t("columns.access")}</th>
            <th className={TABLE_HEAD}>{t("columns.status")}</th>
            <th className={TABLE_HEAD}>{t("columns.joined")}</th>
            <th className={TABLE_HEAD}>
              <span className="sr-only">{t("columns.actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((admin) => (
            <tr
              key={admin.adminId}
              className={cn(TABLE_ROW, admin.role === 0 && "bg-[#FFF7E6]/60")}
              onClick={() => setSelectedId(admin.adminId)}
            >
              <td className={TABLE_CELL}>
                <span className="flex items-center gap-3 min-w-0">
                  <span className="w-[3.6rem] h-[3.6rem] rounded-full bg-neutral-100 flex items-center justify-center shrink-0 font-primary font-bold text-[1.4rem] text-neutral-700">
                    {admin.email[0]?.toUpperCase()}
                  </span>
                  <span className="truncate max-w-[28rem] font-medium">{admin.email}</span>
                  {isSelf(admin) && <Badge tone="primary">{t("you")}</Badge>}
                </span>
              </td>
              <td className="py-6 pr-4">
                <Badge tone={ROLE_TONE[admin.role] ?? "neutral"}>{roleName(admin.role)}</Badge>
              </td>
              <td className={cn(TABLE_CELL, "whitespace-nowrap text-neutral-700")}>
                {accessText(admin)}
              </td>
              <td className="py-6 pr-4">
                <Badge tone={admin.isVerified ? "success" : "neutral"}>
                  {admin.isVerified ? t("verified") : t("unverified")}
                </Badge>
              </td>
              <td className={cn(TABLE_CELL, "whitespace-nowrap")}>
                {formatDate(admin.createdAt, locale, "local")}
              </td>
              <td className="py-6 text-right">
                <RowMore />
              </td>
            </tr>
          ))}
        </tbody>
      </TableFrame>

      {rows.length === 0 && (
        <EmptyState
          Icon={SecurityUser}
          filtered={admins.length > 0}
          text={admins.length > 0 ? t("no_results") : t("empty")}
        />
      )}

      <Drawer
        direction="right"
        open={selected !== null}
        onOpenChange={(open) => !open && setSelectedId(null)}
      >
        {selected && (
          <DrawerContent className="my-8 p-12 rounded-[30px] w-full">
            <div className="w-full flex flex-col items-center overflow-y-auto">
              <DrawerTitle className="pb-12 max-w-full">
                <span className="block font-primary font-medium text-center text-[2.6rem] leading-12 text-black">
                  {t("drawer.title")}
                </span>
              </DrawerTitle>
              <DrawerDescription asChild className="w-full">
                <div className="flex flex-col gap-6">
                  {selected.role === 0 && (
                    <p className="flex items-start gap-3 rounded-[1rem] bg-[#FFF7E6] px-5 py-4 text-[1.4rem] leading-7 text-[#B76E00]">
                      <Warning2 size="18" variant="Bulk" color="#B76E00" className="shrink-0 mt-1" />
                      {t("drawer.pending_alert")}
                    </p>
                  )}
                  {detailRow(t("columns.email"), selected.email)}
                  {detailRow(
                    t("columns.role"),
                    <Badge tone={ROLE_TONE[selected.role] ?? "neutral"}>{roleName(selected.role)}</Badge>,
                  )}
                  {detailRow(t("columns.joined"), formatDate(selected.createdAt, locale, "local"))}
                  {detailRow(
                    t("columns.status"),
                    <Badge tone={selected.isVerified ? "success" : "neutral"}>
                      {selected.isVerified ? t("verified") : t("unverified")}
                    </Badge>,
                  )}
                  <div className="h-[2px] w-full bg-neutral-100" />
                  {detailRow(t("columns.access"), accessText(selected))}
                  {detailRow(
                    t("drawer.source"),
                    <Badge tone={selected.customPermissions !== null ? "primary" : "neutral"}>
                      {selected.customPermissions !== null ? t("drawer.custom") : t("drawer.role_defaults")}
                    </Badge>,
                  )}

                  {canEdit && !isOwner(selected) && (
                    <>
                      <div className="h-[2px] w-full bg-neutral-100" />
                      <div className="flex flex-col gap-3">
                        <span className="text-[1.4rem] font-medium text-deep-100">
                          {t("drawer.assign_role")}
                        </span>
                        <span className="text-[1.3rem] leading-6 text-neutral-600 -mt-1">
                          {t("drawer.assign_hint")}
                        </span>
                        <div className="flex items-center gap-3">
                          <FilterPill
                            label={t("drawer.assign_role")}
                            value={String(selected.role)}
                            options={ASSIGNABLE_ROLES.map((r) => ({
                              value: String(r),
                              label: roleName(r),
                            }))}
                            onChange={handleRoleChange}
                            pending={busy === "role"}
                            align="start"
                          />
                          {busy === "role" && <LoadingCircleSmall />}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={openPermissionsModal}
                        className="w-full flex items-center justify-between gap-4 rounded-[1rem] bg-neutral-100 hover:bg-neutral-200 px-5 py-4 text-[1.4rem] font-medium text-deep-100 cursor-pointer transition-colors"
                      >
                        {t("drawer.custom_permissions")}
                        <ArrowRight2 size="16" color="#737C8A" />
                      </button>
                    </>
                  )}
                </div>
              </DrawerDescription>
            </div>
            <DrawerFooter>
              <div className="flex gap-4 w-full">
                <DrawerClose asChild>
                  <button
                    type="button"
                    className={cn(HEADER_PILL, PILL_TONE.neutral, "flex-1 lg:flex-1 h-[4.8rem]")}
                  >
                    {t("drawer.close")}
                  </button>
                </DrawerClose>
                {canDelete && !isSelf(selected) && !isOwner(selected) && (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmOpen(true)}
                    className={cn(HEADER_PILL, PILL_TONE.danger, "flex-1 lg:flex-1 h-[4.8rem]")}
                  >
                    {t("drawer.remove")}
                  </button>
                )}
              </div>
            </DrawerFooter>
          </DrawerContent>
        )}
      </Drawer>

      <Dialog open={permissionsModalOpen} onOpenChange={setPermissionsModalOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogTitle>{t("permissions.title")}</DialogTitle>
          <p className="text-[1.4rem] text-neutral-600 leading-7 -mt-4 mb-2">
            {t("permissions.description", { email: selected?.email ?? "" })}
          </p>

          <div className="flex flex-col gap-6">
            {PERMISSION_GROUPS.map(({ resource, actions }) => {
              const groupKeys = actions.map((a) => `${resource}.${a}`);
              const allChecked = groupKeys.every((k) => draftPermissions.includes(k));
              const someChecked = groupKeys.some((k) => draftPermissions.includes(k));
              return (
                <div key={resource} className="flex flex-col gap-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => {
                        if (el) el.indeterminate = !allChecked && someChecked;
                      }}
                      onChange={() => toggleGroup(resource)}
                      className="w-[1.6rem] h-[1.6rem] accent-primary-500 cursor-pointer"
                    />
                    <span className="text-[1.4rem] font-semibold text-deep-100 font-primary">
                      {tPerm(`resources.${resource}`)}
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-1 pl-9">
                    {actions.map((action) => {
                      const key = `${resource}.${action}`;
                      return (
                        <label
                          key={key}
                          className="flex items-center gap-3 cursor-pointer py-[0.5rem] px-3 rounded-[0.8rem] hover:bg-neutral-50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={draftPermissions.includes(key)}
                            onChange={() => togglePermission(key)}
                            className="w-[1.4rem] h-[1.4rem] accent-primary-500 cursor-pointer"
                          />
                          <span
                            className={cn(
                              "text-[1.3rem]",
                              IRREVERSIBLE_ACTIONS.has(key)
                                ? "text-primary-500 font-medium"
                                : "text-neutral-700",
                            )}
                          >
                            {tPerm(`actions.${action}`)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="mt-6 flex gap-4">
            <button
              type="button"
              onClick={() => setDraftPermissions([])}
              className={cn(HEADER_PILL, PILL_TONE.neutral)}
            >
              {t("permissions.clear")}
            </button>
            <button
              type="button"
              onClick={handleSavePermissions}
              disabled={busy !== null}
              className={cn(HEADER_PILL, PILL_TONE.primary, "min-w-[14rem]")}
            >
              {busy === "permissions" ? <LoadingCircleSmall /> : t("permissions.save")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogTitle>{t("remove.title")}</DialogTitle>
          <p className="text-[1.5rem] text-neutral-600 leading-8">
            {t("remove.body", { email: selected?.email ?? "" })}
          </p>
          <DialogFooter className="mt-2 flex gap-4">
            <button
              type="button"
              onClick={() => setDeleteConfirmOpen(false)}
              className={cn(HEADER_PILL, PILL_TONE.neutral)}
            >
              {t("remove.cancel")}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={busy !== null}
              className={cn(HEADER_PILL, "bg-failure text-white text-[1.4rem] hover:bg-failure/90 min-w-[12rem]")}
            >
              {busy === "delete" ? <LoadingCircleSmall /> : t("remove.confirm")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
