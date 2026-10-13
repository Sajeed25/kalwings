import type { Metadata } from "next";
import { Prose, DraftNotice } from "@/components/pages/shell";

export const metadata: Metadata = { title: "Terms of Use" };

export default function Page() {
  return (
    <Prose>
      <h1 className="text-4xl font-extrabold md:text-5xl">Terms of Use</h1>
      <div className="mt-6"><DraftNotice>Draft outline — have a qualified lawyer review and complete before launch.</DraftNotice></div>
      <h2 className="font-display font-bold">Using Kalwings</h2><p>[Add eligibility, acceptable use, account responsibilities, content ownership, liability and governing law (Telangana, India).]</p><h2 className="font-display font-bold">No guarantees</h2><p>Kalwings does not guarantee jobs, interviews or outcomes.</p>
    </Prose>
  );
}
