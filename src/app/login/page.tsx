"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Background from "@/components/Background";

export default function Login() {
  const router = useRouter();
  const [step, setStep] = useState<"CREDENTIALS" | "TOTP">("CREDENTIALS");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        totp: step === "TOTP" ? totp : "",
      });

      if (res?.error) {
        if (res.error === "2FA_REQUIRED") {
          setStep("TOTP");
        } else {
          setError(res.error === "CredentialsSignin" ? "Invalid email or password" : res.error);
        }
      } else {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        const role = session?.user?.role;
        if (role === "ADMIN") router.push("/admin");
        else if (role === "FACULTY") router.push("/faculty/dashboard");
        else router.push("/student/dashboard");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <Background />

      <div className="w-full max-w-[420px] relative z-10" style={{ animation: "att-fup .5s .04s both" }}>
        <div className="att-glass p-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-30 pointer-events-none" />

          <div className="flex flex-col items-center mb-10 relative z-10">
            <div className="w-[68px] h-[68px] rounded-[18px] bg-gradient-to-br from-[#5EAEFF] via-[#818CF8] to-[#A78BFA] flex items-center justify-center text-[28px] mb-5 shadow-[0_4px_22px_rgba(94,174,255,0.35)]">
              🏛️
            </div>
            <h1 className="text-2xl font-extrabold tracking-[-0.5px] bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent mb-1">
              The Apollo University
            </h1>
            <p className="text-[12px] text-white/40 font-['DM_Sans',sans-serif] tracking-[0.3px]">
              AttendAI · Smart Attendance System
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 relative z-10">
            {step === "CREDENTIALS" ? (
              <div className="space-y-4" style={{ animation: "att-fup .4s both" }}>
                <div className="space-y-[6px]">
                  <label className="text-[9px] font-bold text-white/50 uppercase tracking-[0.9px] pl-1 font-['DM_Sans',sans-serif]">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-[13px] rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/25 focus:bg-white/[0.07] focus:border-[#5EAEFF]/50 focus:ring-1 focus:ring-[#5EAEFF]/30 transition-all outline-none text-[13px] font-['DM_Sans',sans-serif]"
                    placeholder="you@apollo.edu"
                  />
                </div>
                <div className="space-y-[6px]">
                  <label className="text-[9px] font-bold text-white/50 uppercase tracking-[0.9px] pl-1 font-['DM_Sans',sans-serif]">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-[13px] rounded-xl bg-white/[0.04] border border-white/10 text-white placeholder-white/25 focus:bg-white/[0.07] focus:border-[#5EAEFF]/50 focus:ring-1 focus:ring-[#5EAEFF]/30 transition-all outline-none text-[13px] font-['DM_Sans',sans-serif]"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center" style={{ animation: "att-fup .4s both" }}>
                <div className="text-[36px] mb-2">🔐</div>
                <p className="text-[12px] text-white/50 font-['DM_Sans',sans-serif] mb-4">
                  Enter the 6-digit code from your authenticator app.
                </p>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={totp}
                  onChange={(e) => setTotp(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-4 py-4 rounded-xl bg-white/[0.04] border border-white/10 text-white focus:bg-white/[0.07] focus:border-[#818CF8]/50 focus:ring-1 focus:ring-[#818CF8]/30 transition-all outline-none text-center tracking-[0.6em] font-mono text-2xl font-bold"
                  placeholder="000000"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => { setStep("CREDENTIALS"); setTotp(""); setError(""); }}
                  className="text-[11px] text-white/40 hover:text-[#5EAEFF] transition-colors cursor-pointer bg-transparent border-none font-['DM_Sans',sans-serif]"
                >
                  ← Back to login
                </button>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-[rgba(248,113,113,.1)] border border-[rgba(248,113,113,.2)] text-[#F87171] text-[12px] font-medium text-center font-['DM_Sans',sans-serif]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-[13px] border-none rounded-xl bg-gradient-to-br from-[#5EAEFF] to-[#818CF8] text-white text-[13px] font-bold cursor-pointer tracking-[0.2px] shadow-[0_4px_22px_rgba(94,174,255,0.3)] hover:-translate-y-[1px] hover:shadow-[0_8px_30px_rgba(94,174,255,0.45)] active:scale-[0.98] transition-all disabled:opacity-50 mt-6"
            >
              {loading ? "Authenticating..." : step === "CREDENTIALS" ? "Sign In →" : "Verify Identity"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[10px] text-white/30 font-['DM_Sans',sans-serif]">
              Secured with 2FA · AES-256 encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
