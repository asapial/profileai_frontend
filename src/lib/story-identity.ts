/**
 * Personalization for the career story.
 *
 * When a visitor is signed in, the story's sample resume carries their name
 * and email (the body of the document stays illustrative). Guests keep the
 * illustrative Alex Morgan profile, so the public page never depends on auth
 * being reachable.
 */

export type StoryIdentity = {
  /** True when the identity comes from a signed-in account. */
  personal: boolean;
  name: string;
  firstName: string;
  email: string;
};

export const ILLUSTRATIVE_IDENTITY: StoryIdentity = {
  personal: false,
  name: "Alex Morgan",
  firstName: "Alex",
  email: "alex@example.com",
};

/** Structural subset of `CurrentUser` — avoids importing the auth graph here. */
type IdentitySource = {
  name?: string | null;
  email?: string | null;
  profile?: { firstName?: string | null; lastName?: string | null } | null;
} | null | undefined;

export function storyIdentityFrom(user: IdentitySource): StoryIdentity {
  if (!user) return ILLUSTRATIVE_IDENTITY;
  const first = user.profile?.firstName?.trim() ?? "";
  const last = user.profile?.lastName?.trim() ?? "";
  const fullName = [first, last].filter(Boolean).join(" ") || user.name?.trim() || "";
  const email = user.email?.trim() ?? "";
  if (!fullName && !email) return ILLUSTRATIVE_IDENTITY;
  const name = fullName || email.split("@")[0]!;
  return {
    personal: true,
    name,
    firstName: first || name.split(/\s+/)[0]!,
    email: email || ILLUSTRATIVE_IDENTITY.email,
  };
}
