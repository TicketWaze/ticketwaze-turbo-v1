import React from "react";
import SidebarShell from "@/components/Layouts/SidebarShell";
import WelcomeTrialModal from "@/components/WelcomeTrialModal";

function OrganizerLayout({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <>
      <WelcomeTrialModal />
      {/* The shell is a client component only because the sidebar collapses;
          `children` stays server-rendered and is passed straight through. */}
      <SidebarShell className={className}>{children}</SidebarShell>
    </>
  );
}

export default OrganizerLayout;
