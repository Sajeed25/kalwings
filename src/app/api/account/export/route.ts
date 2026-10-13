import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUser } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

/**
 * "Download my data": everything we hold about the signed-in user, as JSON.
 * Includes only the user's OWN data: no other people's contact details, no employer-private notes about them,
 * no password/OTP hashes (we store none for passwords; OTP hashes are never included).
 */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  if (!(await rateLimit(`export:${user.id}`, 5, 60 * 60 * 1000))) return NextResponse.json({ error: "Too many exports. Try again later." }, { status: 429 });

  const [student, mentor, employer, college, notifications, messages, uploads] = await Promise.all([
    db.studentProfile.findUnique({
      where: { userId: user.id },
      include: {
        projects: { select: { title: true, summary: true, githubUrl: true, demoUrl: true } },
        skills: { select: { skill: true, explanation: true, awardedAt: true } },
        applications: { select: { stage: true, createdAt: true, opportunity: { select: { title: true, company: { select: { name: true } } } } } },
        savedRoles: { select: { opportunity: { select: { title: true, company: { select: { name: true } } } } } },
        sessions: { select: { topic: true, message: true, status: true, startsAt: true, createdAt: true, mentor: { select: { user: { select: { name: true } } } } } },
        endorsements: { select: { text: true, evidence: true, createdAt: true, mentor: { select: { user: { select: { name: true } } } } } },
        college: { select: { name: true } },
      },
    }),
    db.mentorProfile.findUnique({
      where: { userId: user.id },
      include: {
        slots: { select: { startsAt: true, endsAt: true } },
        sessions: { select: { topic: true, status: true, startsAt: true } },
        endorsementsGiven: { select: { text: true, evidence: true, createdAt: true } },
      },
    }),
    db.employerMember.findUnique({ where: { userId: user.id }, include: { company: { select: { name: true, website: true, about: true, status: true, opportunities: { select: { title: true, type: true, payText: true, location: true, deadline: true, closedAt: true } } } } } }),
    db.collegeAdmin.findUnique({ where: { userId: user.id }, include: { college: { select: { name: true, city: true, status: true } } } }),
    db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 500, select: { title: true, body: true, createdAt: true } }),
    db.message.findMany({ where: { senderId: user.id }, orderBy: { createdAt: "desc" }, take: 1000, select: { body: true, createdAt: true } }),
    db.upload.findMany({ where: { ownerId: user.id }, select: { kind: true, mime: true, size: true, createdAt: true } }),
  ]);

  const data = {
    exportedAt: new Date().toISOString(),
    account: { name: user.name, email: user.email, phone: user.phone, role: user.role, createdAt: user.createdAt, emailNotifications: user.emailNotifications },
    studentProfile: student, mentorProfile: mentor, employer, collegeAdmin: college,
    messagesYouSent: messages, notifications, uploadedImages: uploads,
    note: "Image files themselves are not included here; contact support if you need them.",
  };
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": 'attachment; filename="kalwings-my-data.json"', "Cache-Control": "private, no-store" },
  });
}
