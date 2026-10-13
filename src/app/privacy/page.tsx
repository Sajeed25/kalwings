import type { Metadata } from "next";
import { Prose, DraftNotice } from "@/components/pages/shell";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function Page() {
  return (
    <Prose>
      <h1 className="text-4xl font-extrabold md:text-5xl">Privacy Policy</h1>
      <div className="mt-6"><DraftNotice>Draft outline — have a qualified lawyer review and complete before launch.</DraftNotice></div>
      <h2 className="font-display font-bold">What we collect</h2><p>Account details, profile content you add, and usage data needed to run the service.</p><h2 className="font-display font-bold">Contact details are private</h2><p>Student phone numbers and email addresses are hidden from employers by default and shared only when the student chooses.</p><h2 className="font-display font-bold">Your rights</h2><p>You can access, correct, export or delete your data. [Add contact for requests and DPDP Act 2023 details.]</p>
    </Prose>
  );
}
