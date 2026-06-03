"use client";
import { useEffect, useState } from "react";
import { authFetch } from "@/lib/api";
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

  return (
    <AppShell>
      <div className="px-4 py-5 max-w-2xl mx-auto space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-400 text-sm mt-0.5">Kaun kaun aapke business mein hai</p>
        </div>

        {/* Total count */}
        <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 flex items-center justify-between">
          <span className="text-orange-600 text-sm font-medium">Total Members</span>
          <span className="text-orange-600 font-bold text-xl">{members.length}</span>
        </div>

        {/* Invite info */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <p className="text-blue-700 text-sm font-semibold">👥 Team Member Kaise Add Karein?</p>
          <p className="text-blue-500 text-xs mt-1">
            Unhe <span className="font-mono font-semibold">/auth/register</span> pe register karne ko bolein. Phir admin se businessId assign karwayen.
          </p>
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
                  {/* Role change (only owner can change, not themselves) */}
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
