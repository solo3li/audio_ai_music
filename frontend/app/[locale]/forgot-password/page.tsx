"use client";

import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import Navbar from "../../../src/components/Navbar";
import { Mail, ArrowRight, ArrowLeft } from "lucide-react";
import { useState } from "react";
import api from "../../../src/utils/api";
import { Link } from "../../../src/i18n/routing";

export default function ForgotPasswordPage() {
  const t = useTranslations("Auth");
  const locale = useLocale();
  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight;

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await api.post("/api/auth/forgot-password", { email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.Message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0a0015] flex flex-col">
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[80%] h-[500px] bg-violet-600/10 blur-[120px] pointer-events-none z-0 rounded-full" />
      
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 relative z-10 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
          
          <h1 className="text-3xl font-bold text-white mb-2 text-center">{t('forgotPassword') || "Reset Password"}</h1>
          <p className="text-white/60 text-center text-sm mb-8">
            {t('forgotPasswordDesc') || "Enter your email address and we'll send you a link to reset your password."}
          </p>

          {success ? (
            <div className="text-center space-y-6">
              <div className="p-4 rounded-xl bg-green-500/20 border border-green-500/50 text-green-200">
                {t('resetLinkSent') || "If an account with this email exists, a password reset link has been sent. Please check your inbox."}
              </div>
              <Link href="/login" className="inline-block text-violet-400 hover:text-violet-300 font-medium">
                {t('backToLogin') || "Back to Login"}
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-200 text-sm">{error}</div>}
              
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">{t('email')}</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none rtl:left-auto rtl:right-0 rtl:pr-3">
                    <Mail className="h-5 w-5 text-white/40 group-focus-within:text-violet-400 transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-10 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
                    placeholder="user@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg overflow-hidden shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/10 transition-opacity duration-300" />
                <span className="relative">{loading ? "..." : (t('sendResetLink') || "Send Reset Link")}</span>
                <ArrowIcon className={`w-5 h-5 relative transition-transform duration-300 ${locale === 'ar' ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
              </button>
            </form>
          )}

          {!success && (
            <div className="mt-6 text-center">
              <Link href="/login" className="text-violet-400 hover:text-violet-300 text-sm font-medium">
                {t('backToLogin') || "Back to Login"}
              </Link>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
