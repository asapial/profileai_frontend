import Link from "next/link";
import { Navbar1 } from "@/components/navbar1";
import { Footer } from "@/components/layout/Footer";
export default function NotFound() {
  return (
    <>
      <Navbar1 />
      <main id="main" className="studio-container py-24">
        <p className="studio-eyebrow text-primary">404 / A SMALL DETOUR</p>
        <h1 className="mt-6 font-serif text-5xl tracking-tight">
          This page has moved on.
        </h1>
        <p className="mt-5 max-w-md text-muted-foreground">
          The link may be out of date, or the page is no longer available. Let’s
          get you back to a useful starting point.
        </p>
        <Link href="/" className="studio-button mt-8">
          Back to the studio →
        </Link>
      </main>
      <Footer />
    </>
  );
}
