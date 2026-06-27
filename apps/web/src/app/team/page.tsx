"use client";
import { useEffect, useState } from "react";
import { authFetch, apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/useStore";
import { AppShell } from "@/components/layout/AppShell";

const ROLE_META: Record<string, { label: string; color: string; bg: string }> = {
  OWNER:      { label: "Owner",      color: "text-orange-600", bg: "bg-orange-50" },
  MANAGER:    { label: "Manager",    color: "text-blue-600",   bg: "bg-blue-50" },
  STAFF:      { label: "Staff",      color: "text-gray-600",   bg: "bg-gray-100" },
  ACCOUNTANT: { label: "Accountant", color: "text-green-600",  bg: "bg-green-50" },
};

export default function TeamPage() {
  const { token, user } = useAuthStore();
  const bId = user?.businessIds?.[0];
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newCreds, setNewCreds] = useState<{ email: string; password: string; name: string } | null>(null);

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STAFF" });

  useEffect(() => {
    if (!token || !bId) return;
    authFetch(`/api/users?businessId=${bId}`, token)
      .then(setMembers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, bId]);

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await authFetch(`/api/users/${userId}/role`, token!, { method: "PUT", body: JSON.stringify({ role }) });
      setMembers(m => m.map(u => u.id === userId ? { ...u, role } : u));
    } catch (err) { alert((err as Error).message); }
  };

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) return alert("Sab fields bharo!");
    if (form.password.length < 8) return alert("Password kam se kam 8 characters ka hona chahiye!");
    setCreating(true);
    try {
      await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, businessName: form.name + " (Staff)" }),
      });
      setNewCreds({ email: form.email, password: form.password, name: form.name });
      setForm({ name: "", email: "", password: "", role: "STAFF" });
      setShowForm(false);
      // Refresh list
      const updated = await authFetch(`/api/users?businessId=${bId}`, token!);
      setMembers(updated);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppShell>
      <div className="px-4 py-5 max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Team Members</h1>
            <p className="text-gray-400 text-sm mt-0.5">Apni team manage karein</p>
          </div>
          {user?.role === "OWNER" && (
            <button onClick={() => setShowForm(s => !s)}
              className="bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-xl shadow hover:bg-orange-600 active:scale-95 transition-all">
              + Add
            </button>
          )}
        </div>

        {/* Add Member Form */}
        {showForm && (
          <div className="bg-white border border-orange-100 rounded-2xl p-4 shadow-sm space-y-3">
            <p className="text-sm font-bold text-gray-800">Naya Member Banayein</p>
            {[
              { label: "Naam", key: "name", type: "text", placeholder: "e.g. Ramesh" },
              { label: "Email", key: "email", type: "email", placeholder: "ramesh@example.com" },
              { label: "Password", key: "password", type: "text", placeholder: "Min 8 characters" },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-gray-500 mb-1 block">{f.label}</label>
                <input type={f.type} value={(form as any)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-orange-400 focus:bg-white transition" />
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Role</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-orange-400 transition">
                {["MANAGER", "STAFF", "ACCOUNTANT"].map(r => (
                  <option key={r} value={r}>{ROLE_META[r].label}</option>
                ))}
              </select>
            </div>
            <button onClick={handleCreate} disabled={creating}
              className="w-full bg-orange-500 text-white font-bold py-2.5 rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-all active:scale-95">
              {creating ? "Bana raha hai..." : "Account Banayein"}
            </button>
          </div>
        )}

        {/* New credentials card */}
        {newCreds && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-2">
            <p className="text-green-700 font-bold text-sm">✅ Account ban gaya! Yeh credentials share karein:</p>
            <div className="bg-white rounded-xl p-3 font-mono text-sm space-y-1">
              <p><span className="text-gray-400">Naam: </span><span className="text-gray-800 font-semibold">{newCreds.name}</span></p>
              <p><span className="text-gray-400">Email: </span><span className="text-gray-800 font-semibold">{newCreds.email}</span></p>
              <p><span className="text-gray-400">Password: </span><span className="text-gray-800 font-semibold">{newCreds.password}</span></p>
            </div>
            <button onClick={() => {
              navigator.clipboard.writeText(`Email: ${newCreds.email}\nPassword: ${newCreds.password}`);
              alert("Copied!");
            }} className="w-full bg-green-500 text-white text-sm font-bold py-2 rounded-xl hover:bg-green-600 transition">
              📋 Copy Credentials
            </button>
            <button onClick={() => setNewCreds(null)} className="w-full text-gray-400 text-xs py-1">Dismiss</button>
          </div>
        )}

        {/* Total count */}
        <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 flex items-center justify-between">
          <span className="text-orange-600 text-sm font-medium">Total Members</span>
          <span className="text-orange-600 font-bold text-xl">{members.length}</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : members.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <p className="text-3xl mb-2">👥</p>
            <p className="text-gray-400 text-sm">Koi team member nahi</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map(m => {
              const roleMeta = ROLE_META[m.role] || { label: m.role, color: "text-gray-600", bg: "bg-gray-100" };
              const initials = m.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
              return (
                <div key={m.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-4 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm flex-shrink-0">
                        {initials}
                      </div>
                      <div>
                        <p className="text-gray-900 text-sm font-semibold">{m.name}</p>
                        <p className="text-gray-400 text-xs">{m.email}</p>
                        <p className="text-gray-300 text-xs mt-0.5">Joined {new Date(m.joinedAt || m.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${roleMeta.bg} ${roleMeta.color}`}>
                      {roleMeta.label}
                    </span>
                  </div>
                  {user?.role === "OWNER" && m.id !== user.id && (
                    <div className="mt-3 pt-3 border-t border-gray-50">
                      <p className="text-xs text-gray-400 mb-2">Role change karein:</p>
                      <div className="flex gap-2 flex-wrap">
                        {["MANAGER", "STAFF", "ACCOUNTANT"].map(r => {
                          const rm = ROLE_META[r];
                          return (
                            <button key={r} onClick={() => handleRoleChange(m.id, r)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                                m.role === r ? `${rm.bg} ${rm.color} border-current` : "bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100"
                              }`}>
                              {rm.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
