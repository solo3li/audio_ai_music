"use client";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { AnimatedText, AnimatedReveal, GlowPulse } from "./AnimatedText";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "../i18n/routing";

export default function CTASection() {
  const t = useTranslations("CTA");
  const locale = useLocale();
  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight;
  const features = t.raw('features');

  return (
    <section className="relative py-28 bg-[#0a0015] overflow-hidden" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background glows */}
      <GlowPulse className="w-96 h-96 bg-violet-600/20 blur-3xl top-1/2 -translate-y-1/2 right-1/4" />
      <GlowPulse className="w-72 h-72 bg-fuchsia-600/15 blur-3xl top-1/2 -translate-y-1/2 left-1/4" />

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(139,92,246,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative max-w-4xl mx-auto px-4 text-center">
        <AnimatedReveal>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            {t('title')}
          </span>
        </AnimatedReveal>

        <AnimatedText
          text={t('title')}
          as="h2"
          delay={0.1}
          className="text-4xl sm:text-6xl font-extrabold text-white mb-4"
        />

        <AnimatedText
          text={t('subtitle')}
          as="p"
          delay={0.3}
          className="text-white/50 text-lg mb-10 max-w-2xl mx-auto"
        />

        <AnimatedReveal delay={0.4}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/pricing" className="group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="relative flex items-center gap-2 px-10 py-4 rounded-2xl text-white font-bold text-xl overflow-hidden shadow-2xl shadow-violet-500/40"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 bg-size-200 group-hover:bg-pos-100 transition-all duration-500" />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/10 transition-opacity duration-300" />
                <Sparkles className="w-5 h-5 relative" />
                <span className="relative">{t('button')}</span>
                <ArrowIcon className={`w-5 h-5 relative transition-transform duration-300 ${locale === 'ar' ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
              </motion.div>
            </Link>
          </div>
        </AnimatedReveal>

        {/* Trust badges */}
        <AnimatedReveal delay={0.5} className="mt-12">
          <div className="flex flex-wrap items-center justify-center gap-6 text-white/30 text-sm">
            {features.map((feature: string, i: number) => {
              const colors = ['emerald', 'blue', 'violet', 'fuchsia'];
              const color = colors[i % colors.length];
              return (
                <span key={i} className="flex items-center gap-1.5">
                  <div className={`w-4 h-4 rounded-full border border-${color}-500/50 flex items-center justify-center`}>
                    <div className={`w-2 h-2 rounded-full bg-${color}-500/60`} />
                  </div>
                  {feature}
                </span>
              )
            })}
          </div>
        </AnimatedReveal>
      </div>
    </section>
  );
}

