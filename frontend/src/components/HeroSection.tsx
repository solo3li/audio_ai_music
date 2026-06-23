"use client";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, PlayCircle } from "lucide-react";
import { AnimatedText, GlowPulse } from "./AnimatedText";
import Scene from "./Scene";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "../i18n/routing";

export default function HeroSection() {
  const t = useTranslations("Hero");
  const locale = useLocale();
  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Base */}
      <div className="absolute inset-0 bg-[#0a0015]" />
      
      {/* 3D Interactive Scene */}
      <Scene />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0015]/40 to-[#0a0015] pointer-events-none" />

      {/* Animated Orbs */}
      <GlowPulse className="w-96 h-96 bg-violet-600/10 blur-3xl top-1/4 right-1/4" />
      <GlowPulse className="w-72 h-72 bg-fuchsia-600/5 blur-3xl bottom-1/3 left-1/4" />
      <GlowPulse className="w-64 h-64 bg-purple-700/10 blur-3xl top-1/3 left-1/3" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-32 pb-20 text-center flex flex-col justify-center min-h-screen">
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className={`text-4xl sm:text-5xl ${locale === 'ar' ? 'md:text-7xl' : 'md:text-6xl'} font-extrabold text-white leading-tight mb-4 max-w-4xl mx-auto`}
        >
          {locale === 'ar' ? (
            <>
              قوة الذكاء في خدمة{" "}
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                إبداعك
              </span>
            </>
          ) : (
            <>
              The Power of AI at{" "}
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                Your Service
              </span>
            </>
          )}
        </motion.h1>


        {/* Subtitle */}
        <AnimatedText
          text={t('subtitle')}
          as="p"
          delay={0.5}
          className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed"
        />

        {/* Gradient word highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mb-10"
        >
          <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
            {t('highlights')}
          </span>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/pricing"
            className="group relative w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-lg overflow-hidden shadow-[0_0_40px_rgba(139,92,246,0.3)] hover:shadow-[0_0_60px_rgba(139,92,246,0.5)] transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 group-hover:from-violet-500 group-hover:to-fuchsia-500 transition-all duration-300" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/10 transition-opacity duration-300" />
            <span className="relative">{t('ctaPrimary')}</span>
            <ArrowIcon className={`w-5 h-5 relative transition-transform duration-300 ${locale === 'ar' ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
          </Link>
          <a
            href="#tools"
            className="group flex items-center gap-2 px-8 py-4 rounded-2xl text-white/80 font-semibold text-lg border border-white/20 hover:border-white/40 hover:bg-white/10 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all duration-300 backdrop-blur-md"
          >
            <PlayCircle className="w-5 h-5 text-violet-400 group-hover:scale-110 transition-transform" />
            {t('ctaSecondary')}
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.7 }}
          className="mt-20 grid grid-cols-3 gap-6 max-w-2xl mx-auto"
        >
          {[
            { value: locale === 'ar' ? "+٥٠ك" : "50k+", label: t('stats.users.label') },
            { value: locale === 'ar' ? "٩٩.٩٪" : "99.9%", label: t('stats.uptime.label') },
            { value: locale === 'ar' ? "+١٢" : "12+", label: t('stats.tools.label') },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-white/50">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <span className="text-white/30 text-xs">{t('scrollDown')}</span>
        <motion.div
          className="w-px h-10 bg-gradient-to-b from-violet-500 to-transparent"
          animate={{ scaleY: [0, 1], opacity: [1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </motion.div>
    </section>
  );
}

