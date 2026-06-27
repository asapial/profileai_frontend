export function OrbLayer() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="orb orb-large" style={{ top: "-4rem", right: "8%" }} />
      <div className="orb orb-medium" style={{ bottom: "12%", right: "18%" }} />
      <div className="orb orb-small" style={{ top: "18%", left: "10%" }} />
      <div className="orb orb-navy" style={{ bottom: "-5rem", left: "18%" }} />
    </div>
  );
}
