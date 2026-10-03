import type { Metadata } from "next";

// A support conversation is private and reached by its secret token only;
// it must never be indexed or show up in search results.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function SupportChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-10  p-4 lg:p-10 bg-neutral-100 overflow-hidden">
      {children}
    </div>
  );
}
