"use client";
import { useEffect, useState, type FormEvent } from "react";
import { authFetch } from "@/lib/api";
import { useAuthStore } from "@/store/useStore";
import { AppShell } from "@/components/layout/AppShell";

const PM_CATS = ["CASH", "UPI", "BANK_TRANSFER", "CARD", "OTHER"];
const PM_ICONS: Record<string, string> = { CASH: "💵", UPI: "📱", BANK_TRANSFER: "🏦", CARD: "💳", OTHER: "💰" };
const PM_LABELS: Record<string, string> = { CASH: "Cash", UPI: "UPI", BANK_TRANSFER: "Bank Transfer", CARD: "Card", OTHER: "Other" };

export default function PaymentMethodsPage() {
  const { token, user } = useAuthStore();
  const bId = user?.businessIds?.[0];
  const [methods, setMethods] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("UPI");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    if (!token || !bId) return;
    authFetch(`/api/payment-methods?businessId=${bId}`, token).then(setMethods).catch(console.error);
  };
  useEffect(load, [token, bId]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await authFetch("/api/payment-methods", token!, { method: "POST", body: JSON.stringify({ businessId: bId, name, category }) });
      setName(""); load();
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Yeh payment method delete karein?")) return;
    await authFetch(`/api/payment-methods/${id}`, token!, { method: "DELETE" }).catch(console.error);
    load();
  }

  return (
    <AppShell>
      <div className="px-4 py-5 max-w-2xl mx-auto space-y-5">
        <h1 className="text-xl font-bold text-gray-900">Payment Methods</h1>

        {/* Add form */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-sm font-bold text-gray-700 mb-4">Nayi Payment Method Add Karein</p>
          <form onSubmit={handleAdd} className="space-y-3">
            <input required value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. HDFC Account, PhonePe"
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-orange-400 focus:bg-white transition" />
            <div className="flex flex-wrap gap-2">
              {PM_CATS.map(c => (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border ${
                    category === c ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-gray-50 text-gray-500 border-transparent"
                  }`}>
                  <span>{PM_ICONS[c]}</span> {PM_LABELS[c]}
                </button>
              ))}
            </div>
            {error && <p className="text-red-500 text-xs bg-red-50 rounded-xl px-3 py-2">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 active:scale-95 rounded-2xl py-3 text-white font-bold text-sm transition-all shadow-sm">
              {loading ? "Adding..." : "+ Add Payment Method"}
            </button>
          </form>
        </div>

        {/* List */}
        <div className="space-y-2">
          {methods.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">Koi payment method nahi</div>
          )}
          {methods.map(m => (
            <div key={m.id} className="flex items-center justify-between bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{PM_ICONS[m.category] || "💰"}</span>
                <div>
                  <p className="text-gray-800 text-sm font-semibold">{m.name}</p>
                  <p className="text-xs text-gray-400">{PM_LABELS[m.category] || m.category}</p>
                </div>
                {m.isDefault && <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full font-medium">Default</span>}
              </div>
              {!m.isDefault && (
                <button onClick={() => handleDelete(m.id)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1">Delete</button>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
