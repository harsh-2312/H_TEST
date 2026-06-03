"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/store/useStore";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, businessName }),
      });
      setAuth({ token: data.accessToken, refreshToken: data.refreshToken, user: data.user });
      router.push("/transactions/create");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-3xl">₹</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Hisabo</h1>
          <p className="text-gray-400 text-sm mt-1">Nayi Account Banayein</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-800 mb-5">Register</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {[
              { label: "Aapka Naam", value: name, set: setName, type: "text", placeholder: "e.g. Ramesh Gupta" },
              { label: "Business Ka Naam", value: businessName, set: setBusinessName, type: "text", placeholder: "e.g. Gupta Cloth Store" },
              { label: "Email", value: email, set: setEmail, type: "email", placeholder: "aap@example.com" },
              { label: "Password", value: password, set: setPassword, type: "password", placeholder: "Min 8 characters" },
            ].map(({ label, value, set, type, placeholder }) => (
              <div key={label}>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">{label}</label>
                <input type={type} value={value} onChange={e => set(e.target.value)}
                  placeholder={placeholder}
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none focus:border-orange-400 focus:bg-white transition"
                  required minLength={type === "password" ? 8 : 2} />
              </div>
            ))}

            {error && <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

            <button type="submit" disabled={loading}
              className="w-full rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 active:scale-95 transition-all px-5 py-3.5 text-white font-bold shadow-md">
              {loading ? "Creating account..." : "Account Banayein →"}
            </button>

            <p className="text-center text-sm text-gray-400">
              Already have account?{" "}
              <Link href="/auth/login" className="text-orange-500 font-medium">Login karein</Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
