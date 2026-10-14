import { Hero } from "@/components/home/hero";
import { TrustStrip, Impact } from "@/components/home/trust-impact";
import { Problem, Journey } from "@/components/home/problem-journey";
import { Pillars } from "@/components/home/pillars";
import { MentorWall } from "@/components/home/mentor-wall-section";
import { LiveOpportunities } from "@/components/home/live-opportunities";
import { ChallengeSpotlight } from "@/components/home/challenge";
import { Community, Stories, Recognition, AudienceSplit, Team, FinalCta } from "@/components/home/rest";

export default function Home() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <Impact />
      <Problem />
      <Journey />
      <Pillars />
      <MentorWall />
      <LiveOpportunities />
      <ChallengeSpotlight />
      <Community />
      <Stories />
      <Recognition />
      <AudienceSplit />
      <Team />
      <FinalCta />
    </>
  );
}
