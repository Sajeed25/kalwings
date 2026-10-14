"use client";
import { useRef } from "react";
import { inputCls } from "@/components/dash/action-form";

/** Message box with an optional "insert a saved template" picker. The text stays editable before sending. */
export function TemplateField({ templates }: { templates: { id: string; name: string; body: string }[] }) {
  const box = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-2">
      {templates.length > 0 && (
        <label className="block text-sm font-semibold">Insert a template
          <select className={inputCls} value="" onChange={(e) => { const t = templates.find((x) => x.id === e.target.value); if (t && box.current) { box.current.value = t.body; box.current.focus(); } }}>
            <option value="">Choose…</option>{templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
      )}
      <label className="block text-sm font-semibold">Write a message
        <input name="body" required maxLength={1000} ref={box} className={inputCls} />
      </label>
    </div>
  );
}
