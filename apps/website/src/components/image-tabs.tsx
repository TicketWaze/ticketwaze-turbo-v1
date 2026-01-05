"use client";
import React, { ReactNode, useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
// import { useMediaQuery } from '@/hooks/use-media-query';

interface Tab {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

interface TabsContextType {
  activeTab: string;
  setActiveTab: (id: string) => void;
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
  defaultValue: string;
  className?: string;
}) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  //   const isDesktop = useMediaQuery('(min-width: 768px)');
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
  return <div className={cn("rounded-xs", className)}>{children}</div>;
}

export function TabItem({
  children,
  value,
  index,
}: {
  children: ReactNode;
  value: string;
  index: number;
}) {
  const { activeTab, setActiveTab } = useTabs();

  return (
    <motion.div
      className={`rounded-[2rem] cursor-pointer py-8 px-[3rem] overflow-hidden ${
        activeTab === value ? "active bg-primary-500" : "bg-neutral-100"
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
}: {
  children: ReactNode;
  value: string;
}) {
  const { activeTab } = useTabs();
  return (
    <button
      className={` transition-all font-medium font-primary text-[2.6rem] lg:text-[3.8rem] flex justify-between items-center ${
        activeTab === value ? "active text-white" : "text-deep-100"
      }`}
    >
      {children}
    </button>
  );
}

export function TabDes({
  children,
  value,
}: {
  children: ReactNode;
  value: string;
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
          <p className={`dark:bg-white bg-[#F2F2F2] text-black p-3`}>
            {children}
          </p>
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

export function TabImage({
  children,
  value,
  index,
}: {
  children: ReactNode;
  value: string;
  index: number;
}) {
  const { activeTab } = useTabs();

  if (activeTab !== value) return null;

  return (
    <motion.div className=" overflow-hidden">
      <motion.div
        initial={{ opacity: 0, overflow: "hidden" }}
        animate={{ opacity: 1, overflow: "hidden" }}
        exit={{ opacity: 0, overflow: "hidden" }}
        transition={{
          duration: 0.4,
          delay: 0.2,
        }}
        className="flex flex-col gap-8"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
