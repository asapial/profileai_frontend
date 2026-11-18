import styles from "./ReadingSections.module.css";

const rows = [
  ["Alignment analyses", "3/mo", "50/mo", "150/mo"],
  ["Tailored summaries", "2/mo", "20/mo", "60/mo"],
  ["Application drafts", "5/mo", "50/mo", "150/mo"],
];

export function MonthlyAllowancesSection() {
  return (
    <section className={`${styles.section} static-section allowances-section`} aria-labelledby="allowances-title" data-reading-section="allowances">
      <div className={styles.sectionHeading}><h2 id="allowances-title" className={styles.heading}>What&apos;s included.</h2><p className={styles.lede}>Monthly allowances across all three plans, so you can compare exactly what you need.</p></div>
      <div className={styles.allowancePanel}>
        <table className={styles.allowanceTable}>
          <caption className="sr-only">Monthly usage allowances for Free, Pro and Career Plus</caption>
          <thead><tr><th scope="col">Feature</th><th scope="col">Free</th><th scope="col" className={styles.pro}>Pro</th><th scope="col">Career Plus</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => index === 0 ? <th scope="row" key={cell}>{cell}</th> : <td key={cell} data-plan={["", "Free", "Pro", "Career Plus"][index]} className={index === 2 ? styles.pro : ""}><strong>{cell.split("/")[0]}</strong><span>/mo</span></td>)}</tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
