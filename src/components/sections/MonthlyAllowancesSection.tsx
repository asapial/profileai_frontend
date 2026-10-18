const rows = [
  ["Alignment analyses", "3/mo", "50/mo", "150/mo"],
  ["Tailored summaries", "2/mo", "20/mo", "60/mo"],
  ["Application drafts", "5/mo", "50/mo", "150/mo"],
];

export function MonthlyAllowancesSection() {
  return (
    <section className="static-section allowances-section" aria-labelledby="allowances-title">
      <p className="static-kicker">PLANS AT A GLANCE</p>
      <h2 id="allowances-title">What&apos;s included.<br /><em>Transparent from day one.</em></h2>
      <div className="allowances-table-wrap">
        <table className="allowances-table">
          <thead><tr><th scope="col">Feature</th><th scope="col">Free</th><th scope="col" className="pro-col">Pro</th><th scope="col">Career Plus</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row[0]}>{row.map((cell, index) => index === 0 ? <th scope="row" key={cell}>{cell}</th> : <td key={cell} className={index === 2 ? "pro-col" : ""}>{cell}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
