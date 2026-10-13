import { BadgeCheck, FileCheck2, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { VerificationStatus, EntryKind } from "@prisma/client";

/** The four evidence classes are always labelled; nothing unverified may look verified. */
export function EntryLabel({ kind, status }: { kind: EntryKind; status: VerificationStatus }) {
  if (status === "VERIFIED") return <Badge tone="accent"><BadgeCheck className="h-3.5 w-3.5" />Verified by Kalwings</Badge>;
  if (kind === "CERTIFICATE") return <Badge tone="neutral"><FileCheck2 className="h-3.5 w-3.5" />External certificate · not verified by Kalwings</Badge>;
  return <Badge tone="neutral"><UserRound className="h-3.5 w-3.5" />Self-declared</Badge>;
}

export function EvidenceLegend() {
  return (
    <details className="rounded-lg border border-line p-4 text-sm text-ink-soft">
      <summary className="cursor-pointer font-semibold text-ink">How to read this Passport</summary>
      <ul className="mt-2 space-y-1">
        <li><b>Self-declared</b>: written by the student, not checked.</li>
        <li><b>Evidence-backed</b>: a skill tied to a mentor endorsement, assessment or challenge, with the reason shown.</li>
        <li><b>External certificate</b>: issued by another organisation; Kalwings has not verified it.</li>
        <li><b>Verified by Kalwings</b>: our team checked the evidence link. This is the only verified badge.</li>
      </ul>
    </details>
  );
}
