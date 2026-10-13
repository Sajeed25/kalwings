import { db } from "@/lib/db";

/**
 * Fixed-window rate limiter stored in the database, so limits survive restarts and are shared by every
 * process. One atomic upsert per call. Returns true while the caller is within `limit` per `windowMs`.
 * Fails OPEN if the database errors (a limiter outage must not lock everyone out).
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  try {
    const now = new Date();
    const reset = new Date(now.getTime() + windowMs);
    // LAST_INSERT_ID(expr) hands back this call's own post-increment count on the same connection,
    // so concurrent callers each see a distinct number (a separate SELECT would let a burst all see the final count).
    const count = await db.$transaction(async (tx) => {
      await tx.$executeRaw`
        INSERT INTO \`RateLimit\` (\`key\`, \`count\`, \`resetAt\`) VALUES (${key.slice(0, 191)}, LAST_INSERT_ID(1), ${reset})
        ON DUPLICATE KEY UPDATE
          \`count\` = LAST_INSERT_ID(IF(\`resetAt\` < ${now}, 1, \`count\` + 1)),
          \`resetAt\` = IF(\`resetAt\` < ${now}, ${reset}, \`resetAt\`)`;
      const [row] = await tx.$queryRaw<{ c: bigint }[]>`SELECT LAST_INSERT_ID() AS c`;
      return Number(row.c);
    });
    if (Math.random() < 0.01) void db.rateLimit.deleteMany({ where: { resetAt: { lt: now } } }).catch(() => {}); // opportunistic cleanup
    return count <= limit;
  } catch (e) {
    console.error("rateLimit failed open:", e instanceof Error ? e.message : e);
    return true;
  }
}
