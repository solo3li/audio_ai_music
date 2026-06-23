"use client";
import { motion } from "framer-motion";
import {
  Zap,
  Shield,
  Globe,
  Cpu,
  Clock,
  BarChart3,
  Lock,
  RefreshCw,
} from "lucide-react";
import { AnimatedText, AnimatedReveal } from "./AnimatedText";
import { useInView } from "react-intersection-observer";
import { useTranslations, useLocale } from "next-intl";

type Feature = {
  icon: any;
  title: string;
  desc: string;
  color: string;
  bg: string;
  border: string;
};

function FeatureCard({
  feature,
  index,
}: {
  feature: Feature;
  index: number;
}) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const Icon = feature.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className={`group p-5 rounded-2xl border ${feature.border} bg-white/5 backdrop-blur-md hover:bg-white/10 hover:shadow-[0_8px_30px_rgba(139,92,246,0.15)] hover:border-purple-500/30 transition-all duration-300`}
    >
      <div
        className={`w-10 h-10 rounded-xl ${feature.bg} border ${feature.border} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon className={`w-5 h-5 ${feature.color}`} />
      </div>
      <h3 className="text-white font-bold mb-2 text-base">{feature.title}</h3>
      <p className="text-white/50 text-sm leading-relaxed">{feature.desc}</p>
    </motion.div>
  );
}

export default function FeaturesSection() {
  const t = useTranslations("Features");
  const locale = useLocale();

  const features: Feature[] = [
    {
      icon: Zap,
      title: t('list.f1.title'),
      desc: t('list.f1.desc'),
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
    },
    {
      icon: Shield,
      title: t('list.f2.title'),
      desc: t('list.f2.desc'),
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      icon: Globe,
      title: t('list.f3.title'),
      desc: t('list.f3.desc'),
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      icon: Cpu,
      title: t('list.f4.title'),
      desc: t('list.f4.desc'),
      color: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
    },
    {
      icon: Clock,
      title: t('list.f5.title'),
      desc: t('list.f5.desc'),
      color: "text-pink-400",
      bg: "bg-pink-500/10",
      border: "border-pink-500/20",
    },
    {
      icon: BarChart3,
      title: t('list.f6.title'),
      desc: t('list.f6.desc'),
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/20",
    },
    {
      icon: Lock,
      title: t('list.f7.title'),
      desc: t('list.f7.desc'),
      color: "text-fuchsia-400",
      bg: "bg-fuchsia-500/10",
      border: "border-fuchsia-500/20",
    },
    {
      icon: RefreshCw,
      title: t('list.f8.title'),
      desc: t('list.f8.desc'),
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
    },
  ];

  const stats = [
    { val: t('stats.s1.val'), label: t('stats.s1.label') },
    { val: t('stats.s2.val'), label: t('stats.s2.label') },
    { val: t('stats.s3.val'), label: t('stats.s3.label') },
    { val: t('stats.s4.val'), label: t('stats.s4.label') },
  ];

  return (
    <section id="features" className="relative py-24 bg-[#080012]" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
        <div className="absolute w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,rgba(139,92,246,0.07)_0%,transparent_60%)]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <AnimatedReveal>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-sm font-medium mb-4">
              <Zap className="w-3.5 h-3.5" />
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
            <p className="text-white/50 text-lg max-w-xl mx-auto">
              {t('subtitle')}
            </p>
          </AnimatedReveal>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>

        {/* Big stat banner */}
        <AnimatedReveal delay={0.3} className="mt-16">
          <div className="relative rounded-3xl border border-white/10 bg-gradient-to-r from-violet-900/30 via-purple-900/20 to-fuchsia-900/30 p-8 sm:p-12 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.15)_0%,transparent_70%)]" />
            <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-8">
              {stats.map((s, i) => (
                <div key={i}>
                  <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-1">
                    {s.val}
                  </div>
                  <div className="text-white/50 text-sm">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </AnimatedReveal>
      </div>
    </section>
  );
}

