import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useSupabaseClient } from "../hooks/useSupabaseClient";

export default function Shopping() {
  const { user } = useUser();
  const supabase = useSupabaseClient();
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase
      .from("shopping_items")
      .select("*")
      .order("done", { ascending: true })
      .order("created_at", { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [supabase]);

  async function addItem(e) {
    e.preventDefault();
    if (!title.trim()) return;
    await supabase
      .from("shopping_items")
      .insert({ title: title.trim(), created_by: user.primaryEmailAddress?.emailAddress });
    setTitle("");
    load();
  }

  async function toggle(item) {
    await supabase.from("shopping_items").update({ done: !item.done }).eq("id", item.id);
    load();
  }

  async function remove(id) {
    await supabase.from("shopping_items").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Shopping list</h2>

      <form onSubmit={addItem} className="flex gap-2 mb-6">
        <input
          className="input"
          placeholder="Add an item…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button className="btn-primary shrink-0" type="submit">
          Add
        </button>
      </form>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-slate-500">Nothing on the list.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="card px-4 py-3 flex items-center gap-3">
              <input type="checkbox" checked={item.done} onChange={() => toggle(item)} className="accent-teal-accent" />
              <div className="flex-1">
                <p className={item.done ? "line-through text-slate-500" : ""}>{item.title}</p>
                {item.notes && <p className="text-xs text-slate-500 mt-0.5">{item.notes}</p>}
              </div>
              <button className="btn-delete" onClick={() => remove(item.id)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
