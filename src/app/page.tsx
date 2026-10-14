import { redirect } from "next/navigation";
import { getUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/** The marketing site lives at kalwings.com. This is the app: go straight to the workspace, or to sign-in. */
export default async function Home() {
  redirect((await getUser()) ? "/dashboard" : "/login");
}
