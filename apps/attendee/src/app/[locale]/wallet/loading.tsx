import AttendeeLayout from "@/components/Layouts/AttendeeLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Loading() {
  return (
    <AttendeeLayout
      title=""
      className="h-full flex items-center "
    >
      <div className="w-full flex flex-col gap-10 h-screen overflow-hidden">
        {/* Header */}
        <header className="w-full flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <div className="h-[1.6rem] w-48 bg-neutral-100 rounded-full animate-pulse" />
            <div className="h-[2.4rem] lg:h-[3.2rem] w-[16rem] lg:w-104 bg-neutral-200 rounded-full animate-pulse mt-1" />
          </div>
        </header>

        <div>
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-neutral-100 mb-10 border-neutral-100 border-b">
            <div className="pb-12 flex flex-col gap-2">
              <div className="h-[1.4rem] w-32 bg-neutral-100 rounded-full animate-pulse" />
              <div className="h-[1.6rem] lg:h-10 w-28 lg:w-36 bg-neutral-200 rounded-full animate-pulse" />
            </div>
            <div className="pb-12 pl-12 flex flex-col gap-2">
              <div className="h-[1.4rem] w-28 bg-neutral-100 rounded-full animate-pulse" />
              <div className="h-[1.6rem] lg:h-10 w-24 lg:w-32 bg-neutral-200 rounded-full animate-pulse" />
            </div>
            <div className="pb-12 lg:pl-12 flex flex-col gap-2">
              <div className="h-[1.4rem] w-36 bg-neutral-100 rounded-full animate-pulse" />
              <div className="h-[1.6rem] lg:h-10 w-20 lg:w-24 bg-neutral-200 rounded-full animate-pulse" />
            </div>
            <div className="pb-12 pl-12 flex flex-row gap-6 items-start">
              <div className="flex flex-col gap-2">
                <div className="h-[1.4rem] w-28 bg-neutral-100 rounded-full animate-pulse" />
                <div className="h-[1.6rem] lg:h-10 w-12 lg:w-16 bg-neutral-200 rounded-full animate-pulse" />
              </div>
              <div className="w-[2.4rem] h-[2.4rem] bg-neutral-100 rounded-full animate-pulse mt-1" />
            </div>
          </div>
          <div className="flex flex-col gap-8">
            <div className="h-[1.8rem] w-56 bg-neutral-200 rounded-full animate-pulse" />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pb-6">
                    <div className="h-[1.7rem] w-24 bg-neutral-100 rounded-full animate-pulse" />
                  </TableHead>
                  <TableHead className="pb-6 hidden lg:table-cell">
                    <div className="h-[1.7rem] w-28 bg-neutral-100 rounded-full animate-pulse" />
                  </TableHead>
                  <TableHead className="pb-6 hidden lg:table-cell">
                    <div className="h-[1.7rem] w-18 bg-neutral-100 rounded-full animate-pulse" />
                  </TableHead>
                  <TableHead className="pb-6">
                    <div className="h-[1.7rem] w-18 bg-neutral-100 rounded-full animate-pulse" />
                  </TableHead>
                  <TableHead className="pb-6">
                    <div className="h-[1.7rem] w-18 bg-neutral-100 rounded-full animate-pulse" />
                  </TableHead>
                  <TableHead className="pb-6 hidden lg:table-cell">
                    <div className="h-[1.7rem] w-18 bg-neutral-100 rounded-full animate-pulse" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="py-6">
                      <div className="h-[1.7rem] w-28 bg-neutral-200 rounded-full animate-pulse" />
                    </TableCell>
                    <TableCell className="py-6 hidden lg:table-cell">
                      <div className="h-[1.7rem] w-22 bg-neutral-100 rounded-full animate-pulse" />
                    </TableCell>

                    <TableCell className="py-6 hidden lg:table-cell">
                      <div className="h-[1.7rem] w-14 bg-neutral-100 rounded-full animate-pulse" />
                    </TableCell>
                    {/* Amount: 1,500 HTG */}
                    <TableCell className="py-6">
                      <div className="h-[1.7rem] w-24 bg-neutral-200 rounded-full animate-pulse" />
                    </TableCell>
                    {/* Status badge: SUCCESSFUL */}
                    <TableCell className="py-6">
                      <div className="h-[1.7rem] w-28 bg-neutral-100 rounded-[30px] animate-pulse" />
                    </TableCell>
                    {/* Date: 12 Jan 2025 */}
                    <TableCell className="py-6 hidden lg:table-cell">
                      <div className="h-[1.7rem] w-22 bg-neutral-100 rounded-full animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-col gap-8 mt-12">
            <div className="h-[1.8rem] w-56 bg-neutral-200 rounded-full animate-pulse" />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pb-6">
                    <div className="h-[1.7rem] w-24 bg-neutral-100 rounded-full animate-pulse" />
                  </TableHead>
                  <TableHead className="pb-6 hidden lg:table-cell">
                    <div className="h-[1.7rem] w-28 bg-neutral-100 rounded-full animate-pulse" />
                  </TableHead>
                  <TableHead className="pb-6 hidden lg:table-cell">
                    <div className="h-[1.7rem] w-18 bg-neutral-100 rounded-full animate-pulse" />
                  </TableHead>
                  <TableHead className="pb-6">
                    <div className="h-[1.7rem] w-18 bg-neutral-100 rounded-full animate-pulse" />
                  </TableHead>
                  <TableHead className="pb-6">
                    <div className="h-[1.7rem] w-18 bg-neutral-100 rounded-full animate-pulse" />
                  </TableHead>
                  <TableHead className="pb-6 hidden lg:table-cell">
                    <div className="h-[1.7rem] w-18 bg-neutral-100 rounded-full animate-pulse" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="py-6">
                      <div className="h-[1.7rem] w-28 bg-neutral-200 rounded-full animate-pulse" />
                    </TableCell>
                    <TableCell className="py-6 hidden lg:table-cell">
                      <div className="h-[1.7rem] w-22 bg-neutral-100 rounded-full animate-pulse" />
                    </TableCell>

                    <TableCell className="py-6 hidden lg:table-cell">
                      <div className="h-[1.7rem] w-14 bg-neutral-100 rounded-full animate-pulse" />
                    </TableCell>
                    {/* Amount: 1,500 HTG */}
                    <TableCell className="py-6">
                      <div className="h-[1.7rem] w-24 bg-neutral-200 rounded-full animate-pulse" />
                    </TableCell>
                    {/* Status badge: SUCCESSFUL */}
                    <TableCell className="py-6">
                      <div className="h-[1.7rem] w-28 bg-neutral-100 rounded-[30px] animate-pulse" />
                    </TableCell>
                    {/* Date: 12 Jan 2025 */}
                    <TableCell className="py-6 hidden lg:table-cell">
                      <div className="h-[1.7rem] w-22 bg-neutral-100 rounded-full animate-pulse" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
      </div>
    </AttendeeLayout>
  );
}
