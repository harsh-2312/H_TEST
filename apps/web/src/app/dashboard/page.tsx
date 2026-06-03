"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/api";
import { useAuthStore } from "@/store/useStore";
import { AppShell } from "@/components/layout/AppShell";
import Link from "next/link";

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function DashboardPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [txns, setTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const bId = user?.businessIds?.[0];

  function loadTxns() {
    if (!token || !bId) return;
    authFetch(`/api/transactions?businessId=${bId}&limit=50`, token)
      .then((d) => setTxns(d.transactions || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadTxns(); }, [token, bId]);

  const income = txns.filter(t => t.type === "INCOME" || t.type === "PAYMENT_RECEIVED").reduce((s, t) => s + Number(t.amount), 0);
  const expense = txns.filter(t => t.type === "EXPENSE" || t.type === "PAYMENT_DUE").reduce((s, t) => s + Number(t.amount), 0);
  const balance = income - expense;

  const today = new Date().toDateString();
  const todayTxns = txns.filter(t => new Date(t.occurredAt).toDateString() === today);
  const todayIn = todayTxns.filter(t => t.type === "INCOME" || t.type === "PAYMENT_RECEIVED").reduce((s, t) => s + Number(t.amount), 0);
  const todayOut = todayTxns.filter(t => t.type === "EXPENSE" || t.type === "PAYMENT_DUE").reduce((s, t) => s + Number(t.amount), 0);

  return (
    <AppShell>
      <div className="px-4 py-5 max-w-2xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">Namaste,</p>
            <h1 className="text-xl font-bold text-gray-900">{user?.name} 👋</h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">{new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</p>
          </div>
        </div>

        {/* Balance card */}
        <div className="rounded-2xl bg-orange-500 p-5 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/10 translate-y-8 -translate-x-8" />
          <p className="text-orange-100 text-sm font-medium relative">Net Balance</p>
          <p className={`text-4xl font-bold mt-1 relative ${balance < 0 ? "text-red-200" : "text-white"}`}>
            {fmt(balance)}
          </p>
          <div className="flex gap-6 mt-4 relative">
            <div>
              <p className="text-orange-200 text-xs">↑ Income</p>
              <p className="text-white font-semibold">{fmt(income)}</p>
            </div>
            <div>
              <p className="text-orange-200 text-xs">↓ Expense</p>
              <p className="text-white font-semibold">{fmt(expense)}</p>
            </div>
          </div>
        </div>

        {/* Today card */}
        <div className="rounded-2xl bg-white border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Aaj Ka Hisab</p>
          <div className="flex gap-4">
            <div className="flex-1 bg-green-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Income</p>
              <p className="text-green-600 font-bold text-lg">{fmt(todayIn)}</p>
            </div>
            <div className="flex-1 bg-red-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Expense</p>
              <p className="text-red-500 font-bold text-lg">{fmt(todayOut)}</p>
            </div>
            <div className="flex-1 bg-orange-50 rounded-xl p-3">
              <p className="text-xs text-gray-400">Net</p>
              <p className={`font-bold text-lg ${(todayIn - todayOut) >= 0 ? "text-orange-500" : "text-red-500"}`}>{fmt(todayIn - todayOut)}</p>
            </div>
          </div>
        </div>

        {/* Add transaction button */}
        <button onClick={() => router.push("/transactions/create")}
          className="w-full flex items-center justify-center gap-3 rounded-2xl bg-orange-500 hover:bg-orange-600 active:scale-95 transition-all py-4 text-white font-bold text-base shadow-md">
          <span className="text-2xl font-light">+</span> Nayi Entry Karein
        </button>

        {/* Recent transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-800">Recent Entries</p>
            <Link href="/transactions" className="text-xs text-orange-500 font-medium">Sab Dekho →</Link>
          </div>
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
          ) : txns.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-gray-500 text-sm">Koi entry nahi. Pehli entry karein!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {txns.slice(0, 10).map((t) => {
                const isIncome = t.type === "INCOME" || t.type === "PAYMENT_RECEIVED";
                return (
                  <div key={t.id} className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3 shadow-sm">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isIncome ? "bg-green-100" : "bg-red-100"}`}>
                      <span className="text-base">{isIncome ? "↑" : "↓"}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 text-sm font-medium truncate">{t.note || t.category?.name || "—"}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {t.paymentMethod?.name} · {new Date(t.occurredAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <p className={`font-bold text-sm flex-shrink-0 ${isIncome ? "text-green-600" : "text-red-500"}`}>
                      {isIncome ? "+" : "−"}{fmt(Number(t.amount))}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
