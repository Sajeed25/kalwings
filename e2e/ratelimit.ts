// Run:  npx tsx e2e/ratelimit.ts fill   then   npx tsx e2e/ratelimit.ts check   (separate processes = "restart")
import { rateLimit } from "../src/lib/rate-limit";
import { db } from "../src/lib/db";

const mode = process.argv[2];
const key = "test:persist";
(async () => {
  if (mode === "fill") {
    await db.rateLimit.deleteMany({ where: { key: { startsWith: "test:" } } });
    const r = []; for (let i = 0; i < 7; i++) r.push(await rateLimit(key, 5, 60_000));
    console.log(JSON.stringify(r) === JSON.stringify([true, true, true, true, true, false, false]) ? "PASS limit enforced after 5" : "FAIL " + r);
    const par = await Promise.all(Array.from({ length: 20 }, () => rateLimit("test:parallel", 5, 60_000)));
    console.log(par.filter(Boolean).length === 5 ? "PASS exactly 5 of 20 concurrent calls allowed" : `FAIL ${par.filter(Boolean).length} allowed`);
    await rateLimit("test:window", 1, 1000); const blocked = !(await rateLimit("test:window", 1, 1000)); await new Promise((r) => setTimeout(r, 1200));
    console.log(blocked && (await rateLimit("test:window", 1, 1000)) ? "PASS window resets after expiry" : "FAIL window reset");
  } else {
    console.log((await rateLimit(key, 5, 60_000)) === false ? "PASS still blocked after process restart" : "FAIL limit lost on restart");
    await db.rateLimit.deleteMany({ where: { key: { startsWith: "test:" } } });
  }
  await db.$disconnect();
})();
