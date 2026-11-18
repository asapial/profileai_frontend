import { homeEnvironmentStyle, type HomeEnvironment } from "@/lib/home-environments";
import styles from "./SectionEnvironment.module.css";

export type SectionEnvironmentKind = HomeEnvironment;
export const sectionEnvironmentClass = styles.surface;
export const environmentPlateClass = styles.plate;

/** Native, non-interactive scenery; product text and controls remain real HTML above it. */
export function SectionEnvironment({ kind }: { kind: SectionEnvironmentKind }) {
  return <div className={styles.environment} data-environment={kind} data-depth="rendered-3d" aria-hidden="true" style={homeEnvironmentStyle(kind)}>
    <div className={styles.plate}/>
  </div>;
}
