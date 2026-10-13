import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/session";
import { ActionForm, Area, Field, ActionButton } from "@/components/dash/action-form";
import { Empty, PageTitle, Panel } from "@/components/dash/ui";
import { addProject, deleteProject } from "@/app/actions/student";
import { ImageUpload } from "@/components/dash/image-upload";

export default async function Page() {
  const u = await requirePageRole("STUDENT");
  const p = await db.studentProfile.findUniqueOrThrow({ where: { userId: u.id }, include: { projects: true, skills: true } });
  return (
    <>
      <PageTitle title="Portfolio" sub="Projects and verified evidence appear on your public Talent Card." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Projects">
          {p.projects.length ? <ul className="space-y-4">{p.projects.map((x) => (
            <li key={x.id} className="rounded-xl border border-line p-4"><p className="font-semibold">{x.title}</p><div className="mt-3"><ImageUpload kind="PROJECT" projectId={x.id} label="Add screenshot" currentUrl={x.imageId ? `/api/files/${x.imageId}` : null} /></div><p className="mt-1 text-sm text-ink-soft">{x.summary}</p>
              <div className="mt-2 flex items-center gap-3 text-sm">{x.githubUrl && <a className="font-semibold underline" href={x.githubUrl} rel="noopener noreferrer" target="_blank">Code</a>}{x.demoUrl && <a className="font-semibold underline" href={x.demoUrl} rel="noopener noreferrer" target="_blank">Demo</a>}<span className="ml-auto"><ActionButton variant="ghost" confirm="Delete this project?" action={deleteProject.bind(null, x.id)}>Delete</ActionButton></span></div></li>))}</ul> : <Empty>No projects yet.</Empty>}
        </Panel>
        <div className="space-y-6">
          <Panel title="Add a project"><ActionForm action={addProject} reset submit="Add project" success="Project added"><Field label="Title" name="title" required /><Area label="Summary" name="summary" required /><Field label="Code link" name="githubUrl" type="url" /><Field label="Demo link" name="demoUrl" type="url" /></ActionForm></Panel>
          <Panel title="Verified evidence">{p.skills.length ? <ul className="space-y-2 text-sm">{p.skills.map((s) => <li key={s.id}><b>{s.skill}</b> <span className="text-ink-soft">— {s.explanation}</span></li>)}</ul> : <Empty>Evidence appears here after a mentor endorsement or challenge result.</Empty>}</Panel>
        </div>
      </div>
    </>
  );
}
