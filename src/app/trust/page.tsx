import type { Metadata } from "next";
import { Prose, DraftNotice } from "@/components/pages/shell";

export const metadata: Metadata = { title: "Trust & Safety" };

export default function Page() {
  return (
    <Prose>
      <h1 className="text-4xl font-extrabold md:text-5xl">Trust & Safety</h1>
      <div className="mt-6"><DraftNotice>Draft outline — have a qualified lawyer review and complete before launch.</DraftNotice></div>
      <h2 className="font-display font-bold">Our rules</h2><ul><li>Badges are awarded only when backed by a defined assessment or evidence.</li><li>Pay, work mode, location and eligibility are always shown; unpaid roles are labelled clearly.</li><li>Student contact details are private by default.</li><li>We never promise guaranteed jobs.</li><li>Sponsored listings are labelled and never presented as verified or better.</li></ul><h2 className="font-display font-bold">Report a problem</h2><p>[Add abuse/fraud reporting contact and process.]</p>
    </Prose>
  );
}
