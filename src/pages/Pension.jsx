import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const empty = { title: "", content: "", amount: "" };

export default function Pension() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase.from("pension_notes").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addNote(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    await supabase.from("pension_notes").insert({
      title: form.title.trim(),
      content: form.content.trim() || null,
      amount: form.amount ? Number(form.amount) : null,
    });
    setForm(empty);
    load();
  }

  async function remove(id) {
    await supabase.from("pension_notes").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Σύνταξη &amp; Επίδομα</h2>

      <form onSubmit={addNote} className="section-card mb-6 grid grid-cols-2 gap-3">
        <div>
          <label className="label">Title</label>
          <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label className="label">Amount (€, optional)</label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </div>
        <div className="col-span-2">
          <label className="label">Notes</label>
          <textarea
            className="input"
            rows={3}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
        </div>
        <div className="col-span-2">
          <button className="btn-primary" type="submit">
            Add note
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div key={n.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {n.title}
                    {n.amount != null && <span className="text-teal-accent font-normal"> — €{Number(n.amount).toFixed(2)}</span>}
                  </p>
                  {n.content && <p className="text-sm text-slate-400 mt-1 whitespace-pre-wrap">{n.content}</p>}
                </div>
                <button className="btn-delete shrink-0" onClick={() => remove(n.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
