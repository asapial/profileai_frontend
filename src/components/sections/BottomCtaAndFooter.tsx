"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";
import { storyIdentityFrom, type StoryIdentity } from "@/lib/story-identity";

/**
 * A6: the closing CTA follows the same identity as the story. Signed-in
 * visitors go straight into the resume flow with their name already on the
 * preview sheet; guests keep the illustrative sheet and go to registration.
 */
function useStoryIdentity(): StoryIdentity {
  const { data: user } = useQuery({ queryKey: ["current-user"], queryFn: getCurrentUser, staleTime: 60_000, retry: false });
  return storyIdentityFrom(user);
}

export function BottomCtaAndFooter() {
  const identity = useStoryIdentity();
  return (
    <>
      <section className="bottom-cta" aria-labelledby="bottom-cta-title">
        <div className="cta-resume-preview" aria-hidden>
          <div className="cta-resume-preview__sheet cta-resume-preview__sheet--back" />
          <div className="cta-resume-preview__sheet">
            <i /><strong>{identity.name}</strong><span>{identity.personal ? "Your professional resume" : "Senior Frontend Engineer"}</span>
            <b /><b /><b /><b />
            <em>Source verified</em>
          </div>
        </div>
        <div>
          <p className="static-kicker">GET STARTED</p>
          <h2 id="bottom-cta-title">Make it <em>yours.</em></h2>
          <p>
            {identity.personal
              ? "Your evidence is already in. Turn it into the application you send."
              : "Start with your experience. Build something you\u2019re proud to send."}
          </p>
        </div>
        <Link href={identity.personal ? "/dashboard/documents/new" : "/register"} className="bottom-cta-button">
          {identity.personal ? "Start the next resume" : "Create your resume"} <span>↗</span>
        </Link>
      </section>
      <footer className="story-footer">
        <div className="footer-brand">
          <Link className="story-brand" href="/"><img src="/brand/profileai-mark.svg" alt="" width="36" height="36" /><span>ProfileAI</span></Link>
          <p>For the work you&apos;ve done.<br />And everything you&apos;ll do next.</p>
        </div>
        <nav aria-label="Product"><strong>PRODUCT</strong><Link href="/templates">Templates</Link><Link href="/pricing">Pricing</Link><Link href="/dashboard">Your workspace</Link></nav>
        <nav aria-label="Company"><strong>COMPANY</strong><Link href="/help">Help center</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav>
        <div className="footer-bottom"><span>© 2026 ProfileAI</span><span>Your next move, grounded in evidence.</span></div>
      </footer>
    </>
  );
}
