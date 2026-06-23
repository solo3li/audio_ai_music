"use client";
import { motion } from "framer-motion";
import { Upload, Cpu, Download } from "lucide-react";
import { AnimatedText, AnimatedReveal } from "./AnimatedText";
import { useInView } from "react-intersection-observer";
import { useTranslations, useLocale } from "next-intl";

export default function HowItWorks() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const t = useTranslations("HowItWorks");
  const locale = useLocale();

  const steps = [
    {
      icon: Upload,
      step: t('steps.s1.step'),
      title: t('steps.s1.title'),
      desc: t('steps.s1.desc'),
      gradient: "from-violet-500 to-purple-600",
    },
    {
      icon: Cpu,
      step: t('steps.s2.step'),
      title: t('steps.s2.title'),
      desc: t('steps.s2.desc'),
      gradient: "from-fuchsia-500 to-pink-600",
    },
    {
      icon: Download,
      step: t('steps.s3.step'),
      title: t('steps.s3.title'),
      desc: t('steps.s3.desc'),
      gradient: "from-cyan-500 to-blue-600",
    },
  ];

  return (
    <section className="relative py-24 bg-[#0a0015]" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <AnimatedReveal>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium mb-4">
              <Cpu className="w-3.5 h-3.5" />
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
            <p className="text-white/50 text-lg">{t('subtitle')}</p>
          </AnimatedReveal>
        </div>

        <div ref={ref} className="relative">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-12 right-[16.666%] left-[16.666%] h-px">
            <div className="h-px bg-gradient-to-r from-violet-500/30 via-fuchsia-500/30 to-cyan-500/30" />
            <motion.div
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{ duration: 1.5, delay: 0.5 }}
              className={`absolute inset-0 origin-${locale === 'ar' ? 'right' : 'left'} bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500`}
              style={{ height: "2px", top: "-1px" }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 50 }}
                  animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                  transition={{ duration: 0.6, delay: i * 0.2 }}
                  className="relative group text-center"
                >
                  {/* Step icon */}
                  <div className="relative inline-flex mb-6">
                    <div
                      className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${step.gradient} flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-300`}
                    >
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    {/* Step number */}
                    <div className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-[#0a0015] border border-white/20 flex items-center justify-center">
                      <span className="text-white/60 text-xs font-bold">{step.step}</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-white/50 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

