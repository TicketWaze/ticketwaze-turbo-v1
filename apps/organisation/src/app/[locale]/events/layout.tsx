import SectionIntlProvider from "@/components/i18n/SectionIntlProvider";

/** The messages this section's client components use (see SectionIntlProvider). */
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SectionIntlProvider
      namespaces={[
        "Auth",
        "Events",
        "Finance",
        "Layout",
        "Raffles",
        "Sales",
        "Settings",
        "WelcomeModal",
      ]}
    >
      {children}
    </SectionIntlProvider>
  );
}
