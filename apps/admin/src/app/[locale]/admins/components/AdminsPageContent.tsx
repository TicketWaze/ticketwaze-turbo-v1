"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useLocale } from "next-intl";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import LoadingCircleSmall from "@/components/shared/LoadingCircleSmall";
import formatDate from "@/lib/FormatDate";

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

const ROLE_OPTIONS = [
  { value: 0, label: "Pending" },
  { value: 1, label: "Viewer" },
  { value: 2, label: "Support" },
  { value: 3, label: "Moderator" },
  { value: 4, label: "Admin" },
];

const PERMISSION_GROUPS = [
  { resource: "analytics", label: "Analytics" },
  { resource: "support_chat", label: "Live Chat" },
  { resource: "contact_message", label: "Contact Messages" },
  { resource: "waitlist", label: "Waitlist" },
  { resource: "attendees", label: "Attendees" },
  { resource: "organisations", label: "Organisations" },
  { resource: "admins", label: "Administrators" },
  { resource: "activity", label: "Activities" },
  { resource: "tickets", label: "Tickets" },
  { resource: "payouts", label: "Payouts" },
  { resource: "payments", label: "Payments" },
];

const ACTIONS = ["view", "create", "edit", "delete"];

function roleBadgeClass(role: number): string {
  switch (role) {
    case 1: return "bg-blue-50 text-blue-600";
    case 2: return "bg-teal-50 text-teal-600";
    case 3: return "bg-purple-50 text-purple-600";
    case 4: return "bg-orange-50 text-orange-600";
    case 5: return "bg-amber-50 text-amber-700";
    default: return "bg-neutral-100 text-neutral-500";
  }
}

export default function AdminsPageContent({
  admins: initialAdmins,
}: {
  admins: AdminRecord[];
}) {
  const { data: session } = useSession();
  const locale = useLocale();

  const [admins, setAdmins] = useState<AdminRecord[]>(initialAdmins ?? []);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<AdminRecord | null>(null);
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [draftPermissions, setDraftPermissions] = useState<string[]>([]);

  const accessToken = session?.user.accessToken;
  const currentAdminId = session?.user.adminId;
  const myPermissions = (session?.user.effectivePermissionKeys ?? []) as string[];
  const can = (p: string) => myPermissions.includes(p);
  const canEdit = can("admins.edit");
  const canDelete = can("admins.delete");

  function openDrawer(admin: AdminRecord) {
    setSelected(admin);
    setDrawerOpen(true);
  }

  async function handleRoleChange(value: string) {
    if (!selected || !accessToken) return;
    const role = parseInt(value);
    setIsUpdatingRole(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/administrator/${selected.adminId}/role`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ role }),
        },
      );
      const data = await res.json();
      if (data.status !== "success") throw new Error(data.message);
      const updated = data.admin as AdminRecord;
      setAdmins((prev) => prev.map((a) => (a.adminId === updated.adminId ? updated : a)));
      setSelected(updated);
      toast.success("Role updated successfully.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update role.");
    } finally {
      setIsUpdatingRole(false);
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
    const groupKeys = ACTIONS.map((a) => `${resource}.${a}`);
    const allChecked = groupKeys.every((k) => draftPermissions.includes(k));
    if (allChecked) {
      setDraftPermissions((prev) => prev.filter((p) => !groupKeys.includes(p)));
    } else {
      setDraftPermissions((prev) => [...new Set([...prev, ...groupKeys])]);
    }
  }

  async function handleSavePermissions() {
    if (!selected || !accessToken) return;
    setIsSavingPermissions(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/administrator/${selected.adminId}/permissions`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ permissions: draftPermissions }),
        },
      );
      const data = await res.json();
      if (data.status !== "success") throw new Error(data.message);
      const updated = data.admin as AdminRecord;
      setAdmins((prev) => prev.map((a) => (a.adminId === updated.adminId ? updated : a)));
      setSelected(updated);
      setPermissionsModalOpen(false);
      toast.success("Permissions updated successfully.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to save permissions.");
    } finally {
      setIsSavingPermissions(false);
    }
  }

  async function handleDelete() {
    if (!selected || !accessToken) return;
    setIsDeleting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/administrator/${selected.adminId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      const data = await res.json();
      if (data.status !== "success") throw new Error(data.message);
      setAdmins((prev) => prev.filter((a) => a.adminId !== selected.adminId));
      setDeleteConfirmOpen(false);
      setDrawerOpen(false);
      setSelected(null);
      toast.success("Administrator removed.");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to remove admin.");
    } finally {
      setIsDeleting(false);
    }
  }

  const isOwner = (a: AdminRecord) => a.role === 5;
  const isSelf = (a: AdminRecord) => a.adminId === currentAdminId;

  return (
    <div className="overflow-y-scroll flex flex-col gap-8 pb-12">
      {/* ── Table ─────────────────────────────────────────────────────────── */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
              Email
            </TableHead>
            <TableHead className="font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
              Role
            </TableHead>
            <TableHead className="hidden lg:table-cell font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
              Permissions
            </TableHead>
            <TableHead className="hidden lg:table-cell font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
              Status
            </TableHead>
            <TableHead className="hidden lg:table-cell font-bold text-[1.1rem] pb-6 leading-6 text-deep-100 uppercase">
              Joined
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {admins.map((admin) => (
            <TableRow
              key={admin.adminId}
              className={`cursor-pointer transition-colors ${admin.role === 0 ? "bg-amber-50/60 hover:bg-amber-50" : ""}`}
              onClick={() => openDrawer(admin)}
            >
              <TableCell className="text-[1.5rem] py-6 leading-8 text-neutral-900">
                <div className="flex items-center gap-3">
                  <div className="w-[3.8rem] h-[3.8rem] rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                    <span className="text-neutral-600 font-bold text-[1.4rem] font-primary">
                      {admin.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col gap-[2px] min-w-0">
                    <span className="truncate max-w-[160px] lg:max-w-[280px] block">
                      {admin.email}
                    </span>
                    {isSelf(admin) && (
                      <span className="text-[10px] font-bold uppercase px-[6px] py-[2px] rounded-full bg-primary-500/10 text-primary-500 w-fit">
                        You
                      </span>
                    )}
                  </div>
                </div>
              </TableCell>

              <TableCell className="py-6">
                <span className={`py-[0.3rem] px-3 rounded-[30px] text-[11px] font-bold uppercase ${roleBadgeClass(admin.role)}`}>
                  {admin.roleLabel}
                </span>
              </TableCell>

              <TableCell className="hidden lg:table-cell text-[1.4rem] py-6 leading-8 text-neutral-500">
                {admin.effectivePermissionKeys.length === 0 ? (
                  <span className="text-neutral-300 italic">No access</span>
                ) : (
                  `${admin.effectivePermissionKeys.length} permission${admin.effectivePermissionKeys.length === 1 ? "" : "s"}`
                )}
              </TableCell>

              <TableCell className="hidden lg:table-cell py-6">
                <span className={`py-[0.3rem] px-2 rounded-[30px] text-[11px] font-bold uppercase ${admin.isVerified ? "bg-neutral-100 text-success" : "bg-neutral-100 text-neutral-400"}`}>
                  {admin.isVerified ? "Verified" : "Unverified"}
                </span>
              </TableCell>

              <TableCell className="hidden lg:table-cell text-[1.4rem] py-6 leading-8 text-neutral-500">
                {formatDate(admin.createdAt, locale, "local")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {admins.length === 0 && (
        <div className="flex flex-col gap-4 items-center py-16 text-neutral-400">
          <span className="text-[3rem]">👥</span>
          <p className="text-[1.5rem]">No administrators found.</p>
        </div>
      )}

      {/* ── Admin Detail Drawer ────────────────────────────────────────────── */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
        <DrawerContent className="my-6 rounded-[30px] lg:w-[520px] p-0 flex flex-col">
          {selected && (
            <>
              {/* Header */}
              <DrawerHeader className="px-10 pt-10 pb-6 border-b border-neutral-100">
                <div className="flex items-start gap-4">
                  <div className="w-[5.2rem] h-[5.2rem] rounded-full bg-neutral-100 flex items-center justify-center shrink-0">
                    <span className="text-neutral-700 font-bold text-[2.2rem] font-primary">
                      {selected.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col gap-[8px] min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <DrawerTitle className="text-[1.6rem] font-primary font-semibold text-neutral-900 leading-7 truncate">
                        {selected.email}
                      </DrawerTitle>
                      {isSelf(selected) && (
                        <span className="text-[10px] font-bold uppercase px-[6px] py-[2px] rounded-full bg-primary-500/10 text-primary-500 shrink-0">
                          You
                        </span>
                      )}
                    </div>
                    <span className={`self-start py-[0.3rem] px-3 rounded-[30px] text-[11px] font-bold uppercase ${roleBadgeClass(selected.role)}`}>
                      {selected.roleLabel}
                    </span>
                  </div>
                </div>
              </DrawerHeader>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-10 py-6 flex flex-col gap-8">
                {/* Pending alert */}
                {selected.role === 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-[1.2rem] px-5 py-4 flex items-start gap-3">
                    <span className="text-[1.6rem] shrink-0">⚠️</span>
                    <p className="text-[1.4rem] text-amber-800 leading-7">
                      This admin has no access yet. Assign a role or set custom permissions below.
                    </p>
                  </div>
                )}

                {/* Details */}
                <div className="flex flex-col">
                  <div className="flex justify-between items-center py-4 border-b border-neutral-100">
                    <span className="text-[1.4rem] text-neutral-500 leading-8">Email</span>
                    <span className="text-[1.4rem] text-neutral-900 leading-8 font-medium">{selected.email}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-neutral-100">
                    <span className="text-[1.4rem] text-neutral-500 leading-8">Joined</span>
                    <span className="text-[1.4rem] text-neutral-900 leading-8 font-medium">
                      {formatDate(selected.createdAt, locale, "local")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-neutral-100">
                    <span className="text-[1.4rem] text-neutral-500 leading-8">Verification</span>
                    <span className={`py-[0.3rem] px-2 rounded-[30px] text-[11px] font-bold uppercase ${selected.isVerified ? "bg-neutral-100 text-success" : "bg-neutral-100 text-neutral-400"}`}>
                      {selected.isVerified ? "Verified" : "Unverified"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-neutral-100">
                    <span className="text-[1.4rem] text-neutral-500 leading-8">Access</span>
                    <span className="text-[1.4rem] text-neutral-900 leading-8 font-medium">
                      {selected.effectivePermissionKeys.length === 0
                        ? "No access"
                        : `${selected.effectivePermissionKeys.length} permissions`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-4">
                    <span className="text-[1.4rem] text-neutral-500 leading-8">Permission source</span>
                    <span className={`py-[0.3rem] px-2 rounded-[30px] text-[11px] font-bold uppercase ${selected.customPermissions !== null ? "bg-purple-50 text-purple-600" : "bg-neutral-100 text-neutral-500"}`}>
                      {selected.customPermissions !== null ? "Custom" : "Role defaults"}
                    </span>
                  </div>
                </div>

                {/* Role assignment */}
                {canEdit && !isOwner(selected) && (
                  <div className="flex flex-col gap-3">
                    <p className="text-[1.5rem] font-semibold text-neutral-900 font-primary">
                      Assign Role
                    </p>
                    <p className="text-[1.3rem] text-neutral-400 leading-6 -mt-1">
                      Setting a role clears any custom permissions.
                    </p>
                    <div className="relative">
                      <Select
                        value={String(selected.role)}
                        onValueChange={handleRoleChange}
                        disabled={isUpdatingRole}
                      >
                        <SelectTrigger className="bg-neutral-100 w-full cursor-pointer rounded-[3rem] py-[0.8rem] px-6 border-none text-[1.4rem] text-neutral-700 leading-8 disabled:opacity-60">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white text-[1.4rem] rounded-[1.2rem] border border-neutral-100 shadow-lg">
                          <SelectGroup>
                            {ROLE_OPTIONS.map((r) => (
                              <SelectItem
                                key={r.value}
                                className="text-[1.4rem] text-deep-100 py-3"
                                value={String(r.value)}
                              >
                                {r.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {isUpdatingRole && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <LoadingCircleSmall />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Custom permissions */}
                {canEdit && !isOwner(selected) && (
                  <button
                    onClick={openPermissionsModal}
                    className="w-full py-4 px-6 rounded-[3rem] border border-neutral-200 text-[1.4rem] text-neutral-700 font-medium leading-8 cursor-pointer hover:bg-neutral-50 transition-colors text-left flex items-center justify-between"
                  >
                    <span>Set Custom Permissions</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Footer */}
              <DrawerFooter className="px-10 pb-10 flex flex-col gap-3">
                {canDelete && !isSelf(selected) && !isOwner(selected) && (
                  <button
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="w-full py-4 px-6 rounded-[3rem] bg-failure/8 text-failure text-[1.5rem] font-medium leading-8 cursor-pointer hover:bg-failure/15 transition-colors"
                  >
                    Remove Admin
                  </button>
                )}
                <DrawerClose asChild>
                  <button className="w-full py-4 px-6 rounded-[3rem] border border-neutral-200 text-neutral-700 text-[1.5rem] font-medium leading-8 cursor-pointer hover:bg-neutral-50 transition-colors">
                    Close
                  </button>
                </DrawerClose>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>

      {/* ── Permissions Modal ──────────────────────────────────────────────── */}
      <Dialog open={permissionsModalOpen} onOpenChange={setPermissionsModalOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogTitle>Custom Permissions</DialogTitle>
          <p className="text-[1.4rem] text-neutral-500 leading-7 -mt-4 mb-2">
            Override <strong>{selected?.email}</strong>'s role defaults with specific permissions.
            An empty selection revokes all access.
          </p>

          <div className="flex flex-col gap-6">
            {PERMISSION_GROUPS.map(({ resource, label }) => {
              const groupKeys = ACTIONS.map((a) => `${resource}.${a}`);
              const allChecked = groupKeys.every((k) => draftPermissions.includes(k));
              const someChecked = groupKeys.some((k) => draftPermissions.includes(k));

              return (
                <div key={resource} className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      ref={(el) => { if (el) el.indeterminate = !allChecked && someChecked; }}
                      onChange={() => toggleGroup(resource)}
                      className="w-[1.6rem] h-[1.6rem] accent-primary-500 cursor-pointer"
                    />
                    <p className="text-[1.4rem] font-semibold text-neutral-900 font-primary">
                      {label}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-1 pl-9">
                    {ACTIONS.map((action) => {
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
                          <span className="text-[1.3rem] text-neutral-600 capitalize">{action}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="mt-6">
            <button
              onClick={() => setDraftPermissions([])}
              className="px-6 py-4 rounded-[3rem] border border-neutral-200 text-neutral-700 text-[1.4rem] font-medium leading-8 cursor-pointer hover:bg-neutral-50 transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={handleSavePermissions}
              disabled={isSavingPermissions}
              className="px-8 py-4 rounded-[3rem] bg-primary-500 text-white text-[1.4rem] font-medium leading-8 disabled:opacity-50 cursor-pointer flex items-center justify-center min-w-[140px]"
            >
              {isSavingPermissions ? <LoadingCircleSmall /> : "Save Permissions"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirm Dialog ──────────────────────────────────────────── */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogTitle>Remove Administrator</DialogTitle>
          <p className="text-[1.5rem] text-neutral-600 leading-8">
            Are you sure you want to remove{" "}
            <strong className="text-neutral-900">{selected?.email}</strong>?
            This action cannot be undone.
          </p>
          <DialogFooter className="mt-2">
            <button
              onClick={() => setDeleteConfirmOpen(false)}
              className="px-6 py-4 rounded-[3rem] border border-neutral-200 text-neutral-700 text-[1.4rem] font-medium leading-8 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-8 py-4 rounded-[3rem] bg-failure text-white text-[1.4rem] font-medium leading-8 disabled:opacity-50 cursor-pointer flex items-center justify-center min-w-[120px]"
            >
              {isDeleting ? <LoadingCircleSmall /> : "Yes, Remove"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
