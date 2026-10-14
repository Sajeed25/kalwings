/**
 * Real, published facts about the team behind Kalwings, taken from the KodeZ by Robokalam website (kodez.robokalam.in, read 14 Oct 2026).
 * Only things that site states are listed. Numbers the site shows as animated counters (placements, internships) are NOT included because
 * the final values were not readable; add them here, with a source, when the team confirms them.
 */
export const SOURCE = { label: "KodeZ by Robokalam", url: "https://kodez.robokalam.in/" } as const;

export const recognitions = [
  { t: "Incubated at T-Hub, Hyderabad", s: "2024" },
  { t: "“Tech For Good” award received by Robokalam at T-Hub", s: "Robokalam" },
  { t: "Robothon supported by the Ministry of Education, Telangana", s: "Robokalam" },
  { t: "Runner-up, IoT solutions", s: "Robokalam" },
];

export const impact = [
  { label: "hiring partners across KodeZ", value: 80, suffix: "+" },
  { label: "career tracks: Python / AI, Java, Web", value: 3, suffix: "" },
  { label: "named mentors and instructors", value: 5, suffix: "" },
  { label: "STEM-lab countries: India, Germany, Saudi Arabia", value: 3, suffix: "" },
];

export const tracks = [
  { name: "Python / AI", mode: "Online / Offline", includes: "Projects, chatbots, deep learning", skills: ["Python", "Chatbots", "Deep Learning"] },
  { name: "Java Developer", mode: "Online / Offline", includes: "Projects, Spring Boot, APIs, support", skills: ["Java", "Spring Boot", "REST APIs"] },
  { name: "Web Development", mode: "Online / Offline", includes: "HTML, CSS, JavaScript, React, projects", skills: ["HTML", "CSS", "JavaScript", "React"] },
];

export const mentorCommunity = [
  { name: "Akkiraju Hari Kishore", role: "Program Chief Advisor" },
  { name: "Raja Sekhar Thota", role: "Program Instructor" },
  { name: "Shamini", role: "Program Instructor" },
  { name: "Mohammed Sajeed", role: "Program Instructor" },
  { name: "Dharmendar Bochu", role: "Mentor community" },
];

/** Quotes as published on the KodeZ site. Keep only with each person's consent. */
export const alumniStories = [
  { name: "Samhitha Y", where: "Infosys", quote: "KodeZ unlocked the leader in me. I started off quietly writing code. I finished confidently pitching MVPs to industry mentors. That transformation helped me secure my role at Infosys." },
  { name: "Vikram A", where: "Accenture", quote: "From debugging code to pitching ideas, I transformed from a learner to a leader." },
  { name: "Nikhila S", where: "Cognizant", quote: "KodeZ turned my GitHub into a hiring magnet — every project tells a story recruiters want to hear." },
];

export const office = {
  org: "Robokalam Technologies Pvt. Ltd.",
  lines: ["Plot No 1/C, Sy No 83/1, Raidurgam, Knowledge City Rd,", "Panmaktha, Hyderabad, Serilingampalle (M), Telangana 500081"],
  map: "https://www.google.com/maps/dir/?api=1&destination=Plot+No+1%2FC,+Sy+No+83%2F1,+Raidurgam,+Knowledge+City+Rd,+Panmaktha,+Hyderabad,+Serilingampalle+(M),+Telangana+500081",
  whatsapp: [{ label: "+91 96662 87717", href: "https://wa.me/919666287717" }, { label: "+91 96662 87747", href: "https://wa.me/919666287747" }],
  email: "info@robokalam.in",
};
