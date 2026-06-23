"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Crown, Rocket, ArrowLeft, ArrowRight } from "lucide-react";
import { AnimatedText, AnimatedReveal } from "./AnimatedText";
import { useTranslations, useLocale } from "next-intl";

export default function PricingSection() {
  const [yearly, setYearly] = useState(false);
  const t = useTranslations("Pricing");
  const locale = useLocale();

  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight;

  const plans = [
    {
      name: t('freePlan.name'),
      icon: Zap,
      price: { monthly: t('freePlan.price.monthly'), yearly: t('freePlan.price.yearly') },
      currency: t('freePlan.currency'),
      period: t('freePlan.period'),
      desc: t('freePlan.desc'),
      gradient: "from-slate-700 to-slate-800",
      borderColor: "border-white/10",
      buttonStyle:
        "bg-white/10 hover:bg-white/20 text-white border border-white/20",
      features: t.raw('freePlan.features'),
      notIncluded: t.raw('freePlan.notIncluded'),
      button: t('freePlan.button')
    },
    {
      name: t('proPlan.name'),
      icon: Rocket,
      price: { monthly: t('proPlan.price.monthly'), yearly: t('proPlan.price.yearly') },
      currency: t('proPlan.currency'),
      period: t('proPlan.period'),
      desc: t('proPlan.desc'),
      gradient: "from-violet-600 to-fuchsia-600",
      borderColor: "border-violet-500/50",
      buttonStyle:
        "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-2xl shadow-violet-500/30",
      popular: t('proPlan.popular') || null,
      features: t.raw('proPlan.features'),
      notIncluded: t.raw('proPlan.notIncluded'),
      button: t('proPlan.button')
    },
    {
      name: t('enterprisePlan.name'),
      icon: Crown,
      price: { monthly: t('enterprisePlan.price.monthly'), yearly: t('enterprisePlan.price.yearly') },
      currency: t('enterprisePlan.currency'),
      period: t('enterprisePlan.period'),
      desc: t('enterprisePlan.desc'),
      gradient: "from-amber-500 to-orange-600",
      borderColor: "border-amber-500/30",
      buttonStyle:
        "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-2xl shadow-amber-500/30",
      features: t.raw('enterprisePlan.features'),
      notIncluded: t.raw('enterprisePlan.notIncluded'),
      button: t('enterprisePlan.button')
    },
  ];

  return (
    <section id="pricing-home" className="relative py-24 bg-[#0a0015]" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* BG */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
        <div className="absolute w-full h-full bg-[radial-gradient(ellipse_at_top,rgba(139,92,246,0.08)_0%,transparent_60%)]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <AnimatedReveal>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium mb-4">
              <Crown className="w-3.5 h-3.5" />
              {t('badge')}
            </span>
          </AnimatedReveal>

          <AnimatedText
            text={t('title')}
            as="h2"
            delay={0.1}
            className="text-3xl sm:text-5xl font-extrabold text-white mb-4"
          />

          <AnimatedReveal delay={0.2}>
            <p className="text-white/50 text-lg mb-8">
              {t('subtitle')}
            </p>
          </AnimatedReveal>

          {/* Toggle */}
          <AnimatedReveal delay={0.3}>
            <div className="inline-flex items-center gap-3 p-1 rounded-xl bg-white/5 border border-white/10">
              <button
                onClick={() => setYearly(false)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                  !yearly
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {t('monthly')}
              </button>
              <button
                onClick={() => setYearly(true)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                  yearly
                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30"
                    : "text-white/50 hover:text-white"
                }`}
              >
                {t('yearly')}
                <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  {t('save')}
                </span>
              </button>
            </div>
          </AnimatedReveal>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            return (
              <AnimatedReveal key={plan.name} delay={0.1 * i}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.01 }}
                  transition={{ duration: 0.3 }}
                  className={`relative h-full rounded-3xl border ${plan.borderColor} bg-white/5 backdrop-blur-md hover:bg-white/10 hover:shadow-[0_8px_30px_rgba(139,92,246,0.15)] hover:border-violet-500/50 transition-all duration-300 overflow-hidden flex flex-col`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                  )}

                  {plan.popular && (
                    <div className="absolute -top-px left-1/2 -translate-x-1/2">
                      <div className="px-4 py-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-b-xl text-white text-xs font-bold whitespace-nowrap">
                        {plan.popular}
                      </div>
                    </div>
                  )}

                  <div className="p-7 flex-1 flex flex-col">
                    {/* Plan header */}
                    <div className="flex items-center gap-3 mb-6">
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center shadow-lg`}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-bold text-lg">
                          {plan.name}
                        </div>
                        <div className="text-white/40 text-xs">{plan.desc}</div>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-white">
                          {yearly ? plan.price.yearly : plan.price.monthly}
                        </span>
                        <span className="text-white/50 text-sm">
                          {plan.currency} {plan.period}
                        </span>
                      </div>
                      {yearly && plan.price.monthly !== "0" && plan.price.monthly !== "٠" && (
                        <div className="text-white/30 text-xs mt-1 line-through">
                          {plan.price.monthly} {plan.currency} {t('monthly').toLowerCase() === 'monthly' ? '/ month' : '/ شهر'}
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    <div className="flex-1 space-y-3 mb-6">
                      {plan.features.map((f: string) => (
                        <div key={f} className="flex items-center gap-2.5">
                          <div className="w-4 h-4 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-violet-400" />
                          </div>
                          <span className="text-white/70 text-sm">{f}</span>
                        </div>
                      ))}
                      {plan.notIncluded.map((f: string) => (
                        <div key={f} className="flex items-center gap-2.5">
                          <div className="w-4 h-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                            <div className="w-1.5 h-px bg-white/20" />
                          </div>
                          <span className="text-white/25 text-sm line-through">
                            {f}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Button */}
                    <button
                      className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${plan.buttonStyle}`}
                    >
                      {plan.button}
                      <ArrowIcon className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              </AnimatedReveal>
            );
          })}
        </div>

        {/* Bottom note */}
        <AnimatedReveal delay={0.4} className="text-center mt-10">
          <p className="text-white/30 text-sm">
            {t('note')}
          </p>
        </AnimatedReveal>
      </div>
    </section>
  );
}

