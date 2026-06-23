"use client";
import { motion } from "framer-motion";
import { Mic, Volume2, Image, Languages, Wand2, Music, ScanText, MessageSquare, Video } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

export default function MarqueeBanner() {
  const t = useTranslations("MarqueeBanner");
  const locale = useLocale();
  const itemsText = t.raw("items");

  const items = [
    { icon: Mic, text: itemsText[0] },
    { icon: Volume2, text: itemsText[1] },
    { icon: Image, text: itemsText[2] },
    { icon: Languages, text: itemsText[3] },
    { icon: Wand2, text: itemsText[4] },
    { icon: Music, text: itemsText[5] },
    { icon: ScanText, text: itemsText[6] },
    { icon: MessageSquare, text: itemsText[7] },
    { icon: Video, text: itemsText[8] },
  ];

  const doubled = [...items, ...items];

  return (
    <div className="relative bg-[#080012] py-5 overflow-hidden border-y border-white/5" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      {/* Left fade */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#080012] to-transparent z-10 pointer-events-none" />
      {/* Right fade */}
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#080012] to-transparent z-10 pointer-events-none" />

      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: locale === 'ar' ? ["0%", "50%"] : ["0%", "-50%"] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-white/8 bg-white/4 flex-shrink-0"
            >
              <Icon className="w-4 h-4 text-violet-400 flex-shrink-0" />
              <span className="text-white/60 text-sm font-medium">{item.text}</span>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}

