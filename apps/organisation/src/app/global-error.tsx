"use client"; // Error boundaries must be Client Components
import Logo from "@/assets/images/logo-horizontal-orange-org.svg";
import { ButtonBlack, ButtonPrimary } from "@/components/shared/buttons";
import { I24Support, Logout, Warning2 } from "iconsax-reactjs";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  return (
    // global-error must include html and body tags
    <html>
      <body className="w-full h-dvh overflow-hidden flex flex-col items-center justify-center bg-neutral-200 p-8">
        <div className="bg-white rounded-[3rem] h-full w-full flex flex-col items-center justify-center">
          <div className="max-w-[700px] mx-auto overflow-y-scroll flex flex-col gap-16 p-4 lg:p-8 items-center ">
            <Image src={Logo} alt="Ticketwaze" />
            <div
              className={
                " h-full w-full justify-center mx-auto flex flex-col items-center gap-[3rem]"
              }
            >
              <div
                className={
                  "w-[120px] h-[120px] rounded-full flex items-center justify-center bg-neutral-100"
                }
              >
                <div
                  className={
                    "w-[90px] h-[90px] rounded-full flex items-center justify-center bg-neutral-200"
                  }
                >
                  <Warning2 size="50" color="#0d0d0d" variant="Bulk" />
                </div>
              </div>
              <div
                className={"flex flex-col gap-[3rem] items-center text-center"}
              >
                <p className={"text-[1.8rem] leading-[25px] text-neutral-600 "}>
                  Something went wrong while processing your request. This may
                  be due to a temporary issue, a weak internet connection, or an
                  unexpected error in the system. Please try again after a short
                  while. If the problem continues, check your connection and
                  restart the app. For further assistance, you can reach out to
                  our support team, who will be happy to help resolve the issue.
                </p>
              </div>
            </div>
            <div className="w-full flex flex-col lg:flex-row items-center gap-6">
              <ButtonPrimary
                onClick={() => router.replace("/auth/login")}
                className="flex-1 w-full flex items-center gap-4"
              >
                <Logout size="24" color="#fff" variant="Bulk" />
                Logout
              </ButtonPrimary>
              <ButtonBlack
                onClick={() =>
                  router.push(`${process.env.NEXT_PUBLIC_WEBSITE_URL}/contact`)
                }
                className="flex-1 w-full flex items-center gap-4"
              >
                <I24Support size="24" color="#fff" variant="Bulk" />
                Support
              </ButtonBlack>
            </div>
            <p className="text-[1rem] text-failure leading-8">
              {error.message}
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
