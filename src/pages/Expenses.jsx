import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import { uploadImage } from "../lib/uploadImage";

const empty = { description: "", amount: "", category: "", expense_date: "" };

export default function Expenses() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase.from("expenses").select("*").order("expense_date", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addExpense(e) {
    e.preventDefault();
    if (!form.description.trim() || !form.amount) return;

    let receipt_url = null;
    if (file) {
      setUploading(true);
      try {
        receipt_url = await uploadImage(file);
      } catch (err) {
        alert("Receipt upload failed: " + err.message + " (expense will still be saved without it)");
      }
      setUploading(false);
    }

    await supabase.from("expenses").insert({
      description: form.description.trim(),
      amount: Number(form.amount),
      category: form.category.trim() || null,
      expense_date: form.expense_date || new Date().toISOString().slice(0, 10),
      paid_by: user.email,
      receipt_url,
    });
    setForm(empty);
    setFile(null);
    load();
  }

  async function remove(id) {
    await supabase.from("expenses").delete().eq("id", id);
    load();
  }

  const total = items.reduce((sum, i) => sum + Number(i.amount), 0);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Expenses</h2>

      <form onSubmit={addExpense} className="section-card mb-6 grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="label">Description</label>
          <input
            className="input"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Amount (€)</label>
          <input
            type="number"
            step="0.01"
            className="input"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Category</label>
          <input
            className="input"
            placeholder="groceries, medical, helper…"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Date</label>
          <input
            type="date"
            className="input"
            value={form.expense_date}
            onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Receipt photo (optional)</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-xs" />
        </div>
        <div className="col-span-2 flex items-end">
          <button className="btn-primary w-full" type="submit" disabled={uploading}>
            {uploading ? "Uploading receipt…" : "Add expense"}
          </button>
        </div>
      </form>

      <p className="text-slate-400 mb-3">
        Total: <span className="text-teal-accent font-semibold">€{total.toFixed(2)}</span>
      </p>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <table className="w-full card overflow-hidden">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="th">Date</th>
              <th className="th">Description</th>
              <th className="th">Category</th>
              <th className="th">Paid by</th>
              <th className="th text-right">Amount</th>
              <th className="th">Receipt</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} className="tr">
                <td className="td">{i.expense_date}</td>
                <td className="td">{i.description}</td>
                <td className="td">{i.category ?? "—"}</td>
                <td className="td">{i.paid_by}</td>
                <td className="td text-right">€{Number(i.amount).toFixed(2)}</td>
                <td className="td">
                  {i.receipt_url ? (
                    <a href={i.receipt_url} target="_blank" rel="noreferrer" className="text-teal-accent underline">
                      View
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="td">
                  <button className="btn-delete" onClick={() => remove(i.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
