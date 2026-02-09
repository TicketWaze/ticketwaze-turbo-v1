import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type LinkProps = React.ComponentProps<"a"> & {
  children?: React.ReactNode;
  href: string;
  className?: string;
};

export function LinkPrimary({ href, children, className }: LinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "px-12 py-[1.2rem] bg-primary-500 border-2 border-transparent rounded-[100px] text-center text-white font-medium text-[1.5rem] h-auto leading-8 cursor-pointer hover:border-primary-600  transition-all duration-400 flex items-center justify-center",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function LinkSecondary({ href, children, className }: LinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "px-12 py-6 bg-primary-50 border-2 border-primary-500 rounded-[100px] text-center font-medium text-[1.5rem] leading-8  cursor-pointer hover:border-primary-200  text-primary-500 transition-all duration-400",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function LinkAccent({ href, children, className }: LinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "border-2  px-4 lg:px-12 py-6 rounded-[10rem] font-normal  flex-1 text-[1.5rem] leading-8 flex items-center justify-center gap-2 border-primary-500 text-primary-500 bg-primary-100",
        className,
      )}
    >
      {children}
    </Link>
  );
}
