"use client";

import { useEffect, useState } from "react";
import { getAuthToken } from "@/components/AuthProvider";
import Background from "@/components/Background";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/Toast";
import { ShieldCheck } from "lucide-react";

export default function SecuritySettings() {
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetch("/api/auth/session")
      .then(r => r.json())
      .then(() => {
        // We'd need an endpoint to check 2FA status; for now use session
      });
  }, []);

  const setupTwoFA = async () => {
    setLoading(true);
    try {
      const t = await getAuthToken();
      const res = await fetch("/api/auth/2fa/setup", { method: "POST", headers: { Authorization: `Bearer ${t}` } });
      const data = await res.json();
      if (data.error) { showToast(`❌ ${data.error}`); return; }
      setQrCode(data.qrCodeImage);
      setSecret(data.secret);
    } catch { showToast("❌ Failed to setup 2FA"); }
    finally { setLoading(false); }
  };

  const verifyTwoFA = async () => {
    setLoading(true);
    try {
      const t = await getAuthToken();
      const res = await fetch("/api/auth/2fa/verify", {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
        method: "POST",
        
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success) {
        setTwoFAEnabled(true);
        setQrCode("");
        showToast("✅ 2FA enabled successfully!");
      } else {
        showToast(`❌ ${data.error || "Invalid token"}`);
      }
    } catch { showToast("❌ Verification failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col relative overflow-hidden font-sans pb-32">
      <Background />
      <Navbar />

      {/* Cinematic Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse delay-700" />
      </div>

      <div className="relative z-10 pt-32 pb-20 max-w-[700px] mx-auto px-8 w-full">

        {/* Premium Security Header */}
        <div className="relative mb-12 p-10 rounded-[3.5rem] overflow-hidden group border border-white/5 bg-white/[0.01] backdrop-blur-3xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent -z-10" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] group-hover:bg-indigo-500/20 transition-all duration-700" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl mb-6 text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] ring-1 ring-white/5">
              🛡️ Security Terminal · Secure
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-4 italic drop-shadow-2xl">
              Encryption <span className="text-white/20">Control</span>
            </h1>
            <p className="text-[12px] text-white/40 font-bold uppercase tracking-wide leading-relaxed max-w-md">
              Manage multi-factor authentication protocols and cryptographic access keys for your institutional identity.
            </p>
          </div>
        </div>

        {/* 2FA Configuration Matrix */}
        <div className="p-1 rounded-[4rem] border border-white/5 bg-white/[0.01] backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
          <div className="p-10 relative z-10">
            <div className="flex items-center justify-between mb-10 pb-10 border-b border-white/[0.03]">
              <div className="space-y-1.5">
                <h3 className="text-lg font-black text-white italic tracking-tight">Two-Factor Authentication</h3>
                <p className="text-[11px] text-white/30 font-bold uppercase tracking-widest font-mono">Protocol: TOTP-SHA1</p>
              </div>
              <div className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ring-1 transition-all duration-500 ${
                twoFAEnabled
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 ring-emerald-500/5 shadow-emerald-500/10"
                  : "bg-red-500/10 text-red-400 border-red-500/20 ring-red-500/5 shadow-red-500/10"
              }`}>
                {twoFAEnabled ? "ENCRYPTED" : "UNPROTECTED"}
              </div>
            </div>

            <div className="space-y-8">
              {!twoFAEnabled && !qrCode && (
                <div className="space-y-8">
                  <p className="text-[13px] text-white/40 leading-relaxed italic">
                    Establish an additional layer of security by linking a mobile authenticator. This process generates a unique cryptographic secret tied to your profile.
                  </p>
                  <button
                    onClick={setupTwoFA}
                    disabled={loading}
                    className="w-full py-6 rounded-[3rem] bg-white text-black text-[13px] font-black uppercase tracking-[0.4em] shadow-[0_30px_70px_rgba(255,255,255,0.15)] hover:bg-white/90 active:scale-[0.98] transition-all ring-1 ring-white/20 disabled:opacity-50"
                  >
                    {loading ? "Initializing..." : "Initialize 2FA Link"}
                  </button>
                </div>
              )}

              {qrCode && !twoFAEnabled && (
                <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="text-center space-y-6">
                    <p className="text-[11px] text-white/30 font-bold uppercase tracking-[0.2em] leading-relaxed max-w-sm mx-auto">
                      Scan the neural code with your authenticator terminal (Google Auth, Authy, etc.)
                    </p>
                    <div className="inline-block p-8 bg-white rounded-[3.5rem] shadow-[0_0_100px_rgba(255,255,255,0.15)] relative overflow-hidden group ring-1 ring-white/20">
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1500 z-10" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrCode} alt="2FA QR Code" className="w-[200px] h-[200px] relative z-0" />
                    </div>
                  </div>

                  <div className="p-6 rounded-[2.5rem] bg-white/[0.03] border border-white/10 text-center group/secret relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/[0.03] to-transparent opacity-0 group-hover/secret:opacity-100 transition-opacity" />
                    <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.3em] mb-2 relative z-10">Manual Cipher Key</p>
                    <code className="text-sm text-indigo-400 font-mono font-black tracking-[0.3em] relative z-10">{secret}</code>
                  </div>

                  <div className="space-y-5">
                    <div className="relative group/input">
                      <input
                        type="text"
                        maxLength={6}
                        value={token}
                        onChange={e => setToken(e.target.value.replace(/\D/g, ""))}
                        className="w-full px-8 py-6 rounded-[2.5rem] bg-white/[0.04] border border-white/10 text-white text-center tracking-[0.6em] font-mono text-3xl font-black focus:border-indigo-500/50 focus:bg-white/[0.06] outline-none transition-all shadow-inner ring-1 ring-white/5"
                        placeholder="••••••"
                      />
                    </div>
                    <button
                      onClick={verifyTwoFA}
                      disabled={loading || token.length !== 6}
                      className="w-full py-6 rounded-[3rem] bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-[13px] font-black uppercase tracking-[0.4em] shadow-[0_30px_70px_rgba(79,70,229,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 ring-1 ring-white/10"
                    >
                      {loading ? "Verifying..." : "Verify & Connect"}
                    </button>
                  </div>
                </div>
              )}

              {twoFAEnabled && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-8 animate-in zoom-in-95 duration-700">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-2xl shadow-emerald-500/10">
                      <div className="text-4xl">🛡️</div>
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-[#0c0c0e] shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-emerald-400 italic tracking-tight uppercase">Neural Protection Active</h3>
                    <p className="text-[12px] text-white/30 font-bold uppercase tracking-[0.2em] leading-relaxed">
                      Your identity is secured via multi-factor authentication.
                    </p>
                  </div>
                  <div className="w-full p-6 rounded-[2rem] bg-emerald-500/[0.02] border border-emerald-500/10">
                    <p className="text-[11px] text-emerald-400/60 font-medium italic leading-relaxed">
                      "Security protocols are established. All high-privilege operations now require biometric verification."
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card Accent Layers */}
          <div className="absolute top-0 right-0 p-10 text-white/[0.01] -z-10 group-hover:text-white/[0.03] transition-colors duration-700">
            <ShieldCheck size={280} strokeWidth={0.5} />
          </div>
        </div>
      </div>
    </div>
  );
}
