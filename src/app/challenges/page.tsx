import type { Metadata } from "next";
import { PageHero } from "@/components/pages/shell";
import { ChallengeSpotlight } from "@/components/home/challenge";
import { Block, FeatureGrid } from "@/components/pages/shell";

export const metadata: Metadata = { title: "Challenges", description: "Solve real company problems and earn an interview through Kalwings' Challenge-to-Hire programme." };

export default function Page() {
  return (
    <>
      <PageHero eyebrow="Challenge-to-Hire" title="Solve a real problem. Earn a real interview." lead="Companies post challenges. You build the answer. The best work gets fast-tracked to an interview — an interview, never a guaranteed job." />
      <ChallengeSpotlight />
      <Block>
        <h2 className="mb-8 text-3xl font-extrabold">How a challenge runs</h2>
        <FeatureGrid items={[
          { t: "1. Read the brief", d: "Every challenge states the problem, eligibility, timeline and judging criteria up front." },
          { t: "2. Build and submit", d: "Submit your work to your Talent Card. Mentors can review and endorse against evidence." },
          { t: "3. Get evaluated", d: "A published rubric decides outcomes. Badges are only awarded for defined assessments." },
        ]} />
      </Block>
    </>
  );
}
