"use client";

import { useTranslations, useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "../../src/i18n/routing";
import Navbar from "../../src/components/Navbar";
import Footer from "../../src/components/Footer";
import { AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";

export default function NotFoundPage() {
  const t = useTranslations("NotFound");
  const locale = useLocale();
  const isRtl = locale === 'ar';

  return (
    <div className="relative min-h-screen bg-[#0a0015] flex flex-col font-sans">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/4 w-[60%] h-[500px] bg-violet-600/10 blur-[150px] pointer-events-none z-0 rounded-full" />
      
      <Navbar />

      <main className="flex-1 flex items-center justify-center relative z-10 px-4 pt-32 pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-lg mx-auto"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.15)]">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          
          <h1 className="text-8xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-fuchsia-500 mb-4">
            404
          </h1>
          <h2 className="text-3xl font-bold text-white mb-4">
            {t('title')}
          </h2>
          <p className="text-white/60 text-lg mb-8 leading-relaxed">
            {t('subtitle')}
          </p>
          
          <Link 
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-full font-bold text-lg hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all"
          >
            {isRtl ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            {t('backHome')}
          </Link>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
