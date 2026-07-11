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

type ProfileApiResponse = {
  email?: string | null;
  profile?: Omit<MyProfile, "email"> | null;
};

export function useMyProfile() {
  return useQuery({
    queryKey: ["user", "profile", "me"],
    queryFn: async () => {
      const data = await api.get<ProfileApiResponse>("/user/profile");
      const profile = data.profile ?? ({} as NonNullable<ProfileApiResponse["profile"]>);
      return {
        firstName: profile.firstName ?? null,
        lastName: profile.lastName ?? null,
        email: data.email ?? null,
        phone: profile.phone ?? null,
        headline: profile.headline ?? null,
        location: profile.location ?? null,
        bio: profile.bio ?? null,
        skills: profile.skills ?? [],
        languages: profile.languages ?? [],
      } satisfies MyProfile;
    },
    staleTime: 60 * 1000,
  });
}
