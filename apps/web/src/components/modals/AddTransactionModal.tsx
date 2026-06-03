"use client";
import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api";
import { useAuthStore } from "@/store/useStore";

const PAYMENT_METHODS_DEFAULT = ["Net Banking", "Bank", "Cash", "Cheque", "UPI"];

type TxType = "INCOME" | "EXPENSE";

export function AddTransactionModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { token, user } = useAuthStore();
  const bId = user?.businessIds?.[0];

  const [display, setDisplay] = useState("0");
  const [expr, setExpr] = useState("");
  const [txType, setTxType] = useState<TxType>("INCOME");
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [occurredAt, setOccurredAt] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (!token || !bId) return;
    Promise.all([
      authFetch(`/api/categories?businessId=${bId}`, token),
      authFetch(`/api/payment-methods?businessId=${bId}`, token),
    ]).then(([cats, pms]) => {
      const categoryList = Array.isArray(cats) ? cats : [];
      const paymentMethodList = Array.isArray(pms) ? pms : [];
      setCategories(categoryList);
      setPaymentMethods(paymentMethodList);
      const incCats = categoryList.filter((c: any) => c.type === "INCOME");
      if (incCats.length > 0) setCategoryId(incCats[0].id);
      else setCategoryId("");
      if (paymentMethodList.length > 0) setPaymentMethodId(paymentMethodList[0].id);
      else setPaymentMethodId("");
    }).catch(() => {
      setCategories([]);
      setPaymentMethods([]);
      setCategoryId("");
      setPaymentMethodId("");
    });
  }, [token, bId]);

  // When type changes, reset category
  useEffect(() => {
    const filtered = categories.filter(c =>
      txType === "INCOME" ? c.type === "INCOME" : c.type === "EXPENSE"
    );
    if (filtered.length > 0) setCategoryId(filtered[0].id);
  }, [txType, categories]);

  function calcPress(key: string) {
    if (key === "AC") { setDisplay("0"); setExpr(""); return; }
    if (key === "⌫") {
      const newExpr = expr.slice(0, -1);
      setExpr(newExpr);
      setDisplay(newExpr || "0");
      return;
    }
    if (key === "=") {
      try {
        const result = Function(`"use strict"; return (${expr || "0"})`)();
        const rounded = Math.round(result * 100) / 100;
        setDisplay(String(rounded));
        setExpr(String(rounded));
      } catch { setDisplay("Error"); }
      return;
    }
    if (key === "%") {
      try {
        const result = Function(`"use strict"; return (${expr || "0"})`)();
        const pct = Math.round(result) / 100;
        setDisplay(String(pct));
        setExpr(String(pct));
      } catch {}
      return;
    }
    const newExpr = (expr === "0" && !isNaN(Number(key))) ? key : expr + key;
    setExpr(newExpr);
    try {
      const result = Function(`"use strict"; return (${newExpr})`)();
      if (isFinite(result)) setDisplay(String(result));
      else setDisplay(newExpr);
    } catch { setDisplay(newExpr); }
  }

  async function handleSave(saveType: TxType) {
    const amount = parseFloat(display);
    if (!token) { setError("Not authenticated"); return; }
    if (!bId) { setError("Business not selected"); return; }
    if (!amount || isNaN(amount) || amount <= 0) { setError("Please enter a valid amount"); return; }
    if (!categoryId) { setError("Please select a category"); return; }
    if (!paymentMethodId) { setError("Please select a payment method"); return; }
    setLoading(true);
    setError("");
    try {
      await authFetch("/api/transactions", token, {
        method: "POST",
        body: JSON.stringify({
          businessId: bId,
          amount,
          type: saveType,
          paymentMethodId,
          categoryId,
          note: note || "",
          occurredAt: new Date(occurredAt).toISOString(),
          deviceId: "web-browser",
        }),
      });
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const filteredCats = Array.isArray(categories) ? categories.filter(c =>
    txType === "INCOME" ? c.type === "INCOME" : c.type === "EXPENSE"
  ) : [];

  const displayNum = parseFloat(display);
  const formattedDisplay = isNaN(displayNum) ? display :
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(displayNum);

  const dateObj = new Date(occurredAt);
  const dateStr = dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const pmButtons = Array.isArray(paymentMethods) ? paymentMethods.slice(0, 4).map(p => p.name) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-sm bg-white rounded-t-3xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {/* Date pill */}
            <button onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-xs text-gray-600 shadow-sm font-medium">
              <span>📅</span> {dateStr}
            </button>
            <button onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-xs text-gray-600 shadow-sm font-medium">
              <span>🕐</span> {timeStr}
            </button>
            {/* Category pill */}
            <select
              aria-label="Select transaction category"
              title="Select transaction category"
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white text-xs text-gray-600 shadow-sm font-medium border-0 outline-none cursor-pointer">
              {filteredCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              {filteredCats.length === 0 && <option value="">Category</option>}
            </select>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl ml-2">✕</button>
        </div>

        {/* Advanced date/time if expanded */}
        {showAdvanced && (
          <div className="px-4 pb-2">
            <input
              type="datetime-local"
              value={occurredAt}
              onChange={e => setOccurredAt(e.target.value)}
              title="Select transaction date and time"
              aria-label="Select transaction date and time"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:border-orange-400" />
          </div>
        )}

        {/* Amount display */}
        <div className="px-4 pb-1 text-right">
          <div className="text-5xl font-bold text-gray-900 tracking-tight">
            ₹{formattedDisplay}
          </div>
        </div>

        {/* Person / Note row */}
        <div className="flex items-center justify-between px-4 py-2">
          <button onClick={() => setShowNote(!showNote)}
            className="flex items-center gap-2 text-gray-400 text-sm">
            <span className="text-base">👤</span>
            <span>{showNote ? "Hide note" : "Add note"}</span>
          </button>
          {showNote && (
            <input value={note} onChange={e => setNote(e.target.value)}
              placeholder="What was this for?"
              className="flex-1 ml-3 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-orange-400" />
          )}
        </div>

        {/* Payment method pills */}
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {paymentMethods.map(pm => (
              <button key={pm.id} onClick={() => setPaymentMethodId(pm.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  paymentMethodId === pm.id
                    ? "border-orange-400 bg-orange-50 text-orange-600"
                    : "border-gray-200 bg-white text-gray-600"
                }`}>
                {pm.name}
              </button>
            ))}
            <button className="flex-shrink-0 w-8 h-8 rounded-xl border border-gray-200 bg-white text-gray-400 flex items-center justify-center text-sm">⚙️</button>
          </div>
        </div>

        {/* Income / Expense buttons */}
        <div className="flex gap-3 px-4 pb-3">
          <button onClick={() => handleSave("INCOME")} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 active:scale-95 transition-all text-white font-semibold rounded-2xl py-3.5 text-base shadow-sm">
            <span className="text-lg">+</span> Income
          </button>
          <button onClick={() => handleSave("EXPENSE")} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 active:scale-95 transition-all text-white font-semibold rounded-2xl py-3.5 text-base shadow-sm">
            <span className="text-lg">−</span> Expense
          </button>
        </div>

        {error && <p className="text-red-500 text-xs text-center pb-2 px-4">{error}</p>}

        {/* Calculator */}
        <div className="grid grid-cols-4 gap-2 px-4 pb-6 bg-gray-50">
          {[
            ["AC", "⌫", "%", "÷"],
            ["7", "8", "9", "×"],
            ["4", "5", "6", "−"],
            ["1", "2", "3", "+"],
            ["0", ".", "="],
          ].map((row, ri) => (
            row.map((key, ki) => {
              const isOrange = ["÷", "×", "−", "+", "="].includes(key);
              const isGray = ["AC", "⌫", "%"].includes(key);
              const isWide = key === "0" && ri === 4;
              return (
                <button
                  key={key}
                  onClick={() => calcPress(key === "÷" ? "/" : key === "×" ? "*" : key === "−" ? "-" : key)}
                  className={`
                    ${isWide ? "col-span-2" : ""}
                    h-14 rounded-2xl text-lg font-semibold transition-all active:scale-95 shadow-sm
                    ${isOrange ? "bg-orange-500 text-white hover:bg-orange-400" :
                      isGray ? "bg-gray-200 text-gray-600 hover:bg-gray-300" :
                      "bg-white text-gray-800 hover:bg-gray-100 border border-gray-100"}
                  `}>
                  {key}
                </button>
              );
            })
          ))}
        </div>
      </div>
    </div>
  );
}
