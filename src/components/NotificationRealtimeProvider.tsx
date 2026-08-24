"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { env } from "@/lib/env";

type RealtimeMessage = {
  event: "connection.ready" | "notification.created" | "notification.changed";
  data: {
    role?: "ADMIN" | "USER";
    title?: string;
    body?: string | null;
    link?: string | null;
    unreadCount?: number;
  };
};

const websocketUrl = (): string => {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  const backendOrigin = env.apiBaseUrl.replace(/\/api\/v\d+\/?$/, "");
  return `${backendOrigin.replace(/^http/, "ws")}/ws/notifications`;
};

export function NotificationRealtimeProvider() {
  const queryClient = useQueryClient();
  const attempts = useRef(0);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const connect = () => {
      if (disposed || typeof window === "undefined") return;
      socket = new WebSocket(websocketUrl());

      socket.addEventListener("open", () => {
        attempts.current = 0;
      });

      socket.addEventListener("message", (message) => {
        let payload: RealtimeMessage;
        try {
          payload = JSON.parse(String(message.data)) as RealtimeMessage;
        } catch {
          return;
        }
        if (
          payload.event !== "notification.created" &&
          payload.event !== "notification.changed"
        ) {
          return;
        }

        void queryClient.invalidateQueries({ queryKey: ["notifications"] });
        void queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
        if (payload.data.unreadCount !== undefined) {
          queryClient.setQueryData(["notifications", "unread-count"], {
            unreadCount: payload.data.unreadCount,
          });
        }
        if (payload.event === "notification.created" && payload.data.title) {
          toast(payload.data.title, {
            icon: payload.data.role === "ADMIN" ? "🛡️" : "🔔",
          });
        }
      });

      socket.addEventListener("close", () => {
        if (disposed) return;
        attempts.current += 1;
        const delay = Math.min(30_000, 1_000 * 2 ** Math.min(attempts.current, 5));
        retryTimer = setTimeout(connect, delay);
      });
    };

    connect();
    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close();
    };
  }, [queryClient]);

  return null;
}
