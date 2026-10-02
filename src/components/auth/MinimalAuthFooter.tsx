import Link from "next/link";

export function MinimalAuthFooter() {
  return (
    <footer className="auth-minimal-footer">
      <span>© {new Date().getFullYear()} ProfileAI</span>
      <nav aria-label="Legal">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </nav>
    </footer>
  );
}
