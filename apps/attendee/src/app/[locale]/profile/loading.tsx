import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { Image as ImageIcon, UserCirlceAdd } from "iconsax-reactjs";

export default function Loading() {
  return (
    <AttendeeLayout
      title=""
      className="h-full flex items-center justify-center"
    >
      <>
        {/* TopBar */}
        <div className="w-full flex items-center justify-between mb-2">
          <div className="h-[2.4rem] w-40 bg-neutral-200 rounded-full animate-pulse" />
          {/* Bouton referral */}
          <div className="h-[3.6rem] w-[4.4rem] lg:w-52 bg-neutral-100 rounded-full animate-pulse" />
        </div>

        <div className="flex flex-col gap-16 w-full lg:w-212 mx-auto overflow-hidden h-screen">
          {/* ProfileImage — avatar centré */}
          <div className="items-center justify-center bg-neutral-300 p-12 rounded-[30px] flex flex-col lg:flex-row  gap-10 animate-pulse">
            <div
              className={
                "p-8 hidden lg:block rounded-[50px] bg-neutral-100 animate-pulse"
              }
            >
              <UserCirlceAdd size={120} color={"#e3e5e8"} variant={"Bulk"} />
            </div>
            <div
              className={"p-4 w-fit lg:hidden rounded-[15px] bg-neutral-100"}
            >
              <UserCirlceAdd size={50} color={"#e3e5e8"} variant={"Bulk"} />
            </div>
            <div
              className={
                "flex flex-1 flex-col gap-8 lg:gap-[2.8rem] justify-center"
              }
            >
              <div
                className={
                  "h-[2.6rem] lg:h-18 w-60 bg-neutral-100 rounded-full animate-pulse"
                }
              />
              <div
                className={
                  "h-15 lg:h-20 px-6 lg:px-12 py-4 relative rounded-[100px] flex items-center justify-center gap-2 bg-neutral-200"
                }
              />
            </div>
          </div>
          {/* Infos personnelles + form */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col lg:gap-8">
              <div className="h-[1.9rem] w-56 bg-neutral-200 rounded-full animate-pulse lg:mb-4" />
              {/* firstName + lastName */}
              <div className="flex flex-col lg:flex-row items-center gap-8 w-full">
                <div className="w-full flex-1 h-[5.2rem] bg-neutral-100 rounded-full animate-pulse" />
                <div className="w-full flex-1 h-[5.2rem] bg-neutral-100 rounded-full animate-pulse" />
              </div>
            </div>
            {/* email */}
            <div className="w-full h-[5.2rem] bg-neutral-200 rounded-full animate-pulse" />
            {/* bouton save */}
            <div className="w-full h-[4.8rem] bg-neutral-200 rounded-full animate-pulse" />
            <div className="lg:hidden w-full h-[4.8rem] bg-neutral-200 rounded-full animate-pulse" />
          </div>

          {/* ChangePassword */}
          <div className="flex flex-col gap-8">
            <div className="h-[1.9rem] w-[16rem] bg-neutral-200 rounded-full animate-pulse mb-4" />
            <div className="w-full h-[5.2rem] bg-neutral-200 rounded-full animate-pulse" />
            <div className="w-full h-[5.2rem] bg-neutral-200 rounded-full animate-pulse" />
            <div className="w-full h-[4.8rem] bg-neutral-200 rounded-full animate-pulse" />
            <div className="lg:hidden w-full h-[4.8rem] bg-neutral-200 rounded-full animate-pulse" />
            <div className="lg:hidden w-full h-[4.8rem] bg-neutral-200 rounded-full animate-pulse" />
            <div className="lg:hidden w-full h-[4.8rem] bg-neutral-200 rounded-full animate-pulse" />
            <div className="lg:hidden w-full h-[4.8rem] bg-neutral-200 rounded-full animate-pulse" />
          </div>
        </div>
      </>
    </AttendeeLayout>
  );
}
