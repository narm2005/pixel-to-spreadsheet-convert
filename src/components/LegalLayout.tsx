import { ReactNode, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import SiteFooter from "@/components/SiteFooter";
import { BUSINESS } from "@/lib/business";

interface Props {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
}

// Shared layout for Privacy, Terms, Refunds and Contact: readable on a phone, printable.
const LegalLayout = ({ title, intro, children }: Props) => {
  useEffect(() => {
    document.title = `${title} | ${BUSINESS.brand}`;
    window.scrollTo(0, 0);
  }, [title]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-10 md:px-6 md:py-14">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl">{title}</h1>
        <p className="mb-6 text-sm text-gray-500">Last updated: {BUSINESS.lastUpdated}</p>
        {intro && <div className="mb-8 text-gray-700">{intro}</div>}
        <div className="legal space-y-8 text-[15px] leading-relaxed text-gray-700 [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_li]:ml-5 [&_li]:list-disc [&_li]:mb-1 [&_p]:mb-3 [&_a]:text-blue-600 [&_a]:underline">
          {children}
        </div>
        <p className="mt-12 border-t pt-6 text-sm text-gray-500">
          Questions? See our <Link className="text-blue-600 underline" to="/contact">contact page</Link> or email{" "}
          <a className="text-blue-600 underline" href={`mailto:${BUSINESS.supportEmail}`}>{BUSINESS.supportEmail}</a>.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
};

export default LegalLayout;
