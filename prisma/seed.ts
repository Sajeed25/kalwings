/**
 * Seeds SAMPLE data only (every record flagged isSample / named "Sample …").
 * Run: npm run db:seed        (safe to re-run; never touches real users)
 * Remove: npm run db:unseed
 */
import { PrismaClient } from "@prisma/client";
import { mentors, opportunities } from "../src/data/sample";

const db = new PrismaClient();
const modeMap = { Remote: "REMOTE", Hybrid: "HYBRID", "On-site": "ONSITE" } as const;
const typeMap = { Internship: "INTERNSHIP", Job: "JOB", Challenge: "CHALLENGE" } as const;

async function unseed() {
  await db.opportunity.deleteMany({ where: { company: { isSample: true } } });
  await db.company.deleteMany({ where: { isSample: true } });
  await db.user.deleteMany({ where: { email: { endsWith: "@sample.kalwings.test" } } });
  await db.college.deleteMany({ where: { name: { startsWith: "Sample " } } });
}

async function seed() {
  await unseed();
  // Platform admin for local testing only. Create real admins with `npm run make-admin -- you@email`.
  await db.user.create({ data: { email: "admin@sample.kalwings.test", name: "Sample Admin", role: "PLATFORM_ADMIN" } });

  for (const m of mentors) {
    await db.user.create({
      data: {
        email: `${m.slug}@sample.kalwings.test`, name: m.name, role: "MENTOR",
        mentor: { create: { slug: m.slug, roleTitle: m.role, company: m.company, country: m.country, domain: m.domain, tags: m.tags, bio: "[Sample bio] Replace with the mentor's own words.", status: "VERIFIED", verifiedAt: new Date(), isSample: true } },
      },
    });
  }

  const companies = new Map<string, string>();
  for (const o of opportunities) {
    if (!companies.has(o.company)) {
      const u = await db.user.create({
        data: {
          email: `${o.company.toLowerCase().replace(/[^a-z0-9]+/g, "-")}@sample.kalwings.test`, name: `${o.company} Recruiter`, role: "EMPLOYER",
          employer: { create: { company: { create: { name: o.company, website: "https://example.com", about: "SAMPLE DATA", status: "VERIFIED", verifiedAt: new Date(), isSample: true } } } },
        },
        include: { employer: true },
      });
      companies.set(o.company, u.employer!.companyId);
    }
    await db.opportunity.create({
      data: {
        companyId: companies.get(o.company)!, title: o.role, type: typeMap[o.type], description: `[Sample listing] ${o.role} at ${o.company}. Replace with a real description of the work, the team and how selection works.`,
        payText: o.pay, unpaid: o.unpaid, monthlyINR: o.monthly, workMode: modeMap[o.mode], location: o.location, eligibility: o.eligibility,
        gradYears: (o.eligibility.match(/20\d\d/g) ?? []).map(Number), skills: o.skills,
        deadline: new Date(Date.now() + 45 * 864e5), moderated: "VERIFIED",
      },
    });
  }

  const college = await db.college.create({ data: { name: "Sample Institute of Technology", city: "Hyderabad", status: "VERIFIED" } });
  await db.user.create({ data: { email: "college@sample.kalwings.test", name: "Sample College Admin", role: "COLLEGE_ADMIN", college: { create: { collegeId: college.id } } } });
  await db.user.create({
    data: {
      email: "student@sample.kalwings.test", name: "Sample Student", role: "STUDENT",
      student: { create: { slug: "sample-student", isSample: true, collegeId: college.id, shareWithCollege: true, headline: "ECE final-year · embedded & Python", bio: "[Sample] Replace me — a short story about what you like building.", city: "Hyderabad", graduationYear: 2026, skillsClaimed: ["Embedded C", "Python", "Circuit design"] } },
    },
  });
  console.log("Seeded sample data. Sample logins (dev OTP prints to the server console): admin@/student@/college@/sample-mentor-1@/sample-co-a@ + sample.kalwings.test");
}

(process.argv[2] === "unseed" ? unseed() : seed()).finally(() => db.$disconnect());
