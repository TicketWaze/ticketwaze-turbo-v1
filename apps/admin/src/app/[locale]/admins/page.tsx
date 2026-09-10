import AdminLayout from "@/components/Layouts/AdminLayout";
import { auth } from "@/lib/auth";
import BackButton from "@/components/shared/BackButton";
import PageTitle, { PAGE_SCROLLER } from "@/components/shared/PageTitle";
import UnauthorizedView from "@/components/shared/UnauthorizedView";
import { getTranslations } from "next-intl/server";
import AdminsPageContent, { type AdminRecord } from "./components/AdminsPageContent";

export default async function AdminsPage() {
  const session = await auth();
  const t = await getTranslations("Admins");

  const effectiveKeys = (session?.user?.effectivePermissionKeys ?? []) as string[];
  const canView = effectiveKeys.includes("admins.view");

  const admins: AdminRecord[] = [];
  if (canView) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/admin/administrator`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user.accessToken}`,
        },
        cache: "no-store",
      },
    );
    const data = await res.json();
    if (data.status === "success") admins.push(...data.admins);
  }

  return (
    <AdminLayout>
      <div className={PAGE_SCROLLER}>
        <BackButton text={t("back")} />
        <PageTitle>{t("title")}</PageTitle>
        {canView ? <AdminsPageContent admins={admins} /> : <UnauthorizedView />}
      </div>
    </AdminLayout>
  );
}
