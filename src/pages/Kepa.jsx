import { useEffect, useState } from "react";
import { useSupabaseClient } from "../hooks/useSupabaseClient";

const empty = { title: "", content: "", status: "todo", due_date: "" };
const STATUSES = ["todo", "in_progress", "done"];
const STATUS_LABEL = { todo: "To do", in_progress: "In progress", done: "Done" };

export default function Kepa() {
  const supabase = useSupabaseClient();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase.from("kepa_steps").select("*").order("created_at");
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [supabase]);

  async function addStep(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    await supabase.from("kepa_steps").insert({ ...form, due_date: form.due_date || null });
    setForm(empty);
    load();
  }

  async function setStatus(item, status) {
    await supabase.from("kepa_steps").update({ status }).eq("id", item.id);
    load();
  }

  async function remove(id) {
    await supabase.from("kepa_steps").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">ΚΕΠΑ procedure</h2>
      <p className="text-sm text-slate-500 mb-6">
        Attendance allowance (επίδομα συνόδου) = 50% of disability pension, needs neurologist
        certification stating 24hr supervision is required.
      </p>

      <form onSubmit={addStep} className="section-card mb-6 grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label">Step</label>
          <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="col-span-2">
          <label className="label">Notes</label>
          <textarea
            className="input"
            rows={2}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Due date</label>
          <input
            type="date"
            className="input"
            value={form.due_date}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          />
        </div>
        <div className="flex items-end">
          <button className="btn-primary w-full" type="submit">
            Add step
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{item.title}</p>
                  {item.content && <p className="text-sm text-slate-400 mt-1">{item.content}</p>}
                  {item.due_date && <p className="text-xs text-slate-500 mt-1">Due {item.due_date}</p>}
                </div>
                <div className="flex gap-2 shrink-0 items-center">
                  <select
                    className="input py-1"
                    value={item.status}
                    onChange={(e) => setStatus(item, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                  <button className="btn-delete" onClick={() => remove(item.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
