"use client";
import { useEffect, useState, type FormEvent } from "react";
import { authFetch } from "@/lib/api";
import { useAuthStore } from "@/store/useStore";
import { AppShell } from "@/components/layout/AppShell";

const CAT_TYPES = ["INCOME", "EXPENSE", "TRANSFER", "CREDIT"];
const TYPE_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  INCOME:   { label: "Income",   color: "text-green-600",  bg: "bg-green-50",  dot: "bg-green-500" },
  EXPENSE:  { label: "Expense",  color: "text-red-500",    bg: "bg-red-50",    dot: "bg-red-500" },
  TRANSFER: { label: "Transfer", color: "text-blue-500",   bg: "bg-blue-50",   dot: "bg-blue-500" },
  CREDIT:   { label: "Credit",   color: "text-yellow-600", bg: "bg-yellow-50", dot: "bg-yellow-500" },
};

export default function CategoriesPage() {
  const { token, user } = useAuthStore();
  const bId = user?.businessIds?.[0];
  const [cats, setCats] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("EXPENSE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    if (!token || !bId) return;
    authFetch(`/api/categories?businessId=${bId}`, token).then(setCats).catch(console.error);
  };
  useEffect(load, [token, bId]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await authFetch("/api/categories", token!, { method: "POST", body: JSON.stringify({ businessId: bId, name, type }) });
      setName(""); load();
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Yeh category delete karein?")) return;
    await authFetch(`/api/categories/${id}`, token!, { method: "DELETE" }).catch(console.error);
    load();
  }

  const grouped = CAT_TYPES.reduce((acc, t) => {
    acc[t] = cats.filter(c => c.type === t);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <AppShell>
      <div className="px-4 py-5 max-w-2xl mx-auto space-y-5">
        <h1 className="text-xl font-bold text-gray-900">Categories</h1>

        {/* Add form */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-sm font-bold text-gray-700 mb-4">Nayi Category Add Karein</p>
          <form onSubmit={handleAdd} className="space-y-3">
            <input required value={name} onChange={e => setName(e.target.value)}
              placeholder="Category ka naam (e.g. Sales, Rent)"
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white transition" />
            <div className="grid grid-cols-2 gap-2">
              {CAT_TYPES.map(t => {
                const m = TYPE_META[t];
                return (
                  <button key={t} type="button" onClick={() => setType(t)}
                    className={`py-2.5 rounded-xl text-sm font-medium transition-all border ${
                      type === t ? `${m.bg} ${m.color} border-current` : "bg-gray-50 text-gray-400 border-transparent"
                    }`}>
                    {m.label}
                  </button>
                );
              })}
            </div>
            {error && <p className="text-red-500 text-xs bg-red-50 rounded-xl px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 active:scale-95 rounded-2xl py-3 text-white font-bold text-sm transition-all shadow-sm">
              {loading ? "Adding..." : "+ Add Category"}
            </button>
          </form>
        </div>

        {/* Category list grouped by type */}
        {CAT_TYPES.map(t => {
          const list = grouped[t];
          if (!list || list.length === 0) return null;
          const m = TYPE_META[t];
          return (
            <div key={t}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${m.dot}`} />
                <p className={`text-xs font-bold uppercase tracking-wider ${m.color}`}>{m.label} ({list.length})</p>
              </div>
              <div className="space-y-2">
                {list.map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${m.dot}`} />
                      <span className="text-gray-800 text-sm font-medium">{c.name}</span>
                      {c.isDefault && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Default</span>}
                    </div>
                    {!c.isDefault && (
                      <button onClick={() => handleDelete(c.id)}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1">
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
