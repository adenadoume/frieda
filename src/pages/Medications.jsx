import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const empty = { name: "", dose: "", schedule: "", notes: "" };

export default function Medications() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase
      .from("medications")
      .select("*")
      .order("active", { ascending: false })
      .order("name");
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addMed(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    await supabase.from("medications").insert({ ...form, active: true });
    setForm(empty);
    load();
  }

  async function toggleActive(item) {
    await supabase.from("medications").update({ active: !item.active }).eq("id", item.id);
    load();
  }

  async function remove(id) {
    await supabase.from("medications").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Medications</h2>

      <form onSubmit={addMed} className="section-card mb-6 grid grid-cols-2 gap-3">
        <div>
          <label className="label">Name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Dose</label>
          <input className="input" value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} />
        </div>
        <div className="col-span-2">
          <label className="label">Schedule</label>
          <input
            className="input"
            placeholder="e.g. morning + evening, mixed into coffee…"
            value={form.schedule}
            onChange={(e) => setForm({ ...form, schedule: e.target.value })}
          />
        </div>
        <div className="col-span-2">
          <label className="label">Notes</label>
          <textarea
            className="input"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        <div className="col-span-2">
          <button className="btn-primary" type="submit">
            Add medication
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <div className="space-y-3">
          {items.map((m) => (
            <div key={m.id} className={`card p-4 ${!m.active ? "opacity-50" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {m.name} <span className="text-slate-400 font-normal">— {m.dose}</span>
                  </p>
                  {m.schedule && <p className="text-sm text-slate-400 mt-1">{m.schedule}</p>}
                  {m.notes && <p className="text-sm text-slate-500 mt-1">{m.notes}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button className="btn-edit" onClick={() => toggleActive(m)}>
                    {m.active ? "Mark stopped" : "Mark active"}
                  </button>
                  <button className="btn-delete" onClick={() => remove(m.id)}>
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
