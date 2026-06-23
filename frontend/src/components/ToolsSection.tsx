"use client";
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  Mic,
  Volume2,
  Scissors,
  PenTool,
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import { AnimatedText, AnimatedReveal } from "./AnimatedText";
import { useTranslations, useLocale } from "next-intl";
import { Link, useRouter } from "../i18n/routing";

type Tool = {
  icon: any;
  title: string;
  desc: string;
  badge: string;
  badgeColor: string;
  gradient: string;
  iconBg: string;
  glowColor: string;
  tags: string[];
  image: string;
  href?: string;
};

function ToolCard({ tool, index }: { tool: Tool; index: number }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const t = useTranslations("Tools");
  const locale = useLocale();
  const router = useRouter();
  const Icon = tool.icon;
  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight;

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 40 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 40 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const bgX = useTransform(mouseXSpring, [-0.5, 0.5], [0, 100]);
  const bgY = useTransform(mouseYSpring, [-0.5, 0.5], [0, 100]);
  const background = useMotionTemplate`radial-gradient(circle at ${bgX}% ${bgY}%, rgba(255,255,255,0.15) 0%, transparent 60%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.02 }}
      onClick={() => tool.href && router.push(tool.href)}
      className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden cursor-pointer shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
    >
      <motion.div
        className="absolute inset-0 z-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background }}
      />

      {/* Hover gradient overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />

      {/* Top border glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:via-white/40 transition-all duration-500" />

      {/* Glow effect */}
      <div
        className={`absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-2xl ${tool.glowColor}`}
      />

      {/* Cover Image Container */}
      <div className="relative h-48 w-full overflow-hidden shrink-0 z-0 border-b border-white/10 bg-[#0a0015]/50">
        <img
          src={tool.image}
          alt={tool.title}
          className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-110 group-hover:opacity-100"
        />
        {/* Subtle gradient fade to smoothly blend into the card body */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d011a] via-transparent to-transparent opacity-80" />
      </div>

      <div className="relative px-6 pb-6 z-10 -mt-6" style={{ transform: "translateZ(30px)" }}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="relative">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.iconBg} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300`}
            >
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div
              className={`absolute -inset-1 rounded-xl bg-gradient-to-br ${tool.iconBg} opacity-0 group-hover:opacity-40 blur-md transition-all duration-300 animate-pulse`}
            />
          </div>
          {tool.badge && (
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${tool.badgeColor}`}
            >
              {tool.badge}
            </span>
          )}
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-violet-200 transition-colors duration-300">
          {tool.title}
        </h3>
        <p className="text-white/50 text-sm leading-relaxed mb-4 group-hover:text-white/70 transition-colors duration-300">
          {tool.desc}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-5">
          {tool.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2.5 py-1 rounded-lg bg-white/10 text-white/50 border border-white/10 group-hover:border-white/20 group-hover:text-white/80 group-hover:bg-white/20 transition-all duration-300"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-1.5 text-violet-400 text-sm font-medium group-hover:gap-3 transition-all duration-300 relative inline-flex">
          <span>{t('useTool')}</span>
          <ArrowIcon className={`w-4 h-4 transition-transform duration-300 ${locale === 'ar' ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
          <div className="absolute -bottom-1 left-0 right-0 h-px bg-violet-400/0 group-hover:bg-violet-400/50 transition-colors duration-300" />
        </div>
      </div>
    </motion.div>
  );
}

export default function ToolsSection() {
  const t = useTranslations("Tools");
  const locale = useLocale();

  const tools: Tool[] = [
    {
      icon: Mic,
      title: t('list.t1.title'),
      desc: t('list.t1.desc'),
      badge: t('list.t1.badge'),
      badgeColor: "bg-violet-500/20 text-violet-300 border-violet-500/30",
      gradient: "from-violet-600/20 to-purple-600/10",
      iconBg: "from-violet-500 to-purple-600",
      glowColor: "shadow-violet-500/20",
      tags: t.raw('list.t1.tags'),
      image: "/images/tool-1.png",
      href: "/tools/voice-to-text"
    },
    {
      icon: Volume2,
      title: t('list.t2.title'),
      desc: t('list.t2.desc'),
      badge: t('list.t2.badge'),
      badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      gradient: "from-emerald-600/20 to-teal-600/10",
      iconBg: "from-emerald-500 to-teal-600",
      glowColor: "shadow-emerald-500/20",
      tags: t.raw('list.t2.tags'),
      image: "/images/tool-2.png",
      href: "/tools/text-to-voice"
    }
  ];

  return (
    <section id="tools" className="relative py-24 bg-[#0a0015]" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
        <div className="absolute w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.08)_0%,transparent_60%)]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <AnimatedReveal>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium mb-4">
              <Scissors className="w-3.5 h-3.5" />
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
            <p className="text-white/50 text-lg max-w-2xl mx-auto leading-relaxed">
              {t('subtitle')}
            </p>
          </AnimatedReveal>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map((tool, index) => (
            <ToolCard key={tool.title} tool={tool} index={index} />
          ))}
        </div>

        {/* Bottom CTA */}
        <AnimatedReveal delay={0.3} className="text-center mt-12">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-lg transition-all duration-300 shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50"
          >
            <PenTool className="w-5 h-5" />
            {t('startUsing')}
          </Link>
        </AnimatedReveal>
      </div>
    </section>
  );
}

