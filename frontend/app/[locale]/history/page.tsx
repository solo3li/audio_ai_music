"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Navbar from "../../../src/components/Navbar";
import Footer from "../../../src/components/Footer";
import MobileBottomNav from "../../../src/components/MobileBottomNav";
import {
  History, Mic, Volume2, FileText,
  Image, Loader2, Trash2, ChevronRight,
  Clock, Zap, AlertCircle
} from "lucide-react";
import api from "../../../src/utils/api";
import { useAppStore } from "../../../src/store/useAppStore";

interface GenerationRecord {
  id: string;
  type: string;
  title: string;
  date: string;
  createdAt: string;
  duration: string;
  status: string;
  lang: string;
  voice: string;
  fileUrl: string;
  creditsUsed: number;
}

const TOOL_ICONS: Record<string, any> = {
  "text-to-voice": Volume2,
  "voice-to-text": Mic,
  "gpt": FileText,
  "bg-remover": Image,
};

const TOOL_COLORS: Record<string, string> = {
  "text-to-voice": "from-violet-500/20 to-fuchsia-500/20 border-violet-500/30 text-violet-400",
  "voice-to-text": "from-fuchsia-500/20 to-pink-500/20 border-fuchsia-500/30 text-fuchsia-400",
  "gpt": "from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400",
  "bg-remover": "from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400",
};

const TOOL_LABELS: Record<string, string> = {
  "text-to-voice": "نص إلى صوت",
  "voice-to-text": "صوت إلى نص",
  "gpt": "GPT",
  "bg-remover": "إزالة خلفية",
};

export default function HistoryPage() {
  const t = useTranslations("Profile");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const router = useRouter();

  const [history, setHistory] = useState<GenerationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/api/history");
        setHistory(res.data);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const deleteRecord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(isRtl ? "هل أنت متأكد من الحذف؟" : "Are you sure you want to delete?")) return;
    
    setDeletingId(id);
    try {
      await api.delete(`/api/history/${id}`);
      setHistory(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error("Failed to delete record:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const goToDetail = (id: string) => {
    router.push(`/${locale}/history/${id}`);
  };

  const filters = ["all", ...Array.from(new Set(history.map(h => h.type)))];
  const filtered = activeFilter === "all" ? history : history.filter(h => h.type === activeFilter);

  return (
    <div className="min-h-screen bg-[#0A0A0A] selection:bg-violet-500/30">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 h-full flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8" dir={isRtl ? "rtl" : "ltr"}>
            <div className="w-14 h-14 rounded-2xl bg-fuchsia-500/20 flex items-center justify-center border border-fuchsia-500/30">
              <History className="w-7 h-7 text-fuchsia-400" />
            </div>
            <div className="flex-1">
                <h1 className="text-3xl font-bold text-white mb-1">
                {isRtl ? "سجل العمليات" : "Generation History"}
                </h1>
                <p className="text-white/50 text-sm">
                    {isRtl ? "تتبع جميع عمليات التوليد واستهلاك الرصيد" : "Track all your generations and credit usage"}
                </p>
            </div>
            <span className="text-sm text-white/40 bg-white/5 px-4 py-2 rounded-full border border-white/10 hidden sm:block">
              {filtered.length} {isRtl ? "عملية" : "records"}
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 mb-8 flex-wrap" dir={isRtl ? "rtl" : "ltr"}>
            {filters.map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  activeFilter === f
                    ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25"
                    : "bg-white/5 text-white/50 hover:text-white border border-white/10 hover:border-white/20 hover:bg-white/10"
                }`}
              >
                {f === "all" ? (isRtl ? "الكل" : "All") : (TOOL_LABELS[f] || f)}
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <div className="flex flex-col items-center gap-4 text-white/40">
                <Loader2 className="w-10 h-10 animate-spin text-violet-400" />
                <p className="text-lg">{isRtl ? "جاري التحميل..." : "Loading..."}</p>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-20">
              <div className="text-center text-white/30">
                <AlertCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">{isRtl ? "لا توجد عمليات بعد" : "No operations yet"}</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 space-y-4">
              <AnimatePresence>
                {filtered.map((record, i) => {
                  const Icon = TOOL_ICONS[record.type] || Zap;
                  const colorClass = TOOL_COLORS[record.type] || "from-white/10 to-white/5 border-white/10 text-white/50";

                  return (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: Math.min(i * 0.04, 0.4) }}
                      onClick={() => goToDetail(record.id)}
                      className="group flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-5 sm:p-6 bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-violet-500/30 rounded-3xl cursor-pointer transition-all"
                      dir={isRtl ? "rtl" : "ltr"}
                    >
                      {/* Icon */}
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorClass} flex items-center justify-center border shrink-0`}>
                        <Icon className="w-6 h-6" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-lg truncate" title={record.title}>
                          {record.title.split('/').pop()}
                        </p>
                        <div className="flex items-center gap-4 mt-2 flex-wrap">
                          <span className="text-xs text-white/50 flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg">
                            <Clock className="w-3.5 h-3.5" />
                            {record.date}
                          </span>
                          {record.lang && record.lang !== "-" && (
                            <span className="text-xs text-white/50 bg-white/5 px-2.5 py-1 rounded-lg">
                                {record.lang}
                            </span>
                          )}
                          {record.creditsUsed > 0 && (
                            <span className="text-xs font-bold text-fuchsia-400 bg-fuchsia-500/10 border border-fuchsia-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5" />
                              {record.creditsUsed} {isRtl ? "كريدت" : "Credits"}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status + Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-0 border-white/5">
                        <span className={`text-xs font-bold px-4 py-1.5 rounded-full ${
                          record.status === "completed"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                            : record.status === "failed"
                            ? "bg-red-500/15 text-red-400 border border-red-500/20"
                            : "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20"
                        }`}>
                          {record.status === "completed" ? (isRtl ? "مكتمل" : "Done") :
                           record.status === "failed" ? (isRtl ? "فشل" : "Failed") :
                           (isRtl ? "جاري" : "Processing")}
                        </span>
                        
                        <div className="flex items-center gap-2">
                            <button
                                onClick={(e) => deleteRecord(record.id, e)}
                                disabled={deletingId === record.id}
                                className="p-2.5 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                            >
                                {deletingId === record.id
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <Trash2 className="w-4 h-4" />
                                }
                            </button>
                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                                <ChevronRight className={`w-5 h-5 text-white/30 group-hover:text-violet-400 transition-colors ${isRtl ? "rotate-180" : ""}`} />
                            </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </main>

      <Footer />
      <MobileBottomNav />
      <div className="h-16 md:hidden" />
    </div>
  );
}
