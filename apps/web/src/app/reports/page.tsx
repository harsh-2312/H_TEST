"use client";
import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api";
import { useAuthStore } from "@/store/useStore";
import { AppShell } from "@/components/layout/AppShell";

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const QUICK_RANGES = [
  { label: "Aaj", getDates: () => { const t = new Date(); return { from: t.toISOString().slice(0,10), to: t.toISOString().slice(0,10) }; }},
  { label: "Is Hafte", getDates: () => { const t = new Date(); const d = t.getDay(); const from = new Date(t); from.setDate(t.getDate()-d); const to = new Date(from); to.setDate(from.getDate()+6); return { from: from.toISOString().slice(0,10), to: to.toISOString().slice(0,10) }; }},
  { label: "Is Mahine", getDates: () => { const t = new Date(); return { from: new Date(t.getFullYear(), t.getMonth(), 1).toISOString().slice(0,10), to: new Date(t.getFullYear(), t.getMonth()+1, 0).toISOString().slice(0,10) }; }},
  { label: "Pichle Mahine", getDates: () => { const t = new Date(); return { from: new Date(t.getFullYear(), t.getMonth()-1, 1).toISOString().slice(0,10), to: new Date(t.getFullYear(), t.getMonth(), 0).toISOString().slice(0,10) }; }},
];

export default function ReportsPage() {
  const { token, user } = useAuthStore();
  const bId = user?.businessIds?.[0];
  const [txns, setTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState(2); // Is Mahine default

  const now = new Date();
  const [from, setFrom] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10));

  useEffect(() => {
    if (!token || !bId) return;
    setLoading(true);
    authFetch(`/api/transactions?businessId=${bId}&limit=1000&from=${from}&to=${to}T23:59:59`, token)
      .then(d => setTxns(d.transactions || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, bId, from, to]);

  // ── Correct counting logic ──
  const incomeTxns = txns.filter(t => t.type === "INCOME" || t.type === "PAYMENT_RECEIVED");
  const expenseTxns = txns.filter(t => t.type === "EXPENSE" || t.type === "PAYMENT_DUE");
  const income = incomeTxns.reduce((s, t) => s + Number(t.amount), 0);
  const expense = expenseTxns.reduce((s, t) => s + Number(t.amount), 0);
  const profit = income - expense;
  const profitMargin = income > 0 ? ((profit / income) * 100).toFixed(1) : "0.0";

  // By category — separate income vs expense
  const byCatIncome: Record<string, { name: string; amount: number; count: number }> = {};
  const byCatExpense: Record<string, { name: string; amount: number; count: number }> = {};
  txns.forEach(t => {
    const key = t.category?.name || "Unknown";
    const isIncome = t.type === "INCOME" || t.type === "PAYMENT_RECEIVED";
    const target = isIncome ? byCatIncome : byCatExpense;
    if (!target[key]) target[key] = { name: key, amount: 0, count: 0 };
    target[key].amount += Number(t.amount);
    target[key].count += 1;
  });
  const catIncomeList = Object.values(byCatIncome).sort((a, b) => b.amount - a.amount);
  const catExpenseList = Object.values(byCatExpense).sort((a, b) => b.amount - a.amount);

  // By payment method
  const byPM: Record<string, { name: string; income: number; expense: number; count: number }> = {};
  txns.forEach(t => {
    const key = t.paymentMethod?.name || "Unknown";
    if (!byPM[key]) byPM[key] = { name: key, income: 0, expense: 0, count: 0 };
    byPM[key].count += 1;
    if (t.type === "INCOME" || t.type === "PAYMENT_RECEIVED") byPM[key].income += Number(t.amount);
    else byPM[key].expense += Number(t.amount);
  });
  const pmList = Object.values(byPM).sort((a, b) => (b.income + b.expense) - (a.income + a.expense));

  // By team member
  const byUser: Record<string, { name: string; count: number; income: number; expense: number }> = {};
  txns.forEach(t => {
    const key = t.createdBy?.name || "Unknown";
    if (!byUser[key]) byUser[key] = { name: key, count: 0, income: 0, expense: 0 };
    byUser[key].count += 1;
    if (t.type === "INCOME" || t.type === "PAYMENT_RECEIVED") byUser[key].income += Number(t.amount);
    else byUser[key].expense += Number(t.amount);
  });
  const userList = Object.values(byUser).sort((a, b) => b.count - a.count);

  // Daily breakdown for mini chart
  const byDay: Record<string, { income: number; expense: number }> = {};
  txns.forEach(t => {
    const d = t.occurredAt.slice(0, 10);
    if (!byDay[d]) byDay[d] = { income: 0, expense: 0 };
    if (t.type === "INCOME" || t.type === "PAYMENT_RECEIVED") byDay[d].income += Number(t.amount);
    else byDay[d].expense += Number(t.amount);
  });
  const dayList = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0])).slice(-14);
  const maxDay = Math.max(...dayList.map(([, v]) => Math.max(v.income, v.expense)), 1);

  const maxCatExpense = catExpenseList[0]?.amount || 1;
  const maxCatIncome = catIncomeList[0]?.amount || 1;

  function applyRange(idx: number) {
    setActiveRange(idx);
    const { from: f, to: t } = QUICK_RANGES[idx].getDates();
    setFrom(f); setTo(t);
  }

  return (
    <AppShell>
      <div className="px-4 py-5 max-w-2xl mx-auto space-y-5">
        <h1 className="text-xl font-bold text-gray-900">Reports</h1>

        {/* Quick range buttons */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {QUICK_RANGES.map((r, i) => (
            <button key={r.label} onClick={() => applyRange(i)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeRange === i ? "bg-orange-500 text-white shadow-sm" : "bg-white text-gray-500 border border-gray-200"
              }`}>
              {r.label}
            </button>
          ))}
        </div>

        {/* Custom date range */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-gray-400 block mb-1">From</label>
            <input type="date" value={from} onChange={e => { setFrom(e.target.value); setActiveRange(-1); }}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700 text-sm focus:outline-none focus:border-orange-400 transition" />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-400 block mb-1">To</label>
            <input type="date" value={to} onChange={e => { setTo(e.target.value); setActiveRange(-1); }}
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700 text-sm focus:outline-none focus:border-orange-400 transition" />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-1">↑ Total Income</p>
                <p className="text-green-600 font-bold text-xl">{fmt(income)}</p>
                <p className="text-xs text-green-400 mt-0.5">{incomeTxns.length} entries</p>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-1">↓ Total Expense</p>
                <p className="text-red-500 font-bold text-xl">{fmt(expense)}</p>
                <p className="text-xs text-red-300 mt-0.5">{expenseTxns.length} entries</p>
              </div>
              <div className={`${profit >= 0 ? "bg-orange-50 border-orange-100" : "bg-red-50 border-red-100"} border rounded-2xl p-4`}>
                <p className="text-xs text-gray-400 mb-1">Net Profit / Loss</p>
                <p className={`font-bold text-xl ${profit >= 0 ? "text-orange-500" : "text-red-500"}`}>{fmt(profit)}</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <p className="text-xs text-gray-400 mb-1">Profit Margin</p>
                <p className="text-blue-600 font-bold text-xl">{profitMargin}%</p>
                <p className="text-xs text-blue-300 mt-0.5">{txns.length} total entries</p>
              </div>
            </div>

            {/* Mini bar chart - daily */}
            {dayList.length > 1 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <p className="text-sm font-bold text-gray-700 mb-3">Daily Trend</p>
                <div className="flex items-end gap-1 h-20">
                  {dayList.map(([day, v]) => (
                    <div key={day} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className="w-full flex flex-col-reverse gap-0.5">
                        <div className="w-full rounded-sm bg-red-300 transition-all" style={{ height: `${(v.expense / maxDay) * 60}px` }} />
                        <div className="w-full rounded-sm bg-green-400 transition-all" style={{ height: `${(v.income / maxDay) * 60}px` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-400 inline-block" /><span className="text-xs text-gray-400">Income</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-300 inline-block" /><span className="text-xs text-gray-400">Expense</span></div>
                </div>
              </div>
            )}

            {/* Expense by category */}
            {catExpenseList.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <p className="text-sm font-bold text-gray-700 mb-3">Kahan Kharch Hua (Expense by Category)</p>
                <div className="space-y-3">
                  {catExpenseList.slice(0, 8).map(c => (
                    <div key={c.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 font-medium">{c.name}</span>
                        <span className="text-red-500 font-semibold">{fmt(c.amount)} <span className="text-gray-300">({c.count})</span></span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-400 rounded-full transition-all" style={{ width: `${(c.amount / maxCatExpense) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Income by category */}
            {catIncomeList.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <p className="text-sm font-bold text-gray-700 mb-3">Kahan Se Aaya (Income by Category)</p>
                <div className="space-y-3">
                  {catIncomeList.slice(0, 8).map(c => (
                    <div key={c.name}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600 font-medium">{c.name}</span>
                        <span className="text-green-600 font-semibold">{fmt(c.amount)} <span className="text-gray-300">({c.count})</span></span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-green-400 rounded-full transition-all" style={{ width: `${(c.amount / maxCatIncome) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* By payment method */}
            {pmList.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <p className="text-sm font-bold text-gray-700 mb-3">Payment Method Se</p>
                <div className="space-y-2">
                  {pmList.map(p => (
                    <div key={p.name} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5">
                      <span className="text-gray-700 text-sm font-medium">{p.name}</span>
                      <div className="text-right">
                        <p className="text-xs text-green-600">+{fmt(p.income)}</p>
                        <p className="text-xs text-red-500">−{fmt(p.expense)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* By team member */}
            {userList.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <p className="text-sm font-bold text-gray-700 mb-3">Team Member Ke Hisab Se</p>
                <div className="space-y-2">
                  {userList.map(u => {
                    const initials = u.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0,2);
                    return (
                      <div key={u.name} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">{initials}</div>
                          <div>
                            <p className="text-gray-800 text-sm font-medium">{u.name}</p>
                            <p className="text-gray-400 text-xs">{u.count} entries</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-green-600">+{fmt(u.income)}</p>
                          <p className="text-xs text-red-500">−{fmt(u.expense)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {txns.length === 0 && (
              <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
                <p className="text-3xl mb-2">📊</p>
                <p className="text-gray-400 text-sm">Is period mein koi entry nahi</p>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
