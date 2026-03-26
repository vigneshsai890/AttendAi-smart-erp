"use client";

import { useEffect, useState } from "react";
import Background from "@/components/Background";
import Navbar from "@/components/Navbar";
import { useToast } from "@/components/Toast";

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
      .then(s => {
        // We'd need an endpoint to check 2FA status; for now use session
      });
  }, []);

  const setupTwoFA = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
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
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
    <>
      <Background />
      <Navbar />
      <div className="relative z-10 pt-[60px]">
        <div className="max-w-[600px] mx-auto px-[26px] py-[30px]">
          <h1 className="att-a1 text-[24px] font-extrabold tracking-[-0.5px] mb-2">Security Settings</h1>
          <p className="att-a1 text-[13px] text-white/50 font-['DM_Sans',sans-serif] mb-6">Manage two-factor authentication for your account.</p>

          <div className="att-glass att-a2 p-6 mb-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[14px] font-bold mb-1">Two-Factor Authentication</h3>
                <p className="text-[11px] text-white/50 font-['DM_Sans',sans-serif]">Add an extra layer of security using TOTP.</p>
              </div>
              <span className={`px-3 py-[4px] rounded-full text-[10px] font-bold ${
                twoFAEnabled
                  ? "bg-[rgba(52,211,153,.11)] text-[#34D399] border border-[rgba(52,211,153,.2)]"
                  : "bg-[rgba(248,113,113,.11)] text-[#F87171] border border-[rgba(248,113,113,.2)]"
              }`}>
                {twoFAEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>

            {!twoFAEnabled && !qrCode && (
              <button onClick={setupTwoFA} disabled={loading}
                className="w-full py-3 border-none rounded-xl bg-gradient-to-br from-[#5EAEFF] to-[#818CF8] text-white text-[12px] font-bold cursor-pointer shadow-[0_4px_18px_rgba(94,174,255,.28)] hover:-translate-y-[1px] active:scale-[0.98] transition-all disabled:opacity-50">
                {loading ? "Setting up..." : "🔐 Enable 2FA"}
              </button>
            )}

            {qrCode && !twoFAEnabled && (
              <div className="text-center" style={{ animation: "att-fup .4s both" }}>
                <p className="text-[11px] text-white/50 font-['DM_Sans',sans-serif] mb-4">
                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                </p>
                <div className="inline-block p-3 rounded-2xl bg-white mb-4">
                  <img src={qrCode} alt="2FA QR Code" className="w-[180px] h-[180px]" />
                </div>
                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] mb-4">
                  <p className="text-[9px] text-white/40 font-['DM_Sans',sans-serif] mb-1">Manual entry key:</p>
                  <code className="text-[12px] text-[#5EAEFF] font-mono font-bold tracking-widest">{secret}</code>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    maxLength={6}
                    value={token}
                    onChange={e => setToken(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-white text-center tracking-[0.5em] font-mono text-lg font-bold focus:border-[#5EAEFF]/50 focus:ring-1 focus:ring-[#5EAEFF]/30 transition-all outline-none"
                    placeholder="000000"
                  />
                  <button onClick={verifyTwoFA} disabled={loading || token.length !== 6}
                    className="w-full py-3 border-none rounded-xl bg-gradient-to-br from-[#34D399] to-[#5EAEFF] text-white text-[12px] font-bold cursor-pointer shadow-[0_4px_18px_rgba(52,211,153,.28)] hover:-translate-y-[1px] active:scale-[0.98] transition-all disabled:opacity-50">
                    {loading ? "Verifying..." : "✅ Verify & Enable"}
                  </button>
                </div>
              </div>
            )}

            {twoFAEnabled && (
              <div className="p-4 rounded-xl bg-[rgba(52,211,153,.06)] border border-[rgba(52,211,153,.15)] text-center">
                <div className="text-[28px] mb-2">🛡️</div>
                <p className="text-[12px] text-[#34D399] font-bold mb-1">2FA is active</p>
                <p className="text-[10px] text-white/40 font-['DM_Sans',sans-serif]">Your account is protected with two-factor authentication.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
