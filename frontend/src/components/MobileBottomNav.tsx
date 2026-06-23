"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Home, Wrench, DollarSign, Star, User } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "../i18n/routing";

export default function MobileBottomNav() {
  const [active, setActive] = useState(0);
  const t = useTranslations("Navbar");
  const locale = useLocale();

  const tabs = [
    { icon: Home, label: t('home'), href: "/" },
    { icon: Wrench, label: t('tools'), href: "/#tools" },
    { icon: DollarSign, label: t('pricing'), href: "/pricing" },
    { icon: Star, label: t('reviews'), href: "/#testimonials" },
    { icon: User, label: t('account'), href: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Blur background */}
      <div className="absolute inset-0 bg-[#0d0020]/95 backdrop-blur-2xl border-t border-white/10 shadow-2xl shadow-black/50" />

      {/* Safe area padding for notch phones */}
      <div className="relative flex items-center justify-around px-2 pt-2 pb-safe pb-3">
        {tabs.map((tab, i) => {
          const Icon = tab.icon;
          const isActive = active === i;

          return (
            <Link
              key={tab.label}
              href={tab.href as any}
              onClick={() => setActive(i)}
              className="relative flex flex-col items-center gap-1 px-3 py-1 group"
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              {/* Icon background on active */}
              <div className={`relative p-2 rounded-xl transition-all duration-300 ${
                isActive
                  ? "bg-violet-600/20"
                  : "bg-transparent group-hover:bg-white/5"
              }`}>
                {isActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 rounded-xl bg-violet-500/10 blur-sm"
                  />
                )}
                <Icon
                  className={`w-5 h-5 relative transition-all duration-300 ${
                    isActive
                      ? "text-violet-400"
                      : "text-white/40 group-hover:text-white/70"
                  }`}
                />
              </div>

              <span
                className={`text-[10px] font-medium transition-all duration-300 ${
                  isActive
                    ? "text-violet-400"
                    : "text-white/30 group-hover:text-white/60"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
