"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "@/lib/api-client";
import { useAuthContext } from "@/providers/AuthProvider";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/api/query-keys";

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
}

const SocketContext = createContext<SocketContextValue>({ socket: null, connected: false });

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!user?.id) {
      socket?.disconnect();
      setSocket(null);
      setConnected(false);
      return;
    }

    const s = io(API_BASE_URL, {
      path: "/socket.io",
      auth: { userId: user.id },
      transports: ["websocket", "polling"],
    });

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));

    const invalidateAll = () => {
      qc.invalidateQueries({ queryKey: queryKeys.wallet.balance });
      qc.invalidateQueries({ queryKey: ["wallet", "ledger"] });
      qc.invalidateQueries({ queryKey: queryKeys.club.matrices });
      qc.invalidateQueries({ queryKey: queryKeys.pilot.matrices });
      qc.invalidateQueries({ queryKey: queryKeys.dashboard.cache });
      qc.invalidateQueries({ queryKey: queryKeys.referral.direct() });
      qc.invalidateQueries({ queryKey: queryKeys.referral.teamSize });
    };

    s.on("placement_complete", invalidateAll);
    s.on("new_referral", invalidateAll);
    s.on("withdraw_approved", invalidateAll);
    s.on("cycle_complete", invalidateAll);
    s.on("auto_upgrade", invalidateAll);
    s.on("new_income", invalidateAll);

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [user?.id, qc]);

  const value = useMemo(() => ({ socket, connected }), [socket, connected]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  return useContext(SocketContext);
}
