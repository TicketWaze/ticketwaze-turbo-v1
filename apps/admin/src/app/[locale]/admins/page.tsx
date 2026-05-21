import AdminLayout from "@/components/Layouts/AdminLayout";
import { auth } from "@/lib/auth";
import BackButton from "@/components/shared/BackButton";
import TopBar from "@/components/shared/TopBar";
import { getTranslations } from "next-intl/server";
import AdminList from "./components/AdminList";
import AddAdmin from "./components/AddAdmin";

export default async function AdminsPage() {
  const session = await auth();
  const t = await getTranslations("Admins");
  const request = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/admin/administrator`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    },
  );

  const response = await request.json();
  return (
    <AdminLayout>
      <div className="flex flex-col gap-8">
        <BackButton text={t("back")} />
        <TopBar title={t("title")}>
          {session?.user.role === 5 && <AddAdmin />}
        </TopBar>
      </div>
      <AdminList admins={response.admins} />
    </AdminLayout>
  );
}
