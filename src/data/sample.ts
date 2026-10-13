/**
 * SAMPLE DATA — every record here is a clearly-marked placeholder.
 * Replace with real records (or load from the database) before launch.
 * Never ship invented people, companies, numbers, awards or testimonials.
 */

export const SAMPLE_NOTE = "Sample data — replace before launch";

export const ecosystem = ["T-Hub", "NVIDIA Inception", "Microsoft for Startups", "Dell for Startups"];
export const partnerPlaceholders = [
  "[Partner college logo]",
  "[Hiring company logo]",
  "[Partner college logo]",
  "[Hiring company logo]",
];

export const impact = [
  { label: "students", value: null as number | null, suffix: "+" },
  { label: "mentors", value: null, suffix: "+" },
  { label: "hiring partners", value: null, suffix: "+" },
  { label: "colleges", value: null, suffix: "+" },
  { label: "challenges run", value: null, suffix: "" },
];

export type Mentor = {
  slug: string;
  name: string;
  role: string;
  company: string;
  country: string;
  flag: string;
  domain: string;
  tags: string[];
  guided: number;
  available: boolean;
  isSample?: boolean;
};

export const mentors: Mentor[] = [
  { slug: "sample-mentor-1", name: "Aarav Menon", role: "Staff ML Engineer", company: "Sample Co.", country: "Germany", flag: "🇩🇪", domain: "AI / ML", tags: ["Machine Learning", "MLOps", "Python"], guided: 0, available: true },
  { slug: "sample-mentor-2", name: "Nadia Rahman", role: "Product Design Lead", company: "Sample Studio", country: "UAE", flag: "🇦🇪", domain: "Design", tags: ["Product Design", "UX Research", "Figma"], guided: 0, available: true },
  { slug: "sample-mentor-3", name: "Vikram Rao", role: "Engineering Manager", company: "Sample Labs", country: "India", flag: "🇮🇳", domain: "Software", tags: ["System Design", "Backend", "Interviews"], guided: 0, available: false },
  { slug: "sample-mentor-4", name: "Sana Iyer", role: "Embedded Systems Architect", company: "Sample Robotics", country: "Saudi Arabia", flag: "🇸🇦", domain: "Robotics", tags: ["Embedded C", "ROS", "IoT"], guided: 0, available: true },
  { slug: "sample-mentor-5", name: "Rohan Deshpande", role: "Data Science Director", company: "Sample Analytics", country: "United States", flag: "🇺🇸", domain: "Data", tags: ["Analytics", "SQL", "Storytelling"], guided: 0, available: true },
  { slug: "sample-mentor-6", name: "Meera Krishnan", role: "Growth & Marketing Head", company: "Sample Brands", country: "India", flag: "🇮🇳", domain: "Business", tags: ["Growth", "Content", "Careers"], guided: 0, available: false },
];

export const mentorOfTheMonth = {
  mentor: mentors[0],
  quote:
    "[Sample quote] The best portfolios I see don't list everything — they show one problem, honestly solved.",
};

export type Opportunity = {
  id: string;
  company: string;
  role: string;
  type: "Internship" | "Job" | "Challenge";
  pay: string; // always shown
  unpaid: boolean;
  location: string;
  mode: "Remote" | "Hybrid" | "On-site";
  eligibility: string;
  deadline: string;
  verified: boolean;
  skills: string[];
  /** Approx. monthly pay in INR for range filtering (0 = unpaid / prize-only). */
  monthly: number;
  isSample?: boolean;
};

export const opportunities: Opportunity[] = [
  { id: "s1", monthly: 20000, company: "Sample Co. A", role: "Frontend Developer Intern", type: "Internship", pay: "₹20,000 / month", unpaid: false, location: "Hyderabad", mode: "Hybrid", eligibility: "2026–27 graduates", deadline: "30 Nov 2026", verified: true, skills: ["React", "TypeScript"] },
  { id: "s2", monthly: 45000, company: "Sample Co. B", role: "Associate Data Analyst", type: "Job", pay: "₹4.5 – 6 LPA", unpaid: false, location: "Bengaluru", mode: "On-site", eligibility: "2026 graduates", deadline: "15 Dec 2026", verified: true, skills: ["SQL", "Python"] },
  { id: "s3", monthly: 0, company: "Sample Co. C", role: "Robotics Build Challenge", type: "Challenge", pay: "₹50,000 prize pool", unpaid: false, location: "Pan-India", mode: "Remote", eligibility: "Final-year & recent grads", deadline: "05 Dec 2026", verified: true, skills: ["ROS", "Embedded"] },
  { id: "s4", monthly: 0, company: "Sample NGO D", role: "Community Content Intern", type: "Internship", pay: "Certificate only, no stipend", unpaid: true, location: "Remote", mode: "Remote", eligibility: "Any year", deadline: "20 Nov 2026", verified: true, skills: ["Writing", "Social"] },
  { id: "s5", monthly: 58000, company: "Sample Co. E", role: "Junior Backend Engineer", type: "Job", pay: "₹6 – 8 LPA", unpaid: false, location: "Chennai", mode: "Hybrid", eligibility: "2025–26 graduates", deadline: "10 Jan 2027", verified: true, skills: ["Node.js", "PostgreSQL"] },
  { id: "s6", monthly: 15000, company: "Sample Co. F", role: "UI/UX Design Intern", type: "Internship", pay: "₹15,000 / month", unpaid: false, location: "Remote", mode: "Remote", eligibility: "Third-year onwards", deadline: "25 Nov 2026", verified: true, skills: ["Figma", "Research"] },
];

export const novathon = {
  name: "Novathon — Sample Edition",
  brief: "[Sample brief] Design and prototype a low-cost sensor kit that helps a small lab monitor air quality.",
  outcome: "Top teams get a fast-tracked interview with participating companies — an interview, not a guaranteed job.",
  deadline: "2026-12-05T18:29:59Z",
  companies: ["[Sample Co. A]", "[Sample Co. C]", "[Sample Co. E]"],
};

export const stories = [
  { name: "Sample Student", college: "[College name]", path: "From [challenge/project] to [role] at [company]" },
  { name: "Sample Student", college: "[College name]", path: "From [challenge/project] to [role] at [company]" },
  { name: "Sample Student", college: "[College name]", path: "From [challenge/project] to [role] at [company]" },
];

export const communityGroups = [
  { name: "AI & Robotics Circle", members: null as number | null },
  { name: "Web & Product Builders", members: null },
  { name: "Interview Prep Pod", members: null },
  { name: "Women in Tech Chapter", members: null },
];
