"use client";
import LogoSimpleOrange from "@ticketwaze/ui/assets/images/logo-simple-orange.svg";
import { ButtonBlack, ButtonPrimary } from "@/components/shared/buttons";
import { I24Support, Logout } from "iconsax-reactjs";
import Image from "next/image";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="w-full h-dvh overflow-hidden flex flex-col items-center justify-center bg-neutral-200 p-8">
        <style>{`
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(32px); }
            to   { opacity: 1; transform: translateY(0);    }
          }
          @keyframes pulseRing {
            0%, 100% { transform: scale(1);    opacity: 1;   }
            50%       { transform: scale(1.07); opacity: 0.75; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px);  }
            50%       { transform: translateY(-10px); }
          }
          .anim-fade-in-up  { animation: fadeInUp  0.65s ease-out forwards; }
          .anim-pulse-ring  { animation: pulseRing  2.8s ease-in-out infinite; }
          .anim-float       { animation: float      3.2s ease-in-out infinite; }
        `}</style>

        <div className="bg-white rounded-[3rem] h-full w-full flex flex-col items-center justify-center">
          <div className="max-w-[580px] mx-auto flex flex-col gap-12 p-6 lg:p-10 items-center anim-fade-in-up">

            {/* Animated logo bubble */}
            <div className="anim-float">
              <div className="w-[180px] h-[180px] rounded-full flex items-center justify-center bg-orange-50 anim-pulse-ring">
                <div className="w-[136px] h-[136px] rounded-full flex items-center justify-center bg-orange-100">
                  <Image src={LogoSimpleOrange} alt="Ticketwaze" width={72} />
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="flex flex-col gap-5 items-center text-center">
              <h1 className="text-[2.2rem] font-bold leading-snug text-deep-100">
                Oups, quelque chose s&apos;est mal passé
              </h1>
              <p className="text-[1.5rem] leading-[2.6rem] text-neutral-600">
                Une erreur inattendue s&apos;est produite. Vérifiez votre
                connexion internet et réessayez. Si le problème persiste,
                notre équipe de support est disponible pour vous aider.
              </p>
            </div>

            {/* Actions */}
            <div className="w-full flex flex-col lg:flex-row items-center gap-6">
              <ButtonPrimary
                onClick={() => (window.location.href = "/auth/login")}
                className="flex-1 w-full flex items-center gap-4"
              >
                <Logout size="24" color="#fff" variant="Bulk" />
                Se déconnecter
              </ButtonPrimary>
              <ButtonBlack
                onClick={() =>
                  (window.location.href = `${process.env.NEXT_PUBLIC_WEBSITE_URL}/contact`)
                }
                className="flex-1 w-full flex items-center gap-4"
              >
                <I24Support size="24" color="#fff" variant="Bulk" />
                Contacter le support
              </ButtonBlack>
            </div>

            {error.message && (
              <p className="text-[1rem] text-failure leading-8 text-center">
                {error.message}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
