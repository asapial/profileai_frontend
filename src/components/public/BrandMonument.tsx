/** The existing brand mark becomes a small physical object, using only local SVG. */
export function BrandMonument() {
  return <svg viewBox="0 0 480 340" fill="none" aria-hidden="true" focusable="false" data-brand-monument>
    <defs>
      <radialGradient id="brand-floor"><stop stopColor="var(--monument-glow)" stopOpacity=".38"/><stop offset="1" stopColor="var(--monument-glow)" stopOpacity="0"/></radialGradient>
      <linearGradient id="brand-plinth" x1="122" y1="260" x2="373" y2="279" gradientUnits="userSpaceOnUse"><stop stopColor="var(--monument-side)"/><stop offset=".48" stopColor="var(--monument-edge)"/><stop offset="1" stopColor="var(--monument-side)"/></linearGradient>
      <linearGradient id="brand-top" x1="154" y1="230" x2="335" y2="276" gradientUnits="userSpaceOnUse"><stop stopColor="var(--monument-top)"/><stop offset="1" stopColor="var(--monument-edge)"/></linearGradient>
      <linearGradient id="brand-reflection" x2="0" y1="278" y2="329" gradientUnits="userSpaceOnUse"><stop stopColor="white" stopOpacity=".28"/><stop offset="1" stopColor="white" stopOpacity="0"/></linearGradient>
      <mask id="brand-reflection-mask"><rect x="0" y="278" width="480" height="55" fill="url(#brand-reflection)"/></mask>
      <filter id="brand-soft"><feGaussianBlur stdDeviation="8"/></filter>
      <g id="brand-tile">
        <rect width="180" height="180" rx="49" fill="var(--monument-back)" transform="matrix(.99 .18 -.10 .99 150 57)"/>
        <rect width="180" height="180" rx="49" fill="var(--monument-side)" transform="matrix(.99 .18 -.10 .99 157 53)"/>
        <image href="/brand/profileai-mark.svg" width="180" height="180" transform="matrix(.99 .18 -.10 .99 164 48)"/>
        <path d="M179 61L303 84" stroke="#fff" strokeOpacity=".19" strokeWidth="1.3" strokeLinecap="round"/>
      </g>
    </defs>
    <ellipse cx="250" cy="276" rx="225" ry="59" fill="url(#brand-floor)"/>
    <g stroke="var(--monument-line)" strokeWidth=".7"><ellipse cx="250" cy="274" rx="212" ry="49"/><ellipse cx="250" cy="274" rx="182" ry="39"/><path d="M41 277H459M78 299L411 248M88 250L416 301"/></g>
    <ellipse cx="251" cy="279" rx="122" ry="20" fill="#1e102c" opacity=".24" filter="url(#brand-soft)"/>
    <path d="M122 250V267C122 302 375 302 375 267V250H122Z" fill="url(#brand-plinth)"/>
    <ellipse cx="248.5" cy="250" rx="126.5" ry="27" fill="url(#brand-top)" stroke="var(--monument-highlight)" strokeWidth=".8"/>
    <path d="M135 264C177 285 322 287 365 265" stroke="var(--monument-highlight)" strokeOpacity=".4"/>
    <ellipse cx="247" cy="247" rx="78" ry="12" fill="#1e102c" opacity=".24" filter="url(#brand-soft)"/>
    <use href="#brand-tile"/>
    <g mask="url(#brand-reflection-mask)"><g transform="translate(0 279) scale(1 -.18) translate(0 -258)"><use href="#brand-tile"/></g></g>
    <g stroke="var(--monument-line)" strokeWidth="1"><path d="M66 210C110 210 113 152 156 152M350 137C394 137 389 198 426 198"/><circle cx="66" cy="210" r="4" fill="var(--monument-top)"/><circle cx="426" cy="198" r="4" fill="var(--monument-top)"/></g>
    <circle cx="103" cy="188" r="2.5" fill="var(--brand-violet)"/><circle cx="399" cy="176" r="2.5" fill="var(--brand-violet)"/>
  </svg>;
}
