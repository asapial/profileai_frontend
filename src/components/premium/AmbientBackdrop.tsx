/**
 * Global decorative layer for the product's three-depth visual system.
 * It intentionally contains no interactive content and sits behind every
 * route, while cards/shells provide the glass layer and page content stays
 * in the foreground.
 */
export function AmbientBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="premium-ambient pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="premium-ambient__grid absolute inset-0" />
      <div className="premium-orb premium-orb--violet" />
      <div className="premium-orb premium-orb--cyan" />
      <div className="premium-orb premium-orb--rose" />
      <div className="premium-orbit premium-orbit--one" />
      <div className="premium-orbit premium-orbit--two" />
      <div className="premium-ambient__noise absolute inset-0" />
    </div>
  );
}
