"use client";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { AnimatedText, AnimatedReveal } from "./AnimatedText";
import { useInView } from "react-intersection-observer";
import { useTranslations, useLocale } from "next-intl";

type Testimonial = {
  name: string;
  role: string;
  avatar: string;
  avatarBg: string;
  text: string;
  stars: number;
};

function TestimonialCard({
  t,
  index,
}: {
  t: Testimonial;
  index: number;
}) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 flex flex-col gap-4 group hover:border-violet-500/30 transition-all duration-300"
    >
      {/* Top glow on hover */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Quote icon */}
      <Quote className="w-6 h-6 text-violet-400/50 group-hover:text-violet-400 transition-colors duration-300" />

      {/* Stars */}
      <div className="flex gap-1">
        {Array.from({ length: t.stars }).map((_, i) => (
          <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
        ))}
      </div>

      {/* Text */}
      <p className="text-white/60 text-sm leading-relaxed flex-1 group-hover:text-white/80 transition-colors duration-300">
        "{t.text}"
      </p>

      {/* Author */}
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.avatarBg} flex items-center justify-center text-white font-bold text-base shadow-lg`}
        >
          {t.avatar}
        </div>
        <div>
          <div className="text-white font-semibold text-sm">{t.name}</div>
          <div className="text-white/40 text-xs">
            {t.role}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function TestimonialsSection() {
  const t = useTranslations("Testimonials");
  const locale = useLocale();

  const testimonials: Testimonial[] = [
    {
      name: t('reviews.r1.author'),
      role: t('reviews.r1.role'),
      avatar: t('reviews.r1.author').charAt(0),
      avatarBg: "from-fuchsia-500 to-pink-600",
      text: t('reviews.r1.text'),
      stars: 5,
    },
    {
      name: t('reviews.r2.author'),
      role: t('reviews.r2.role'),
      avatar: t('reviews.r2.author').charAt(0),
      avatarBg: "from-blue-500 to-cyan-600",
      text: t('reviews.r2.text'),
      stars: 5,
    },
    {
      name: t('reviews.r3.author'),
      role: t('reviews.r3.role'),
      avatar: t('reviews.r3.author').charAt(0),
      avatarBg: "from-emerald-500 to-teal-600",
      text: t('reviews.r3.text'),
      stars: 5,
    },
  ];

  return (
    <section
      id="testimonials"
      className="relative py-24 bg-[#080012]"
      dir={locale === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
        <div className="absolute w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.06)_0%,transparent_60%)]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <AnimatedReveal>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium mb-4">
              <Star className="w-3.5 h-3.5 fill-current" />
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
            <p className="text-white/50 text-lg">
              {t('subtitle')}
            </p>
          </AnimatedReveal>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((testimonial, i) => (
            <TestimonialCard key={testimonial.name} t={testimonial} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

