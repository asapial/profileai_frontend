"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

/** Slim profile DTO used by the resume wizard "review profile" step. */
export type MyProfile = {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  headline: string | null;
  location: string | null;
  bio: string | null;
  skills: string[];
  languages: string[];
};

export function useMyProfile() {
  return useQuery({
    queryKey: ["user", "profile", "me"],
    queryFn: () => api.get<MyProfile>("/user/profile"),
    staleTime: 60 * 1000,
  });
}