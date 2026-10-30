import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { Empty, PageTitle, Panel, fmt } from "@/components/dash/ui";
import { ActionButton, ActionForm, Field, inputCls } from "@/components/dash/action-form";
import { createAlert, deleteAlert } from "@/app/actions/alerts";
import { TYPE_KEYS, TYPE_LABEL } from "@/lib/opportunity-types";

export default async function Page() {
  const u = await requirePageRole("STUDENT");
  const alerts = await db.jobAlert.findMany({ where: { userId: u.id }, orderBy: { createdAt: "desc" } });
  const lbl = "block text-sm font-semibold";
  return (
    <>
      <PageTitle title="Job alerts" sub="Save what you are looking for. When a verified employer publishes a matching listing you get a notification here, and an email if notification emails are on in Settings. You can also save the search you are looking at from the Opportunities page." />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Panel title="Your alerts">
          {alerts.length ? <ul className="divide-y divide-line">{alerts.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-semibold">{a.label}</p><p className="text-sm text-ink-soft">Saved {fmt(a.createdAt)}{a.lastSentAt ? ` · last match ${fmt(a.lastSentAt)}` : " · no match yet"}</p></div><ActionButton variant="ghost" confirm="Delete this alert?" action={deleteAlert.bind(null, a.id)}>Delete</ActionButton></li>))}</ul> : <Empty>No alerts yet. Add one on the right.</Empty>}
        </Panel>
        <Panel title="Add an alert">
          <ActionForm action={createAlert} reset submit="Save alert" success="Saved" className="space-y-3">
            <Field label="Keyword or skill" name="q" maxLength={80} placeholder="e.g. React, data, design" />
            <Field label="City" name="location" maxLength={60} placeholder="e.g. Hyderabad" />
            <label className={lbl}>Type<select name="type" className={inputCls + " h-11"}><option value="">Any type</option>{TYPE_KEYS.map((k) => <option key={k} value={k}>{TYPE_LABEL[k]}</option>)}</select></label>
            <label className={lbl}>Work mode<select name="mode" className={inputCls + " h-11"}><option value="">Any</option><option value="REMOTE">Remote</option><option value="HYBRID">Hybrid</option><option value="ONSITE">On-site</option></select></label>
            <p className="text-xs text-ink-soft">You will not be emailed more than 10 times an hour, and every email has a one-click unsubscribe.</p>
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
