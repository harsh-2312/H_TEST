"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/api";
import { useAuthStore } from "@/store/useStore";
import { AppShell } from "@/components/layout/AppShell";

type TxType = "INCOME" | "EXPENSE";

export default function CreateTransactionPage() {
  const router = useRouter();
  const { token, user } = useAuthStore();
  const bId = user?.businessIds?.[0];

  const canIncome = user?.canAddIncome ?? true;
  const canExpense = user?.canAddExpense ?? true;

  const [display, setDisplay] = useState("0");
  const [expr, setExpr] = useState("");
  const [txType, setTxType] = useState<TxType>(canIncome ? "INCOME" : "EXPENSE");
  const [note, setNote] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [categories, setCategories] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  useEffect(() => {
    if (!token || !bId) router.push("/auth/login");
  }, [token, bId, router]);

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
      const expCats = categoryList.filter((c: any) => c.type === "EXPENSE");
      if (canIncome && incCats.length > 0) setCategoryId(incCats[0].id);
      else if (!canIncome && expCats.length > 0) setCategoryId(expCats[0].id);
      if (paymentMethodList.length > 0) setPaymentMethodId(paymentMethodList[0].id);
    }).catch(() => {
      setCategories([]);
      setPaymentMethods([]);
    });
  }, [token, bId]);

  useEffect(() => {
    const filtered = categories.filter(c =>
      txType === "INCOME" ? c.type === "INCOME" : c.type === "EXPENSE"
    );
    if (filtered.length > 0) setCategoryId(filtered[0].id);
    else setCategoryId("");
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
    const opKeys = ["+", "-", "*", "/"];
    const isOp = opKeys.includes(key);
    const newExpr = (expr === "0" && !isNaN(Number(key)) && !isOp) ? key : expr + key;
    setExpr(newExpr);
    try {
      const result = Function(`"use strict"; return (${newExpr})`)();
      if (isFinite(result)) setDisplay(String(result));
      else setDisplay(newExpr);
    } catch { setDisplay(newExpr); }
  }

  async function handleSave() {
    const amount = parseFloat(display);
    if (!token) { setError("Not authenticated"); return; }
    if (!bId) { setError("Business not selected"); return; }
    if (!amount || isNaN(amount) || amount <= 0) { setError("Valid amount daalo"); return; }
    if (!categoryId) { setError("Category select karo"); return; }
    if (!paymentMethodId) { setError("Payment method select karo"); return; }
    if (txType === "INCOME" && !canIncome) { setError("Income add karne ki permission nahi hai"); return; }
    if (txType === "EXPENSE" && !canExpense) { setError("Expense add karne ki permission nahi hai"); return; }

    setLoading(true);
    setError("");
    try {
      await authFetch("/api/transactions", token, {
        method: "POST",
        body: JSON.stringify({
          businessId: bId,
          amount,
          type: txType,
          paymentMethodId,
          categoryId,
          note: note || "",
          occurredAt: new Date(occurredAt).toISOString(),
          deviceId: "web-browser",
        }),
      });
      setSuccess(true);
      setDisplay("0");
      setExpr("");
      setNote("");
      setShowNoteInput(false);
      setTimeout(() => { setSuccess(false); router.push("/transactions"); }, 1500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const filteredCats = Array.isArray(categories) ? categories.filter(c =>
    txType === "INCOME" ? c.type === "INCOME" : c.type === "EXPENSE"
  ) : [];

  const selectedCategory = filteredCats.find(c => c.id === categoryId);
  const displayNum = parseFloat(display);
  const formattedDisplay = isNaN(displayNum) ? display :
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(displayNum);

  const dateObj = new Date(occurredAt);
  const dateStr = dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const timeStr = dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  if (!token || !bId) return null;

  const calcRows = [
    ["AC", "⌫", "%", "÷"],
    ["7", "8", "9", "×"],
    ["4", "5", "6", "−"],
    ["1", "2", "3", "+"],
    ["0", ".", "="],
  ];
  const opMap: Record<string, string> = { "÷": "/", "×": "*", "−": "-" };

  return (
    <AppShell>
      <div className="hisabo-calc-root">
        {/* Top bar */}
        <div className="hisabo-topbar">
          <button className="hisabo-topbar-pill" onClick={() => {
            const input = document.getElementById("date-input") as HTMLInputElement;
            input?.showPicker?.(); input?.click();
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {dateStr}
            <input id="date-input" type="datetime-local" value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }} />
          </button>

          <button className="hisabo-topbar-pill" onClick={() => {
            const input = document.getElementById("time-input") as HTMLInputElement;
            input?.showPicker?.(); input?.click();
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {timeStr}
            <input id="time-input" type="time" value={occurredAt.slice(11, 16)}
              onChange={(e) => setOccurredAt(occurredAt.slice(0, 11) + e.target.value)}
              style={{ position: "absolute", opacity: 0, width: 0, height: 0, pointerEvents: "none" }} />
          </button>

          <button className="hisabo-topbar-pill hisabo-topbar-pill--category"
            onClick={() => setShowCategoryPicker(!showCategoryPicker)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            {selectedCategory ? selectedCategory.name : "Category"}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          {showCategoryPicker && (
            <div className="hisabo-dropdown">
              {filteredCats.map(cat => (
                <button key={cat.id}
                  className={`hisabo-dropdown-item ${categoryId === cat.id ? "hisabo-dropdown-item--active" : ""}`}
                  onClick={() => { setCategoryId(cat.id); setShowCategoryPicker(false); }}>
                  {cat.name}
                </button>
              ))}
              {filteredCats.length === 0 && <div className="hisabo-dropdown-empty">No categories</div>}
            </div>
          )}
        </div>

        {/* Amount */}
        <div className="hisabo-amount-display">
          <span className="hisabo-rupee">₹</span>
          <span className="hisabo-amount-num">{formattedDisplay}</span>
        </div>

        {/* Note row */}
        <div className="hisabo-person-row">
          <button className="hisabo-note-btn" onClick={() => setShowNoteInput(!showNoteInput)}>
            {note || "Add note"}
          </button>
        </div>
        {showNoteInput && (
          <div className="hisabo-note-row">
            <input className="hisabo-note-input" type="text" placeholder="Note likhein..."
              value={note} onChange={e => setNote(e.target.value)} autoFocus />
          </div>
        )}

        {/* Payment methods */}
        <div className="hisabo-payment-row">
          {(Array.isArray(paymentMethods) ? paymentMethods : []).map(pm => (
            <button key={pm.id}
              className={`hisabo-pm-tab ${paymentMethodId === pm.id ? "hisabo-pm-tab--active" : ""}`}
              onClick={() => setPaymentMethodId(pm.id)}>
              {pm.name}
            </button>
          ))}
        </div>

        {/* Income / Expense buttons */}
        <div className="hisabo-type-row">
          <button
            disabled={!canIncome}
            className={`hisabo-type-btn hisabo-type-btn--income ${txType === "INCOME" ? "hisabo-type-btn--active-income" : ""} ${!canIncome ? "hisabo-type-btn--disabled" : ""}`}
            onClick={async () => {
              if (!canIncome) return;
              if (txType !== "INCOME") setTxType("INCOME");
              else await handleSave();
            }}>
            <span className="hisabo-type-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12l7-7 7 7"/></svg>
            </span>
            {loading && txType === "INCOME" ? "Saving..." : "Income"}
          </button>
          <button
            disabled={!canExpense}
            className={`hisabo-type-btn hisabo-type-btn--expense ${txType === "EXPENSE" ? "hisabo-type-btn--active-expense" : ""} ${!canExpense ? "hisabo-type-btn--disabled" : ""}`}
            onClick={async () => {
              if (!canExpense) return;
              if (txType !== "EXPENSE") setTxType("EXPENSE");
              else await handleSave();
            }}>
            <span className="hisabo-type-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 19V5M5 12l7 7 7-7"/></svg>
            </span>
            {loading && txType === "EXPENSE" ? "Saving..." : "Expense"}
          </button>
        </div>

        {error && <div className="hisabo-msg hisabo-msg--error">{error}</div>}
        {success && <div className="hisabo-msg hisabo-msg--success">✓ Saved!</div>}

        {/* Calculator */}
        <div className="hisabo-calc-grid">
          {calcRows.map((row, ri) => (
            <div key={ri} className={`hisabo-calc-row${row.length === 3 ? " hisabo-calc-row--last" : ""}`}>
              {row.map((key) => {
                const isOp = ["÷", "×", "−", "+", "="].includes(key);
                const isSpecial = ["AC", "⌫", "%"].includes(key);
                const sendKey = opMap[key] ?? key;
                return (
                  <button key={key}
                    className={`hisabo-calc-btn${isOp ? " hisabo-calc-btn--op" : ""}${isSpecial ? " hisabo-calc-btn--special" : ""}`}
                    onClick={() => calcPress(sendKey === key ? key : sendKey)}>
                    {key === "⌫" ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/></svg>
                    ) : key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .hisabo-calc-root { max-width: 480px; margin: 0 auto; padding: 12px 12px 24px; background: #F9FAFB; min-height: 100vh; display: flex; flex-direction: column; gap: 0; position: relative; }
        .hisabo-topbar { display: flex; gap: 6px; align-items: center; padding: 10px 4px 8px; flex-wrap: wrap; position: relative; }
        .hisabo-topbar-pill { display: flex; align-items: center; gap: 5px; background: white; border: 1.5px solid #E5E7EB; border-radius: 999px; padding: 5px 12px; font-size: 13px; color: #374151; font-weight: 500; cursor: pointer; position: relative; white-space: nowrap; transition: border-color 0.15s; }
        .hisabo-topbar-pill:hover { border-color: #F97316; }
        .hisabo-dropdown { position: absolute; top: 44px; right: 4px; background: white; border: 1.5px solid #E5E7EB; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); z-index: 100; min-width: 160px; overflow: hidden; }
        .hisabo-dropdown-item { display: block; width: 100%; padding: 10px 16px; text-align: left; font-size: 14px; color: #374151; background: none; border: none; cursor: pointer; transition: background 0.1s; }
        .hisabo-dropdown-item:hover { background: #FFF7ED; }
        .hisabo-dropdown-item--active { color: #F97316; font-weight: 600; background: #FFF7ED; }
        .hisabo-dropdown-empty { padding: 10px 16px; font-size: 13px; color: #9CA3AF; }
        .hisabo-amount-display { display: flex; align-items: baseline; justify-content: flex-end; padding: 8px 8px 4px; gap: 4px; }
        .hisabo-rupee { font-size: 32px; font-weight: 700; color: #111827; }
        .hisabo-amount-num { font-size: 52px; font-weight: 800; color: #111827; font-variant-numeric: tabular-nums; line-height: 1; letter-spacing: -2px; }
        .hisabo-person-row { display: flex; align-items: center; justify-content: flex-end; padding: 6px 8px; border-bottom: 1px solid #F3F4F6; border-top: 1px solid #F3F4F6; margin: 0 0 4px; }
        .hisabo-note-btn { background: none; border: none; cursor: pointer; color: #9CA3AF; font-size: 13px; padding: 0; }
        .hisabo-note-row { padding: 4px 8px 6px; }
        .hisabo-note-input { width: 100%; border: 1.5px solid #E5E7EB; border-radius: 8px; padding: 8px 12px; font-size: 14px; color: #374151; outline: none; background: white; }
        .hisabo-note-input:focus { border-color: #F97316; }
        .hisabo-payment-row { display: flex; gap: 6px; padding: 8px 4px; overflow-x: auto; scrollbar-width: none; border: 1.5px solid #E5E7EB; border-radius: 12px; background: white; margin: 4px 0; }
        .hisabo-payment-row::-webkit-scrollbar { display: none; }
        .hisabo-pm-tab { padding: 6px 14px; border-radius: 8px; border: none; background: none; font-size: 13px; font-weight: 500; color: #6B7280; cursor: pointer; white-space: nowrap; transition: background 0.15s, color 0.15s; flex-shrink: 0; }
        .hisabo-pm-tab:hover { background: #F3F4F6; color: #374151; }
        .hisabo-pm-tab--active { background: #FFF7ED; color: #F97316; font-weight: 600; }
        .hisabo-type-row { display: flex; gap: 10px; padding: 8px 0; }
        .hisabo-type-btn { flex: 1; padding: 14px 0; border-radius: 999px; border: none; font-size: 16px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.15s; background: #F3F4F6; color: #6B7280; }
        .hisabo-type-btn:active { transform: scale(0.97); }
        .hisabo-type-btn--active-income { background: #22C55E; color: white; box-shadow: 0 4px 14px rgba(34,197,94,0.35); }
        .hisabo-type-btn--active-expense { background: #EF4444; color: white; box-shadow: 0 4px 14px rgba(239,68,68,0.35); }
        .hisabo-type-btn--disabled { opacity: 0.35; cursor: not-allowed; }
        .hisabo-type-icon { display: flex; align-items: center; }
        .hisabo-msg { padding: 8px 12px; border-radius: 8px; font-size: 13px; font-weight: 500; margin: 0 0 4px; }
        .hisabo-msg--error { background: #FEE2E2; color: #DC2626; }
        .hisabo-msg--success { background: #DCFCE7; color: #16A34A; }
        .hisabo-calc-grid { display: flex; flex-direction: column; gap: 8px; margin-top: 6px; }
        .hisabo-calc-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .hisabo-calc-row--last { grid-template-columns: 2fr 1fr 1fr; }
        .hisabo-calc-btn { height: 64px; border-radius: 14px; border: none; font-size: 22px; font-weight: 600; cursor: pointer; background: white; color: #374151; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.06); transition: transform 0.1s, box-shadow 0.1s; -webkit-tap-highlight-color: transparent; }
        .hisabo-calc-btn:active { transform: scale(0.93); box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .hisabo-calc-btn--special { background: #FFF7ED; color: #F97316; }
        .hisabo-calc-btn--op { background: #F97316; color: white; box-shadow: 0 3px 10px rgba(249,115,22,0.35); }
        @media (max-width: 380px) { .hisabo-amount-num { font-size: 42px; } .hisabo-calc-btn { height: 56px; font-size: 19px; } }
      `}</style>
    </AppShell>
  );
}
