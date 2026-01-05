"use client";
import { ReactNode, useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

interface Tab {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
}

interface TabsContextType {
  activeTab: number;
  setActiveTab: (id: number) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

const useTabs = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a TabsProvider");
  }
  return context;
};

export function TabsProvider({
  children,
  defaultValue,
  className,
}: {
  children: ReactNode;
  defaultValue: number;
  className?: string;
}) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn("w-full h-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("rounded-xs h-fit", className)}>{children}</div>;
}

export function TabItem({
  children,
  value,
  index,
}: {
  children: ReactNode;
  value: number;
  index: number;
}) {
  const { activeTab, setActiveTab } = useTabs();

  return (
    <motion.div
      className={`rounded-[3rem] overflow-hidden flex flex-col gap-8 p-12 ${
        activeTab === value ? "active bg-white" : "bg-deep-100 "
      }`}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </motion.div>
  );
}

export function TabHeader({
  children,
  value,
  number,
}: {
  children: ReactNode;
  value: number;
  number: string;
}) {
  const { activeTab } = useTabs();
  return (
    <h3
      className={`cursor-pointer transition-all font-semibold text-[2.2rem] leading-12 flex justify-between items-center ${
        activeTab === value ? "active text-deep-200" : " text-neutral-400"
      }`}
    >
      {children}
      <span
        className={`${activeTab === value ? "text-neutral-700" : "text-neutral-400"}`}
      >
        {number}
      </span>
    </h3>
  );
}

export function TabDes({
  children,
  value,
}: {
  children: ReactNode;
  value: number;
}) {
  const { activeTab } = useTabs();
  return (
    <AnimatePresence mode="sync">
      {activeTab === value && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
            delay: 0.14,
          }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function TabImageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("", className)}>
      <AnimatePresence mode="popLayout">{children}</AnimatePresence>
    </div>
  );
}

export function TabImage({ children }: { children: ReactNode }) {
  return (
    <motion.div className="overflow-hidden">
      <motion.div
        initial={{ opacity: 0, overflow: "hidden" }}
        animate={{ opacity: 1, overflow: "hidden" }}
        exit={{ opacity: 0, overflow: "hidden" }}
        transition={{
          duration: 0.4,
          delay: 0.2,
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
