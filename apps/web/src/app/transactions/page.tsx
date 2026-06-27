"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/api";
import { useAuthStore } from "@/store/useStore";
import { AppShell } from "@/components/layout/AppShell";

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  INCOME: { label: "Income", color: "text-green-600", bg: "bg-green-100" },
  EXPENSE: { label: "Expense", color: "text-red-500", bg: "bg-red-100" },
  TRANSFER: { label: "Transfer", color: "text-blue-500", bg: "bg-blue-100" },
  CREDIT: { label: "Credit", color: "text-yellow-600", bg: "bg-yellow-100" },
  PAYMENT_RECEIVED: { label: "Received", color: "text-green-600", bg: "bg-green-100" },
  PAYMENT_DUE: { label: "Due", color: "text-orange-600", bg: "bg-orange-100" },
};

export default function TransactionsPage() {
  const { token, user } = useAuthStore();
  const router = useRouter();
  const [txns, setTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const bId = user?.businessIds?.[0];

  function loadTxns() {
    if (!token || !bId) return;
    setLoading(true);
    authFetch(`/api/transactions?businessId=${bId}&limit=100`, token)
      .then((d) => setTxns(d.transactions || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadTxns(); }, [token, bId]);

  const filtered = filter === "ALL" ? txns :
    filter === "INCOME" ? txns.filter(t => t.type === "INCOME" || t.type === "PAYMENT_RECEIVED") :
    txns.filter(t => t.type === "EXPENSE" || t.type === "PAYMENT_DUE");

  const totalIn = txns.filter(t => t.type === "INCOME" || t.type === "PAYMENT_RECEIVED").reduce((s, t) => s + Number(t.amount), 0);
  const totalOut = txns.filter(t => t.type === "EXPENSE" || t.type === "PAYMENT_DUE").reduce((s, t) => s + Number(t.amount), 0);

  const groups: Record<string, any[]> = {};
  filtered.forEach(t => {
    const d = new Date(t.occurredAt).toDateString();
    if (!groups[d]) groups[d] = [];
    groups[d].push(t);
  });

  return (
    <AppShell>
      <div className="px-4 py-5 max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Transactions</h1>
          <button onClick={() => router.push("/transactions/create")}
            className="flex items-center gap-1.5 bg-orange-500 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm hover:bg-orange-600 active:scale-95 transition-all">
            <span>+</span> Entry
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
            <p className="text-xs text-gray-400 mb-1">Total Income</p>
            <p className="text-green-600 font-bold text-xl">{fmt(totalIn)}</p>
          </div>
          <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
            <p className="text-xs text-gray-400 mb-1">Total Expense</p>
            <p className="text-red-500 font-bold text-xl">{fmt(totalOut)}</p>
          </div>
        </div>

        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          {["ALL", "INCOME", "EXPENSE"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === f ? "bg-white text-orange-500 shadow-sm" : "text-gray-500"
              }`}>
              {f === "ALL" ? "Sab" : f === "INCOME" ? "Income" : "Expense"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-gray-400 text-sm">Koi entry nahi mili</p>
          </div>
        ) : (
          Object.entries(groups).map(([date, items]) => (
            <div key={date}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
                {new Date(date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
              </p>
              <div className="space-y-2">
                {items.map((t) => {
                  const meta = TYPE_LABELS[t.type] || { label: t.type, color: "text-gray-600", bg: "bg-gray-100" };
                  const isIncome = t.type === "INCOME" || t.type === "PAYMENT_RECEIVED";
                  return (
                    <div key={t.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                        <span className={`font-bold text-lg ${meta.color}`}>{isIncome ? "↑" : "↓"}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 text-sm font-medium truncate">{t.note || "—"}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {t.category?.name} · {t.paymentMethod?.name}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`font-bold text-sm ${meta.color}`}>
                          {isIncome ? "+" : "−"}{fmt(Number(t.amount))}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(t.occurredAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}
