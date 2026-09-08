import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { uploadImage } from "../lib/uploadImage";

const empty = { exam_date: "", doctor: "", place: "", notes: "", follow_up_date: "" };

export default function MedicalExams() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase.from("medical_exams").select("*").order("exam_date", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addExam(e) {
    e.preventDefault();
    if (!form.exam_date || !form.doctor.trim()) return;

    let image_url = null;
    if (file) {
      setUploading(true);
      try {
        image_url = await uploadImage(file);
      } catch (err) {
        alert("Image upload failed: " + err.message + " (exam will still be saved without it)");
      }
      setUploading(false);
    }

    await supabase.from("medical_exams").insert({
      exam_date: form.exam_date,
      doctor: form.doctor.trim(),
      place: form.place.trim() || null,
      notes: form.notes.trim() || null,
      follow_up_date: form.follow_up_date || null,
      image_url,
    });
    setForm(empty);
    setFile(null);
    load();
  }

  async function remove(id) {
    await supabase.from("medical_exams").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Medical exams</h2>

      <form onSubmit={addExam} className="section-card mb-6 grid grid-cols-2 gap-3">
        <div>
          <label className="label">Date</label>
          <input
            type="date"
            className="input"
            value={form.exam_date}
            onChange={(e) => setForm({ ...form, exam_date: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Doctor</label>
          <input
            className="input"
            value={form.doctor}
            onChange={(e) => setForm({ ...form, doctor: e.target.value })}
          />
        </div>
        <div className="col-span-2">
          <label className="label">Place</label>
          <input className="input" value={form.place} onChange={(e) => setForm({ ...form, place: e.target.value })} />
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
        <div>
          <label className="label">Follow-up date (optional)</label>
          <input
            type="date"
            className="input"
            value={form.follow_up_date}
            onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Photo (report, referral…)</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-xs" />
        </div>
        <div className="col-span-2">
          <button className="btn-primary" type="submit" disabled={uploading}>
            {uploading ? "Uploading…" : "Add exam"}
          </button>
        </div>
      </form>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <div className="space-y-3">
          {items.map((e) => (
            <div key={e.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {e.exam_date} — {e.doctor}
                  </p>
                  {e.place && <p className="text-sm text-slate-400">{e.place}</p>}
                  {e.notes && <p className="text-sm text-slate-500 mt-1 whitespace-pre-wrap">{e.notes}</p>}
                  {e.follow_up_date && <p className="text-xs text-teal-accent mt-1">Follow-up: {e.follow_up_date}</p>}
                  {e.image_url && (
                    <a href={e.image_url} target="_blank" rel="noreferrer" className="text-xs text-teal-accent underline mt-1 inline-block">
                      View photo
                    </a>
                  )}
                </div>
                <button className="btn-delete shrink-0" onClick={() => remove(e.id)}>
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
