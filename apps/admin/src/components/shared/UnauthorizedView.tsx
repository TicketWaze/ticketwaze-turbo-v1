import { ShieldSlash } from "iconsax-reactjs";

export default function UnauthorizedView() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 py-24 text-center">
      <div className="w-[7rem] h-[7rem] rounded-full bg-neutral-100 flex items-center justify-center">
        <ShieldSlash size="32" color="#a3a3a3" variant="Bulk" />
      </div>
      <div className="flex flex-col gap-2 max-w-[360px]">
        <h2 className="font-primary font-semibold text-[2.2rem] leading-10 text-neutral-900">
          Access Restricted
        </h2>
        <p className="text-[1.5rem] leading-8 text-neutral-500">
          You don't have permission to view this page. Contact the owner to
          request access.
        </p>
      </div>
    </div>
  );
}
