import "server-only";
import type { ApplicationStage } from "@prisma/client";
import { db } from "@/lib/db";

/** One history row per stage move. Returns a Prisma operation so it can sit inside a $transaction with the move itself. */
export const stageEvent = (applicationId: string, fromStage: ApplicationStage | null, toStage: ApplicationStage, actorId: string | null) =>
  db.applicationEvent.create({ data: { applicationId, fromStage, toStage, actorId } });

const DAY = 864e5;
export const daysBetween = (a: Date, b: Date) => Math.max(0, Math.round(((b.getTime() - a.getTime()) / DAY) * 10) / 10);
