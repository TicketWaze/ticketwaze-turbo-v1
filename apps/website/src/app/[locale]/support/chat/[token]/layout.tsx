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
