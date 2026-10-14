/**
 * Interview practice prompts. These are fixed practice questions, not predictions of what any employer will ask.
 * Skill prompts only mention skills the listing names.
 */
const GENERAL = [
  "Walk me through a project you are proud of. What problem did it solve and what was your part?",
  "Tell me about a time something you built did not work. How did you find the cause?",
  "Why this role and this company? What do you hope to learn?",
  "Describe a time you worked in a team and disagreed. What happened?",
  "What would you do in your first month to become useful here?",
];
export function interviewPrompts(skills: string[]): { general: string[]; bySkill: { skill: string; prompts: string[] }[] } {
  return {
    general: GENERAL,
    bySkill: skills.slice(0, 6).map((skill) => ({ skill, prompts: [
      `Where have you actually used ${skill}? Show me the project and the part you wrote.`,
      `What is the hardest bug you hit with ${skill}, and how did you fix it?`,
      `If you had a week to get better at ${skill}, what would you build?`,
    ] })),
  };
}
