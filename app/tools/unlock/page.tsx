"use client";

import { Suspense, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function UnlockForm() {
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const params = useSearchParams();
  const from   = params.get("from") ?? "/tools/pose-editor";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push(from);
      } else {
        setError("Incorrect password");
        setPassword("");
        inputRef.current?.focus();
      }
    } catch {
      setError("Network error — try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <input
        ref={inputRef}
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Password"
        autoFocus
        required
        className="w-full bg-[#111] border border-brand-border rounded-xl px-4 py-3 text-white placeholder:text-brand-muted focus:outline-none focus:border-brand-red/60 transition-colors text-sm"
      />

      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !password}
        className="w-full bg-brand-red hover:bg-brand-red-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors text-sm"
      >
        {loading ? "Checking…" : "Unlock"}
      </button>
    </form>
  );
}

export default function UnlockPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="bg-brand-card border border-brand-border rounded-2xl p-8 space-y-6">
          <div className="text-center">
            <div className="text-4xl mb-3">🔒</div>
            <h1 className="text-xl font-bold text-white">Editor Access</h1>
            <p className="text-brand-muted text-sm mt-1">Enter the password to continue</p>
          </div>

          <Suspense>
            <UnlockForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
