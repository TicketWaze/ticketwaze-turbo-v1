"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { getSocket } from "@/hooks/useSocket";

type AdminSocketContextValue = {
  liveThreadBadge: number;
  contactBadge: number;
  clearLiveThreadBadge: () => void;
  clearContactBadge: () => void;
};

const AdminSocketContext = createContext<AdminSocketContextValue>({
  liveThreadBadge: 0,
  contactBadge: 0,
  clearLiveThreadBadge: () => {},
  clearContactBadge: () => {},
});

export function useAdminSocket() {
  return useContext(AdminSocketContext);
}

export function AdminSocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [liveThreadBadge, setLiveThreadBadge] = useState(0);
  const [contactBadge, setContactBadge] = useState(0);
  const connectedRef = useRef(false);

  const clearLiveThreadBadge = useCallback(() => setLiveThreadBadge(0), []);
  const clearContactBadge = useCallback(() => setContactBadge(0), []);

  const token = (session?.user as { accessToken?: string } | undefined)
    ?.accessToken;

  useEffect(() => {
    if (!token || connectedRef.current) return;
    connectedRef.current = true;

    const socket = getSocket();
    socket.auth = { token };
    socket.connect();
    socket.emit("admin:join", { token });

    const onThreadNew = (data: {
      threadId: string;
      fullName: string;
      subject: string;
    }) => {
      setLiveThreadBadge((n) => n + 1);
      toast.info(`New live chat from ${data.fullName}`, {
        description: data.subject,
      });
    };

    const onContactNew = (data: {
      contactMessageId: string;
      fullName: string;
      subject: string;
    }) => {
      setContactBadge((n) => n + 1);
      toast.info(`New contact message from ${data.fullName}`, {
        description: data.subject,
      });
    };

    const onError = (err: { message: string }) => {
      console.error("[WS Admin]", err.message);
    };

    socket.on("support:thread:new", onThreadNew);
    socket.on("contact:new", onContactNew);
    socket.on("error", onError);

    return () => {
      socket.off("support:thread:new", onThreadNew);
      socket.off("contact:new", onContactNew);
      socket.off("error", onError);
      socket.disconnect();
      connectedRef.current = false;
    };
  }, [token]);

  return (
    <AdminSocketContext.Provider
      value={{
        liveThreadBadge,
        contactBadge,
        clearLiveThreadBadge,
        clearContactBadge,
      }}
    >
      {children}
    </AdminSocketContext.Provider>
  );
}
