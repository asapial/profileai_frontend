import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, FileText, Link2, MessagesSquare } from "lucide-react";
import { homeTemplate, homeTemplateAsset } from "@/lib/home-templates";
import { EvidenceWorkbench } from "./EvidenceWorkbench";
import styles from "./ReadingSections.module.css";
import { SectionEnvironment, sectionEnvironmentClass } from "./SectionEnvironment";

/**
 * The three proof sections that carry the story into the standard landing:
 * product screens, an illustrative workflow, and the template collection. They sit
 * between the workspace flow and the plans table, and read from the same
 * evidence-first position as the cinema, without scores or invented outcomes.
 */
export function StoryShowcaseSection() { return <EvidenceWorkbench />; }

const storyNotes = [
  { title:"Your experience", copy:"Bring projects, skills and outcomes into one evidence-linked master resume.", icon:Link2 },
  { title:"Your resume", copy:"Every AI suggestion reviewed line by line before it reaches the document.", icon:FileText },
  { title:"Your next conversation", copy:"The same proof carried into applications, versions and interview stories.", icon:MessagesSquare },
];

export function StoryCustomerStorySection() {
  return <section className={`${styles.section} ${sectionEnvironmentClass} static-section story-section`} aria-labelledby="story-title" data-reading-section="story">
    <SectionEnvironment kind="story"/>
    <div className={styles.storyCanvas}>
      <div className={styles.storyTop}>
        <h2 id="story-title" className={styles.heading}>A clearer resume.<br/>A calmer search.</h2>
        <figure><blockquote>Start with real work. Keep the same evidence beside your resume, applications and interview stories.</blockquote><figcaption>One source, carried forward.<br/>An illustrative workflow, from your first project note to your next conversation.</figcaption></figure>
      </div>
      <ol className={styles.storyPath}>{storyNotes.map(({title,copy,icon:Icon})=><li key={title}><span className={styles.iconTile}><Icon size={25} aria-hidden/></span><h3>{title}</h3><p>{copy}</p></li>)}</ol>
    </div>
  </section>;
}

const templates=[homeTemplate("kinship"),homeTemplate("orbit"),homeTemplate("editorial-cut")];
export function StoryTemplatesSection() {
  return <section className={`${styles.section} ${sectionEnvironmentClass} static-section templates-section`} aria-labelledby="templates-title" data-reading-section="templates">
    <SectionEnvironment kind="templates"/>
    <div className={`${styles.sectionHeading} static-section-heading`}><h2 id="templates-title" className={styles.heading}>One resume.<br/>Three styles.</h2><div><p className={styles.lede}>Change the type and the rhythm without rewriting a line. Every template reads from the same verified content.</p><Link href="/templates" className="story-text-link">Explore all templates <ArrowUpRight size={18} aria-hidden/></Link></div></div>
    <div className={`${styles.gallery} template-row`}>
      {templates.map(template=><Link key={template.slug} href="/templates" className={`${styles.templateCard} template-card`}>
        <div className={styles.paperStage}><span className={`${styles.paper} template-paper`} data-ui><Image src={homeTemplateAsset(template)} alt={`${template.name} resume template with illustrative Frontend Engineer content`} width={794} height={1123} sizes="(max-width:620px) 250px, (max-width:900px) 28vw, 320px"/></span><span className={styles.reflection} aria-hidden><Image src={homeTemplateAsset(template)} alt="" width={794} height={1123} sizes="320px"/></span></div>
        <div className={styles.templateBody}><h3>{template.name}</h3><p>{template.slug==="kinship"?"A confident sidebar. A clear career story.":template.slug==="orbit"?"Balanced columns. Every detail in place.":"An editorial layout with room for your work."}</p><span>Preview template <ArrowUpRight size={17} aria-hidden/></span></div>
      </Link>)}
    </div>
    <p className={styles.small}>Actual catalog layouts · Illustrative resume content · A4 proportions</p>
  </section>;
}
