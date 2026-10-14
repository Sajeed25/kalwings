import { Badge } from "@/components/ui/badge";
import { ActionButton, ActionForm, Area } from "@/components/dash/action-form";
import { createComment, blockUser, deleteOwnContent, setHidden } from "@/app/actions/community";
import { reportContent } from "@/app/actions/common";
import { fmtTime } from "@/components/dash/ui";
import { asList } from "@/lib/lists";
import type { Comment, Post, User } from "@prisma/client";

export const POST_KIND = { DISCUSSION: "Discussion", QUESTION: "Question", PROJECT_CALL: "Looking for teammates", EVENT: "Event" } as const;
type Full = Post & { author: Pick<User, "id" | "name" | "role">; comments: (Comment & { author: Pick<User, "id" | "name" | "role"> })[]; group?: { name: string; slug: string } };

function ReportBox({ type, id }: { type: "POST" | "COMMENT"; id: string }) {
  return (
    <details className="text-xs"><summary className="cursor-pointer text-ink-soft">Report</summary>
      <ActionForm action={reportContent} reset submit="Send report" success="Thanks, our team will review it." className="mt-2 max-w-sm space-y-2">
        <input type="hidden" name="targetType" value={type} /><input type="hidden" name="targetId" value={id} />
        <Area label="What's wrong?" name="reason" required minLength={10} maxLength={500} />
      </ActionForm></details>
  );
}

export function PostCard({ p, me, canMod, showGroup }: { p: Full; me: { id: string; role: string } | null; canMod: boolean; showGroup?: boolean }) {
  const mine = me?.id === p.authorId;
  const canWrite = me && (me.role === "STUDENT" || me.role === "MENTOR");
  return (
    <article className="card p-5" id={`post-${p.id}`}>
      <div className="flex flex-wrap items-center gap-2"><Badge tone={p.kind === "PROJECT_CALL" ? "spot" : "accent"}>{POST_KIND[p.kind]}</Badge>{p.hiddenAt && <Badge tone="spot">Hidden</Badge>}{showGroup && p.group && <a className="text-xs font-semibold underline" href={`/community/${p.group.slug}`}>{p.group.name}</a>}</div>
      <h3 className="mt-2 text-lg font-bold">{p.title}</h3>
      <p className="text-xs text-ink-soft">{p.author.name}{p.author.role === "MENTOR" && " · mentor"} · {fmtTime(p.createdAt)} IST{p.eventAt && ` · event on ${fmtTime(p.eventAt)} IST`}</p>
      <p className="mt-3 whitespace-pre-line text-sm">{p.body}</p>
      {asList(p.tags).length > 0 && <ul className="mt-3 flex flex-wrap gap-2">{asList(p.tags).map((t) => <li key={t}><Badge>{t}</Badge></li>)}</ul>}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
        {me && !mine && <ReportBox type="POST" id={p.id} />}
        {me && !mine && canWrite && <ActionButton variant="ghost" confirm={`Block ${p.author.name}? You won't see their posts or comments.`} action={blockUser.bind(null, p.author.id)}>Block author</ActionButton>}
        {mine && <ActionButton variant="ghost" confirm="Delete this post?" action={deleteOwnContent.bind(null, "POST", p.id)}>Delete</ActionButton>}
        {canMod && <ActionButton variant="ghost" action={setHidden.bind(null, "POST", p.id, !p.hiddenAt)}>{p.hiddenAt ? "Restore" : "Hide"}</ActionButton>}
      </div>
      <details className="mt-4"><summary className="cursor-pointer text-sm font-semibold">{p.comments.length} comment{p.comments.length === 1 ? "" : "s"}</summary>
        <ul className="mt-3 space-y-3">{p.comments.map((c) => (
          <li key={c.id} className="rounded-lg bg-muted p-3 text-sm">
            <p className="text-xs text-ink-soft">{c.author.name}{c.author.role === "MENTOR" && " · mentor"} · {fmtTime(c.createdAt)} IST{c.hiddenAt && " · hidden"}</p>
            <p className="mt-1 whitespace-pre-line">{c.body}</p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs">
              {me && c.authorId !== me.id && <ReportBox type="COMMENT" id={c.id} />}
              {c.authorId === me?.id && <ActionButton variant="ghost" action={deleteOwnContent.bind(null, "COMMENT", c.id)}>Delete</ActionButton>}
              {canMod && <ActionButton variant="ghost" action={setHidden.bind(null, "COMMENT", c.id, !c.hiddenAt)}>{c.hiddenAt ? "Restore" : "Hide"}</ActionButton>}
            </div>
          </li>))}</ul>
        {canWrite && !p.hiddenAt && <ActionForm action={createComment} reset submit="Comment" success="Posted" className="mt-3 space-y-2"><input type="hidden" name="postId" value={p.id} /><Area label="Add a comment" name="body" required maxLength={1000} rows={2} /></ActionForm>}
      </details>
    </article>
  );
}
