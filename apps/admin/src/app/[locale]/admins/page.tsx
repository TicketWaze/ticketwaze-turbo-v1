import AdminLayout from "@/components/Layouts/AdminLayout";
import { auth } from "@/lib/auth";
import MemberList from "./components/MemberList";
import BackButton from "@/components/shared/BackButton";
import TopBar from "@/components/shared/TopBar";
import { getTranslations } from "next-intl/server";

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
  console.log(response);
  return (
    <AdminLayout>
      <div className="flex flex-col gap-8">
        <BackButton text={t("back")} />
        <TopBar title={t("title")}>
          {/* {authorized && <AddMember totalMembers={totalMembers} />} */}
        </TopBar>
      </div>
      <MemberList users={response.users} />
    </AdminLayout>
  );
}
