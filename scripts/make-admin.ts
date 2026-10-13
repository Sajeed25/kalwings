// Usage: npm run make-admin -- someone@example.com   (user must already have signed in once)
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const email = process.argv[2]?.toLowerCase();
if (!email) { console.error("Usage: npm run make-admin -- email"); process.exit(1); }
db.user.update({ where: { email }, data: { role: "PLATFORM_ADMIN" } })
  .then((u) => console.log(`${u.email} is now PLATFORM_ADMIN`))
  .catch(() => { console.error("No such user. Sign in once first."); process.exitCode = 1; })
  .finally(() => db.$disconnect());
