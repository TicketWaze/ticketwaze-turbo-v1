"use client";
import React, { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "motion/react";
import { DateTime } from "luxon";
import { toast } from "sonner";
import {
  ArrowSwapHorizontal,
  Edit2,
  MoreCircle,
  Profile2User,
  Trash,
} from "iconsax-reactjs";
import {
  OrganisationMember,
  WaitlistMember,
} from "@ticketwaze/typescript-config";
import { Dialog } from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
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
import ModalShell from "@/components/shared/ModalShell";
import SearchField from "@/components/shared/SearchField";
import { Input } from "@/components/shared/Inputs";
import { ButtonPill } from "@/components/shared/buttons";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import { Stagger } from "@/components/shared/motion";
import { AuthStatus } from "@/components/auth/AuthParts";
import SuccessBadge from "@/assets/images/auth/success-badge.png";
import { usePermission } from "@/hooks/usePermission";
import { useRouter } from "@/i18n/navigation";
import { PRESET_PERMISSIONS } from "@/lib/permissionConfig";
import {
  AddMemberAction,
  RemoveInvitation,
  RemoveMemberQuery,
  TransfertOwnershipQuery,
  UpdateMemberPermissionsAction,
} from "@/actions/organisationActions";
import { cn } from "@/lib/utils";
import { SettingsHeader } from "../parts";
import PermissionPicker from "./PermissionPicker";

type Row =
  | {
      kind: "member";
      key: string;
      name: string;
      email: string;
      member: OrganisationMember;
    }
  | {
      kind: "invite";
      key: string;
      name: string;
      email: string;
      invite: WaitlistMember & { permissions?: string[] };
    };

const headClass =
  "font-sans font-bold text-[1.1rem] leading-6 text-deep-100 uppercase text-left pb-6 pr-4 whitespace-nowrap";
const cellClass =
  "font-sans text-[1.5rem] leading-8 text-neutral-900 py-6 pr-4";
const PRESETS = Object.keys(PRESET_PERMISSIONS);
const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && a.every((p) => b.includes(p));

function Pill({
  colour,
  children,
}: {
  colour: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className="inline-block px-2 py-[.3rem] rounded-[3rem] bg-[#f5f5f5] font-bold text-[1.1rem] leading-6 uppercase"
      style={{ color: colour }}
    >
      {children}
    </span>
  );
}

/**
 * Team (Figma 1837:50689 → 2113:51021, phone 2239:71313): search and Add
 * member, the table (name with YOU, email, role, Active / Invited), a ⋯ per
 * row (Edit, Remove — plus Transfer ownership for the owner), Member Details,
 * the Remove confirmation and its "Member removed" screen. Roles are the
 * permission presets; anything else reads "Custom" and edits in the picker.
 */
export default function TeamContent({
  members,
  invites,
  availablePermissions,
  teamLimit,
}: {
  members: OrganisationMember[];
  invites: (WaitlistMember & { permissions?: string[] })[];
  availablePermissions: string[];
  teamLimit?: number;
}) {
  const t = useTranslations("Settings.team");
  const locale = useLocale();
  const router = useRouter();
  const { data: session } = useSession();
  const { can } = usePermission();
  const myEmail = session?.user.email;
  const orgId = session?.activeOrganisation?.organisationId ?? "";
  const canInvite = can("roles.manage");
  const canEdit = can("roles.manage");
  const canRemove = can("staff.manage");
  const canTransfer = can("organisation.transfer_ownership");

  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState<Row | null>(null);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<OrganisationMember | null>(null);
  const [removing, setRemoving] = useState<Row | null>(null);
  const [transferring, setTransferring] = useState<OrganisationMember | null>(
    null,
  );

  const visible = (keys: string[]) =>
    availablePermissions.length
      ? keys.filter((k) => availablePermissions.includes(k))
      : keys;

  /** Owner / preset name / "Custom", for a member or an invite. */
  function roleLabel(row: Row) {
    if (row.kind === "member" && row.member.role === "Owner") return t("owner");
    const perms =
      row.kind === "member"
        ? row.member.permissions
        : (row.invite.permissions ?? []);
    if (row.kind === "member" && !row.member.hasCustomPermissions) {
      return PRESETS.includes(row.member.role)
        ? t(`presets.${row.member.role}`)
        : row.member.role;
    }
    const preset = PRESETS.find((p) =>
      sameSet(visible(PRESET_PERMISSIONS[p]), perms),
    );
    return preset ? t(`presets.${preset}`) : t("customPermissions");
  }

  const rows: Row[] = useMemo(() => {
    const list: Row[] = [
      ...members.map((m) => ({
        kind: "member" as const,
        key: `m-${m.userId}`,
        name: `${m.firstName} ${m.lastName}`.trim(),
        email: m.email,
        member: m,
      })),
      ...invites.map((i) => ({
        kind: "invite" as const,
        key: `i-${i.email}`,
        name: i.fullName || i.email,
        email: i.email,
        invite: i,
      })),
    ];
    const q = query.trim().toLowerCase();
    return q
      ? list.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.email.toLowerCase().includes(q),
        )
      : list;
  }, [members, invites, query]);

  const isSelf = (row: Row) => row.email === myEmail;
  const isOwner = (row: Row) =>
    row.kind === "member" && row.member.role === "Owner";
  const canEditRow = (row: Row) =>
    row.kind === "member" && canEdit && !isSelf(row) && !isOwner(row);
  const canRemoveRow = (row: Row) => canRemove && !isSelf(row) && !isOwner(row);
  const canTransferRow = (row: Row) =>
    row.kind === "member" && canTransfer && !isSelf(row) && row.member.isActive;

  const at = (v: unknown) =>
    v
      ? DateTime.fromISO(String(v))
          .setLocale(locale)
          .toLocaleString(DateTime.DATETIME_MED)
      : "—";

  return (
    <div className="flex flex-col gap-10 pb-16 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
      <SettingsHeader
        title={t("title")}
        actions={
          <>
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder={t("search")}
              className="flex w-full lg:w-[24.3rem] order-2 lg:order-1"
            />
            {canInvite && (
              <ButtonPill
                tone="primary"
                className="w-full lg:w-auto px-8 py-[1rem] order-1 lg:order-2"
                onClick={() => {
                  if (
                    teamLimit !== undefined &&
                    members.length + invites.length >= teamLimit
                  ) {
                    toast.info(t("teamLimit"));
                    return;
                  }
                  setAdding(true);
                }}
              >
                {t("add")}
              </ButtonPill>
            )}
          </>
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className={headClass}>{t("table.name")}</th>
              <th className={headClass}>{t("table.email")}</th>
              <th className={cn(headClass, "hidden lg:table-cell")}>
                {t("table.role")}
              </th>
              <th className={cn(headClass, "hidden lg:table-cell")}>
                {t("table.status")}
              </th>
              <th className="w-[4rem]" aria-hidden />
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {rows.map((row, i) => {
                const actions =
                  canEditRow(row) || canRemoveRow(row) || canTransferRow(row);
                return (
                  <motion.tr
                    key={row.key}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{
                      duration: 0.25,
                      delay: Math.min(i * 0.03, 0.24),
                    }}
                    onClick={() => setDetail(row)}
                    className="border-b border-neutral-100 cursor-pointer transition-colors hover:bg-neutral-50"
                  >
                    <td className={cn(cellClass, "truncate")}>
                      <span className="truncate">{row.name}</span>
                      {isSelf(row) && (
                        <span className="ml-2 px-2 py-[.2rem] rounded-[3rem] bg-primary-50 text-primary-500 font-bold text-[1rem] uppercase">
                          {t("you")}
                        </span>
                      )}
                    </td>
                    <td className={cn(cellClass, "truncate")}>{row.email}</td>
                    <td
                      className={cn(cellClass, "hidden lg:table-cell truncate")}
                    >
                      {roleLabel(row)}
                    </td>
                    <td className={cn(cellClass, "hidden lg:table-cell")}>
                      {row.kind === "invite" ? (
                        <Pill colour="#EA961C">{t("invited")}</Pill>
                      ) : row.member.isActive ? (
                        <Pill colour="#349C2E">{t("active")}</Pill>
                      ) : (
                        <Pill colour="#737C8A">{t("inactive")}</Pill>
                      )}
                    </td>
                    <td
                      className="py-6 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {actions && (
                        <RowMenu
                          onEdit={
                            canEditRow(row) && row.kind === "member"
                              ? () => setEditing(row.member)
                              : undefined
                          }
                          onTransfer={
                            canTransferRow(row) && row.kind === "member"
                              ? () => setTransferring(row.member)
                              : undefined
                          }
                          onRemove={
                            canRemoveRow(row)
                              ? () => setRemoving(row)
                              : undefined
                          }
                        />
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="flex flex-col items-center gap-6 py-16 text-center">
            <div className="w-[9rem] h-[9rem] rounded-full flex items-center justify-center bg-neutral-100">
              <Profile2User size="36" variant="Bulk" color="#0d0d0d" />
            </div>
            <p className="text-[1.5rem] text-neutral-600">{t("no_match")}</p>
          </div>
        )}
      </motion.div>

      {/* Member Details (Figma 2113:50170) */}
      <Drawer
        open={detail !== null}
        onOpenChange={(o) => !o && setDetail(null)}
        direction="right"
      >
        <DrawerContent className="bg-white border-none outline-none my-6 mr-4 lg:mr-6 p-6 lg:p-12 rounded-[30px] data-[vaul-drawer-direction=right]:w-[calc(100vw-2rem)] data-[vaul-drawer-direction=right]:lg:w-[58rem]">
          {detail && (
            <>
              <DrawerTitle className="font-primary font-medium text-center text-[2.2rem] lg:text-[2.6rem] leading-12 text-black pb-6 lg:pb-8 shrink-0">
                {t("details_title")}
              </DrawerTitle>
              <DrawerDescription className="sr-only">
                {detail.email}
              </DrawerDescription>
              <div className="flex-1 overflow-y-auto -mt-6 divide-y divide-neutral-200">
                <Stagger step={0.04}>
                  <Group>
                    <Row label={t("table.name")}>{detail.name}</Row>
                    <Row label={t("table.email")}>
                      <span className="break-all">{detail.email}</span>
                    </Row>
                    <Row label={t("table.role")}>{roleLabel(detail)}</Row>
                  </Group>
                  <Group>
                    <Row label={t("date_added")}>
                      {at(
                        detail.kind === "member"
                          ? detail.member.joinedAt
                          : (detail.invite.dateAdded ??
                              detail.invite.createdAt),
                      )}
                    </Row>
                    <Row label={t("added_by")}>
                      {(detail.kind === "member"
                        ? detail.member.addedBy
                        : detail.invite.addedBy) || "—"}
                    </Row>
                    <Row label={t("table.status")}>
                      {detail.kind === "invite" ? (
                        <Pill colour="#EA961C">{t("invited")}</Pill>
                      ) : detail.member.isActive ? (
                        <Pill colour="#349C2E">{t("active")}</Pill>
                      ) : (
                        <Pill colour="#737C8A">{t("inactive")}</Pill>
                      )}
                    </Row>
                    {detail.kind === "member" && (
                      <Row label={t("last_login")}>
                        {at(detail.member.lastLogin)}
                      </Row>
                    )}
                  </Group>
                </Stagger>
              </div>
              {(canRemoveRow(detail) || canEditRow(detail)) && (
                <div className="shrink-0 mt-4 flex flex-col-reverse lg:flex-row gap-4 lg:gap-6">
                  {canRemoveRow(detail) && (
                    <button
                      type="button"
                      onClick={() => {
                        setRemoving(detail);
                        setDetail(null);
                      }}
                      className="w-full lg:flex-1 h-[5rem] rounded-[10rem] border-2 border-failure bg-failure/10 font-sans font-semibold text-[1.5rem] text-failure cursor-pointer hover:bg-failure/20"
                    >
                      {detail.kind === "invite"
                        ? t("remove_invitation")
                        : t("remove_member_full")}
                    </button>
                  )}
                  {canEditRow(detail) && detail.kind === "member" && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(detail.member);
                        setDetail(null);
                      }}
                      className="w-full lg:flex-1 h-[5rem] rounded-[10rem] bg-primary-500 font-sans font-semibold text-[1.5rem] text-white cursor-pointer hover:bg-primary-600"
                    >
                      {t("edit")}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </DrawerContent>
      </Drawer>

      <AddMemberDialog
        open={adding}
        onOpenChange={setAdding}
        orgId={orgId}
        availablePermissions={availablePermissions}
        onDone={() => router.refresh()}
      />
      {editing && (
        <EditMemberDialog
          member={editing}
          orgId={orgId}
          availablePermissions={availablePermissions}
          initialRole={roleLabel({
            kind: "member",
            key: "",
            name: "",
            email: editing.email,
            member: editing,
          })}
          onClose={() => setEditing(null)}
          onDone={() => router.refresh()}
        />
      )}
      {removing && (
        <RemoveDialog
          row={removing}
          orgId={orgId}
          onClose={() => setRemoving(null)}
          onDone={() => router.refresh()}
        />
      )}
      {transferring && (
        <TransferDialog
          member={transferring}
          orgId={orgId}
          onClose={() => setTransferring(null)}
          onDone={() => router.refresh()}
        />
      )}
    </div>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-6 py-6">{children}</div>;
}
function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 font-sans text-[1.4rem] leading-8">
      <span className="text-neutral-600 shrink-0">{label}</span>
      <span className="text-deep-100 font-medium text-right min-w-0">
        {children}
      </span>
    </div>
  );
}

/** The row's ⋯ (Figma 2113:49786): Edit, Transfer ownership, Remove. */
function RowMenu({
  onEdit,
  onTransfer,
  onRemove,
}: {
  onEdit?: () => void;
  onTransfer?: () => void;
  onRemove?: () => void;
}) {
  const t = useTranslations("Settings.team");
  const [open, setOpen] = useState(false);
  const item =
    "w-full flex items-center justify-between gap-6 py-4 border-b border-neutral-200 last:border-b-0 font-sans text-[1.5rem] leading-8 cursor-pointer transition-colors";
  const run = (fn?: () => void) => () => {
    setOpen(false);
    fn?.();
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={t("more")}
        className="w-[2.4rem] h-[2.4rem] rounded-full bg-neutral-100 inline-flex items-center justify-center cursor-pointer hover:bg-neutral-200"
      >
        <MoreCircle size="16" variant="Bulk" color="#737C8A" aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[23.5rem] p-[1rem] bg-neutral-100 border border-neutral-200 rounded-[1rem] shadow-[0px_10px_30px_rgba(0,0,0,0.12)]"
      >
        <p className="font-sans font-medium pb-2 border-b border-neutral-200 text-[1.4rem] text-deep-100 leading-8">
          {t("more")}
        </p>
        {onEdit && (
          <button
            type="button"
            onClick={run(onEdit)}
            className={cn(item, "text-primary-500")}
          >
            {t("edit")}
            <Edit2 size="18" variant="Bulk" color="#E45B00" />
          </button>
        )}
        {onTransfer && (
          <button
            type="button"
            onClick={run(onTransfer)}
            className={cn(item, "text-neutral-700 hover:text-primary-500")}
          >
            {t("transfer")}
            <ArrowSwapHorizontal size="18" variant="Bulk" color="#2E3237" />
          </button>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={run(onRemove)}
            className={cn(item, "text-failure")}
          >
            {t("remove")}
            <Trash size="18" variant="Bulk" color="#DE0028" />
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

/** Role select: the presets, plus Custom which opens the permission picker. */
function RoleField({
  role,
  onRole,
  permissions,
  onPermissions,
  availablePermissions,
}: {
  role: string;
  onRole: (role: string) => void;
  permissions: string[];
  onPermissions: (p: string[]) => void;
  availablePermissions: string[];
}) {
  const t = useTranslations("Settings.team");
  return (
    <div className="w-full flex flex-col gap-4">
      <Select value={role || undefined} onValueChange={onRole}>
        <SelectTrigger className="w-full bg-neutral-100 rounded-[5rem] !h-[6rem] px-8 text-[1.5rem] border border-transparent focus:border-primary-500 shadow-none">
          <SelectValue placeholder={t("table.role")} />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((p) => (
            <SelectItem key={p} value={p} className="text-[1.5rem] py-3">
              {t(`presets.${p}`)}
            </SelectItem>
          ))}
          <SelectItem value="custom" className="text-[1.5rem] py-3">
            {t("customPermissions")}
          </SelectItem>
        </SelectContent>
      </Select>
      <AnimatePresence initial={false}>
        {role === "custom" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-[1.5rem] border border-neutral-100 p-4">
              <PermissionPicker
                availablePermissions={availablePermissions}
                selected={permissions}
                onChange={onPermissions}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Add/Edit member keep one height whichever role is picked: the fields
 * scroll (Custom's permission list included) and the button stays pinned.
 */
const MEMBER_MODAL = "lg:w-[52rem] h-[min(58rem,calc(100dvh-3.2rem))]";
const MEMBER_FIELDS =
  "w-full flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col gap-4";

function permissionsFor(role: string, custom: string[], available: string[]) {
  if (role === "custom") return custom;
  const preset = PRESET_PERMISSIONS[role] ?? [];
  return available.length
    ? preset.filter((p) => available.includes(p))
    : preset;
}

/** Add Member (Figma 2108:48856 / 2109:49153): name, email, role. */
function AddMemberDialog({
  open,
  onOpenChange,
  orgId,
  availablePermissions,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  availablePermissions: string[];
  onDone: () => void;
}) {
  const t = useTranslations("Settings.team");
  const locale = useLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [custom, setCustom] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const permissions = permissionsFor(role, custom, availablePermissions);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const ready = name.trim().length >= 5 && emailOk && permissions.length > 0;

  async function submit() {
    setBusy(true);
    const result = await AddMemberAction(
      orgId,
      { fullName: name.trim(), email: email.trim().toLowerCase(), permissions },
      locale,
    );
    setBusy(false);
    if (result?.status === "success") {
      toast.success(t("invited_toast", { email: email.trim() }));
      setName("");
      setEmail("");
      setRole("");
      setCustom([]);
      onOpenChange(false);
      onDone();
      return;
    }
    toast.error(result?.error);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ModalShell title={t("add")} className={MEMBER_MODAL}>
        <div className={MEMBER_FIELDS}>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={5}
          >
            {t("table.name")}
          </Input>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          >
            {t("email_address")}
          </Input>
          <RoleField
            role={role}
            onRole={setRole}
            permissions={custom}
            onPermissions={setCustom}
            availablePermissions={availablePermissions}
          />
          <p className="text-[1.2rem] leading-6 text-neutral-600 px-2">
            {t("requiresAccount")}
          </p>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={!ready || busy}
          className="w-full h-[5.2rem] shrink-0 rounded-[10rem] bg-primary-500 font-sans font-semibold text-[1.5rem] text-white cursor-pointer hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {busy ? <LoadingCircleSmall /> : t("add")}
        </button>
      </ModalShell>
    </Dialog>
  );
}

function EditMemberDialog({
  member,
  orgId,
  availablePermissions,
  initialRole,
  onClose,
  onDone,
}: {
  member: OrganisationMember;
  orgId: string;
  availablePermissions: string[];
  initialRole: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useTranslations("Settings.team");
  const locale = useLocale();
  const startRole =
    PRESETS.find((p) => t(`presets.${p}`) === initialRole) ?? "custom";
  const [role, setRole] = useState(startRole);
  const [custom, setCustom] = useState<string[]>(member.permissions ?? []);
  const [busy, setBusy] = useState(false);
  const permissions = permissionsFor(role, custom, availablePermissions);

  async function save() {
    if (permissions.length === 0) return toast.warning(t("selectPermission"));
    setBusy(true);
    const result = await UpdateMemberPermissionsAction(
      orgId,
      member.userId,
      permissions,
      locale,
    );
    setBusy(false);
    if (result?.status === "success") {
      toast.success(t("permissionsSaved"));
      onClose();
      onDone();
      return;
    }
    toast.error(result?.error);
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <ModalShell title={t("edit_title")} className={MEMBER_MODAL}>
        <div className={MEMBER_FIELDS}>
          <Input
            value={`${member.firstName} ${member.lastName}`}
            disabled
            readOnly
          >
            {t("table.name")}
          </Input>
          <Input value={member.email} disabled readOnly>
            {t("email_address")}
          </Input>
          <RoleField
            role={role}
            onRole={setRole}
            permissions={custom}
            onPermissions={setCustom}
            availablePermissions={availablePermissions}
          />
        </div>
        <button
          type="button"
          onClick={save}
          disabled={busy || permissions.length === 0}
          className="w-full h-[5.2rem] shrink-0 rounded-[10rem] bg-primary-500 font-sans font-semibold text-[1.5rem] text-white cursor-pointer hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {busy ? <LoadingCircleSmall /> : t("save")}
        </button>
      </ModalShell>
    </Dialog>
  );
}

/** Remove Member (2113:50586) → "Member removed" (2113:51021). Invites too. */
function RemoveDialog({
  row,
  orgId,
  onClose,
  onDone,
}: {
  row: Row;
  orgId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useTranslations("Settings.team");
  const locale = useLocale();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function remove() {
    setBusy(true);
    const result =
      row.kind === "invite"
        ? await RemoveInvitation(orgId, row.email, locale)
        : await RemoveMemberQuery(orgId, row.email, locale);
    setBusy(false);
    if (result.status === "success") {
      setDone(true);
      setTimeout(() => {
        onClose();
        onDone();
      }, 1800);
      return;
    }
    toast.error(result.error);
  }

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      {done ? (
        <ModalShell title={t("removed_title")} className="lg:w-[44rem]">
          <AuthStatus
            image={SuccessBadge}
            title={t("removed_title")}
            description={t.rich("removed_description", {
              name: row.name,
              b: (chunks) => <strong className="text-black">{chunks}</strong>,
            })}
          >
            <p className="text-[1.5rem] text-primary-500">{t("returning")}</p>
          </AuthStatus>
        </ModalShell>
      ) : (
        <ModalShell
          title={
            row.kind === "invite"
              ? t("remove_invitation")
              : t("remove_member_full")
          }
          className="lg:w-[44rem]"
          description={t.rich("confirm_remove", {
            name: row.name,
            b: (chunks) => <strong className="text-black">{chunks}</strong>,
          })}
        >
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="w-full h-[5rem] rounded-[10rem] border-2 border-failure bg-failure/10 font-sans font-semibold text-[1.5rem] text-failure cursor-pointer hover:bg-failure/20 disabled:opacity-60 flex items-center justify-center"
          >
            {busy ? <LoadingCircleSmall /> : t("confirm")}
          </button>
        </ModalShell>
      )}
    </Dialog>
  );
}

function TransferDialog({
  member,
  orgId,
  onClose,
  onDone,
}: {
  member: OrganisationMember;
  orgId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useTranslations("Settings.team");
  const locale = useLocale();
  const [busy, setBusy] = useState(false);
  async function transfer() {
    setBusy(true);
    const result = await TransfertOwnershipQuery(orgId, member.email, locale);
    setBusy(false);
    if (result.status === "success") {
      toast.success(
        t("transferred", { name: `${member.firstName} ${member.lastName}` }),
      );
      onClose();
      onDone();
      return;
    }
    toast.error(result.error);
  }
  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <ModalShell
        title={t("transfer")}
        className="lg:w-[44rem]"
        description={t("confirm_transfert")}
      >
        <button
          type="button"
          onClick={transfer}
          disabled={busy}
          className="w-full h-[5rem] rounded-[10rem] bg-primary-500 font-sans font-semibold text-[1.5rem] text-white cursor-pointer hover:bg-primary-600 disabled:opacity-60 flex items-center justify-center"
        >
          {busy ? <LoadingCircleSmall /> : t("confirm2")}
        </button>
      </ModalShell>
    </Dialog>
  );
}
