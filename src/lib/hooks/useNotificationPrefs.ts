"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type NotificationPreferences = {
  id: string;
  userId: string;
  emailMarketing: boolean;
  emailProduct: boolean;
  emailSecurity: boolean;
  emailResumeTips: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  digestFrequency: "OFF" | "DAILY" | "WEEKLY";
};

export function useNotificationPrefs() {
  return useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () =>
      api.get<NotificationPreferences>("/user/notification-preferences"),
  });
}

export function useUpdateNotificationPrefs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<NotificationPreferences>) =>
      api.patch<NotificationPreferences>(
        "/user/notification-preferences",
        body
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["notification-preferences"] }),
  });
}
