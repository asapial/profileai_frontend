"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/lib/auth";
import { storyIdentityFrom, type StoryIdentity } from "@/lib/story-identity";
import { ArrowUpRight, Check } from "lucide-react";
import { DEFAULT_HOME_TEMPLATE, homeTemplate, homeTemplateSvg } from "@/lib/home-templates";
import styles from "./ReadingSections.module.css";
import { PublicFooter } from "../public/PublicFooter";
import { SectionEnvironment, sectionEnvironmentClass } from "./SectionEnvironment";

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
      <section className={`${styles.section} ${sectionEnvironmentClass} bottom-cta`} aria-labelledby="bottom-cta-title" data-reading-section="closing">
        <SectionEnvironment kind="closing"/>
        <div className={styles.closing}>
        <div className={styles.closingCopy}>
          <h2 id="bottom-cta-title" className={styles.heading}>Make it yours.</h2>
          <p className={styles.lede}>
            {identity.personal
              ? "Your evidence is already in. Turn it into the application you send."
              : "Start with your experience. Build something you\u2019re proud to send."}
          </p>
        <Link href={identity.personal ? "/dashboard/documents/new" : "/register"} className="bottom-cta-button">
          {identity.personal ? "Start the next resume" : "Create your resume"} <ArrowUpRight size={18} aria-hidden/>
        </Link>
          <div className={styles.closingChecks}><span><Check size={16} aria-hidden/>Start free</span><span><Check size={16} aria-hidden/>Keep your voice</span><span><Check size={16} aria-hidden/>Review every change</span></div>
        </div>
        <div className={`${styles.closingPaper} cta-resume-preview`} data-ui>
          <div className="cta-resume-preview__sheet"><strong>{identity.name}</strong><span>Illustrative A4 layout · Your content stays yours.</span></div>
          <div className={styles.closingPaperInner}><Image src={homeTemplateSvg(homeTemplate(DEFAULT_HOME_TEMPLATE),identity)} alt="Illustrative A4 resume in the Orbit catalog layout" width={794} height={1123} unoptimized/><span className={styles.reflection} aria-hidden><Image src={homeTemplateSvg(homeTemplate(DEFAULT_HOME_TEMPLATE),identity)} alt="" width={794} height={1123} unoptimized/></span></div>
        </div>
        </div>
      </section>
      <PublicFooter withCTA={false} />
    </>
  );
}
