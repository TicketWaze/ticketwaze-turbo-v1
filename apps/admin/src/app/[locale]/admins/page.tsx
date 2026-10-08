import AdminLayout from "@/components/Layouts/AdminLayout";
import { auth } from "@/lib/auth";
import { PAGE_SCROLLER } from "@/components/shared/PageTitle";
import SettingsHeader from "@/components/shared/SettingsHeader";
import UnauthorizedView from "@/components/shared/UnauthorizedView";
import { Reveal } from "@/components/shared/motion";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import AdminsPageContent, { type AdminRecord } from "./components/AdminsPageContent";
import Invitations, { type InvitationRecord } from "./components/Invitations";

/** Settings → Administrators: pending invitations, then the team. */
export default async function AdminsPage() {
  const session = await auth();
  const t = await getTranslations("Admins");

  const effectiveKeys = (session?.user?.effectivePermissionKeys ?? []) as string[];
  const canView = effectiveKeys.includes("admins.view");

  const admins: AdminRecord[] = [];
  const invitations: InvitationRecord[] = [];
  if (canView) {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.user.accessToken}`,
    };
    const [adminsData, invitationsData] = await Promise.all(
      ["", "/invitations"].map((path) =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/administrator${path}`, {
          headers,
          cache: "no-store",
        })
          .then((res) => res.json())
          .catch(() => null),
      ),
    );
    if (adminsData?.status === "success") admins.push(...adminsData.admins);
    if (invitationsData?.status === "success")
      invitations.push(...invitationsData.invitations);
  }

  return (
    <AdminLayout>
      <div className={cn(PAGE_SCROLLER, "gap-0")}>
        <SettingsHeader title={t("title")} description={t("description")} />
        {canView ? (
          <div className="flex flex-col gap-12 pb-10">
            <Reveal>
              <Invitations
                initialInvitations={invitations}
                canInvite={effectiveKeys.includes("admins.create")}
              />
            </Reveal>
            <Reveal delay={0.05}>
              <AdminsPageContent admins={admins} />
            </Reveal>
          </div>
        ) : (
          <UnauthorizedView />
        )}
      </div>
    </AdminLayout>
  );
}
