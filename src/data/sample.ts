/**
 * SAMPLE DATA used only by `npm run db:seed` (local/demo databases) and as TypeScript types. It is NOT shown on the live site.
 * Records are modelled on the real KodeZ tracks (Python / AI, Java, Web) and Hyderabad, but every company, person and figure
 * here is invented and flagged "Sample". Real content lives in src/data/robokalam.ts and in the database.
 */

export const SAMPLE_NOTE = "Sample data";

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
  photo?: string; // /api/files/<id> when the mentor uploaded one
};

export const mentors: Mentor[] = [
  { slug: "sample-mentor-1", name: "Aarav Menon", role: "Staff ML Engineer", company: "Sample Co.", country: "Germany", flag: "🇩🇪", domain: "AI / ML", tags: ["Python", "Deep Learning", "Chatbots"], guided: 0, available: true },
  { slug: "sample-mentor-2", name: "Nadia Rahman", role: "Product Design Lead", company: "Sample Studio", country: "UAE", flag: "🇦🇪", domain: "Design", tags: ["Product Design", "UX Research", "Figma"], guided: 0, available: true },
  { slug: "sample-mentor-3", name: "Vikram Rao", role: "Engineering Manager", company: "Sample Labs", country: "India", flag: "🇮🇳", domain: "Software", tags: ["Java", "Spring Boot", "System Design"], guided: 0, available: false },
  { slug: "sample-mentor-4", name: "Sana Iyer", role: "Embedded Systems Architect", company: "Sample Robotics", country: "Saudi Arabia", flag: "🇸🇦", domain: "Robotics", tags: ["Embedded C", "ROS", "IoT"], guided: 0, available: true },
  { slug: "sample-mentor-5", name: "Rohan Deshpande", role: "Data Science Director", company: "Sample Analytics", country: "United States", flag: "🇺🇸", domain: "Data", tags: ["Analytics", "SQL", "Python"], guided: 0, available: true },
  { slug: "sample-mentor-6", name: "Meera Krishnan", role: "Web Engineering Lead", company: "Sample Brands", country: "India", flag: "🇮🇳", domain: "Web", tags: ["React", "JavaScript", "Careers"], guided: 0, available: false },
];


export type Opportunity = {
  id: string;
  company: string;
  role: string;
  type: string;
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
  logoId?: string | null;
};

export const opportunities: Opportunity[] = [
  { id: "s1", monthly: 20000, company: "Sample Co. A", role: "React Web Developer Intern", type: "Internship", pay: "₹20,000 / month", unpaid: false, location: "Hyderabad", mode: "Hybrid", eligibility: "2026–27 graduates", deadline: "30 Nov 2026", verified: true, skills: ["React", "JavaScript", "CSS"] },
  { id: "s2", monthly: 45000, company: "Sample Co. B", role: "Associate Python / AI Engineer", type: "Job", pay: "₹4.5 – 6 LPA", unpaid: false, location: "Hyderabad", mode: "On-site", eligibility: "2026 graduates", deadline: "15 Dec 2026", verified: true, skills: ["Python", "Chatbots"] },
  { id: "s3", monthly: 0, company: "Sample Co. C", role: "Chatbot Build Challenge", type: "Challenge", pay: "₹50,000 prize pool", unpaid: false, location: "Pan-India", mode: "Remote", eligibility: "Final-year & recent grads", deadline: "05 Dec 2026", verified: true, skills: ["Python", "Deep Learning"] },
  { id: "s4", monthly: 0, company: "Sample NGO D", role: "Community Content Intern", type: "Internship", pay: "Certificate only, no stipend", unpaid: true, location: "Remote", mode: "Remote", eligibility: "Any year", deadline: "20 Nov 2026", verified: true, skills: ["Writing", "Social"] },
  { id: "s5", monthly: 58000, company: "Sample Co. E", role: "Junior Java Developer (Spring Boot)", type: "Job", pay: "₹6 – 8 LPA", unpaid: false, location: "Hyderabad", mode: "Hybrid", eligibility: "2025–26 graduates", deadline: "10 Jan 2027", verified: true, skills: ["Java", "Spring Boot", "REST APIs"] },
  { id: "s6", monthly: 15000, company: "Sample Co. F", role: "UI/UX Design Intern", type: "Internship", pay: "₹15,000 / month", unpaid: false, location: "Remote", mode: "Remote", eligibility: "Third-year onwards", deadline: "25 Nov 2026", verified: true, skills: ["Figma", "Research"] },
];



