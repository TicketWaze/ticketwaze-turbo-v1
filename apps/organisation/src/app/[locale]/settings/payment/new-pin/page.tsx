import OrganizerLayout from "@/components/Layouts/OrganizerLayout";
import ParameterMissingView from "@/components/Layouts/ParameterMissingView";
import NewPinForm from "./NewPinForm";

export default async function NewPin({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const changePinToken = (await searchParams).changePinToken;
  if (!changePinToken || changePinToken.length === 0) {
    return (
      <OrganizerLayout title="">
        <ParameterMissingView redirectTo="/settings/payment" />
      </OrganizerLayout>
    );
  }
  return (
    <OrganizerLayout title="">
      <NewPinForm changePinToken={changePinToken} />
    </OrganizerLayout>
  );
}
