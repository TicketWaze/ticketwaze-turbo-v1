import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import { auth } from "@/lib/auth";
import RedirectContent from "./RedirectContent";
import { User } from "@ticketwaze/typescript-config";

export default async function SuccessStripe({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const orderId = searchParams?.orderId;
  const session = await auth();
  return (
    <AttendeeLayout className="items-center justify-center" title="">
      <RedirectContent
        orderId={orderId as string}
        user={session?.user as User}
      />
      {/* <div className='flex flex-col gap-16 items-center max-w-[530px]'>
        <Image src={Success} alt='success icon' width={150} height={150} />
        <div className='text-center flex flex-col gap-8'>
          <span className='font-primary font-medium text-[3.2rem] leading-12 text-black'>{t('purchased')}</span>
          <p className='text-[1.8rem] leading-8 text-neutral-700'>{t('purchased_text')}</p>
        </div>
        <div className=' flex items-center gap-4'>
          <LoadingCircleSmall />
          <span className='text-[1.8rem] leading-8 text-primary-500'>{t('purchased_cta')}</span>
        </div>
      </div> */}
    </AttendeeLayout>
  );
}
