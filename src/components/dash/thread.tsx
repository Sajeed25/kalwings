import { ActionForm, Field } from "@/components/dash/action-form";
import { sendMessage } from "@/app/actions/common";

export function Thread({ applicationId, messages }: { applicationId: string; me?: string; messages: { id: string; body: string; mine: boolean; who: string; at: string }[] }) {
  return (
    <div className="mt-4 border-t border-line pt-4">
      <p className="text-sm font-semibold">Messages</p>
      <ul className="mt-2 space-y-2">{messages.map((m) => <li key={m.id} className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${m.mine ? "ml-auto bg-black text-white" : "bg-muted"}`}><span className="block text-xs opacity-70">{m.mine ? "You" : m.who}</span>{m.body}</li>)}</ul>
      <ActionForm action={sendMessage} reset submit="Send" success="Sent" className="mt-3 space-y-2">
        <input type="hidden" name="applicationId" value={applicationId} />
        <Field label="Write a message" name="body" required maxLength={1000} />
      </ActionForm>
    </div>
  );
}
