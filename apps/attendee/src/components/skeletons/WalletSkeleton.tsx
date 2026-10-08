import { cn } from "@/lib/utils";
import { Bone, SkeletonPage, TextBone } from "./Skeleton";

/** "Hello Name" over the page title, as on Wallet and Transactions. */
function GreetingHeader({ search = false }: { search?: boolean }) {
  return (
    <header className="w-full flex items-center justify-between">
      <div className="flex flex-col gap-[5px]">
        <TextBone className="w-32 h-[1.4rem]" />
        <TextBone line="h-[2.5rem] lg:h-12" className="h-[1.8rem] lg:h-[2.6rem] w-[16rem] lg:w-[22rem]" strong />
      </div>
      {search && <Bone className="hidden lg:block w-[24.3rem] h-[4rem]" />}
    </header>
  );
}

/**
 * The orders table: uppercase headings, then rows. `cols` marks which
 * columns hide on phones, as the real table does.
 */
function TableBone({ cols, rows = 8 }: { cols: boolean[]; rows?: number }) {
  const widths = ["w-24", "w-20", "w-10", "w-24", "w-20", "w-28"];
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-neutral-100">
          {cols.map((desktopOnly, i) => (
            <th key={i} className={cn("pb-6 text-left", desktopOnly && "hidden lg:table-cell")}>
              <Bone className="h-[1.1rem] w-16" strong />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r} className="border-b border-neutral-100">
            {cols.map((desktopOnly, i) => (
              <td key={i} className={cn("py-6 pr-4", desktopOnly && "hidden lg:table-cell")}>
                {i === 4 ? (
                  <Bone className="h-[2.4rem] w-24" />
                ) : (
                  <TextBone className={cn(widths[i % widths.length], "h-[1.3rem]")} />
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ID, provider (desktop), class (desktop), amount, status, date (desktop).
const ORDER_COLUMNS = [false, true, true, false, false, true];

/** Wallet: greeting header, the four balance tiles, then the latest orders. */
export default function WalletSkeleton() {
  return (
    <SkeletonPage>
      <div className="flex flex-col gap-10 overflow-hidden">
        <GreetingHeader />
        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-neutral-100 mb-10 border-neutral-100 border-b">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "pb-[30px] flex flex-col gap-[5px]",
                  i === 1 || i === 3 ? "pl-[30px]" : i === 2 ? "lg:pl-[30px]" : "",
                )}
              >
                <TextBone className="w-28 h-[1.4rem]" />
                <TextBone line="h-[30px]" className="h-[1.6rem] lg:h-[2.5rem] w-32 lg:w-40" strong />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-8">
            <TextBone line="h-[25px]" className="h-[1.8rem] w-48" strong />
            <TableBone cols={ORDER_COLUMNS} />
          </div>
        </div>
      </div>
    </SkeletonPage>
  );
}

/** Wallet → all transactions: greeting header with search, then the table. */
export function TransactionsSkeleton() {
  return (
    <SkeletonPage>
      <div className="flex flex-col gap-10 overflow-hidden">
        <GreetingHeader search />
        <div className="flex flex-col gap-8">
          <Bone className="lg:hidden w-full h-[4rem]" />
          <TableBone cols={ORDER_COLUMNS} rows={10} />
        </div>
      </div>
    </SkeletonPage>
  );
}

/** Purchases: title, then the ruled purchase rows (thumb, name, line, action). */
export function PurchasesSkeleton() {
  return (
    <SkeletonPage>
      <div className="flex flex-col gap-8 pb-16">
        <TextBone line="h-10 lg:h-12" className="h-[1.8rem] lg:h-[2.6rem] w-[18rem]" strong />
        <ul className="flex flex-col gap-6">
          {[0, 1, 2, 3].map((i) => (
            <li
              key={i}
              className="flex flex-col lg:flex-row lg:items-center gap-6 justify-between rounded-[15px] border border-neutral-100 p-6"
            >
              <div className="flex items-center gap-6 min-w-0">
                <Bone className="w-[64px] h-[64px] rounded-[10px]" />
                <div className="flex flex-col gap-1">
                  <TextBone className="w-48 h-[1.5rem]" strong />
                  <TextBone line="h-6" className="w-32 h-4" />
                </div>
              </div>
              <Bone className="h-[4.4rem] w-[16rem]" strong />
            </li>
          ))}
        </ul>
      </div>
    </SkeletonPage>
  );
}
