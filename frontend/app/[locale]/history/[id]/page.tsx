"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../../src/components/Navbar";
import Footer from "../../../../src/components/Footer";
import MobileBottomNav from "../../../../src/components/MobileBottomNav";
import {
  ArrowLeft, ArrowRight, Clock, Calendar, Zap, Play, FileText,
  Volume2, Mic, CheckCircle, XCircle, AlertCircle
} from "lucide-react";
import api from "../../../../src/utils/api";

interface RecordDetail {
  id: string;
  type: string;
  title: string;
  createdAt: string;
  date: string;
  duration: string;
  status: string;
  lang: string;
  voice: string;
  fileUrl: string;
  resultText: string;
  inputText: string;
  creditsUsed: number;
}

export default function HistoryDetailPage() {
  const params = useParams();
  const locale = params.locale as string;
  const id = params.id as string;
  const isRtl = locale === "ar";
  const router = useRouter();

  const [record, setRecord] = useState<RecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/api/history/${id}`);
        setRecord(res.data);
      } catch (err) {
        console.error("Failed to fetch detail:", err);
        setError(isRtl ? "فشل في تحميل تفاصيل العملية" : "Failed to load record details");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, isRtl]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-20 text-white/50">
          <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    if (error || !record) {
      return (
        <div className="text-center py-20 text-red-400">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{error || "Not found"}</p>
        </div>
      );
    }

    return (
      <div className="space-y-8" dir={isRtl ? "rtl" : "ltr"}>
        {/* Header Summary */}
        <div className="bg-white/5 rounded-3xl p-6 md:p-8 border border-white/10 flex flex-wrap gap-6 items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              {record.type === "voice-to-text" && <Mic className="w-6 h-6 text-fuchsia-400" />}
              {record.type === "text-to-voice" && <Volume2 className="w-6 h-6 text-violet-400" />}
              {record.type === "gpt" && <FileText className="w-6 h-6 text-emerald-400" />}
              {record.title}
            </h2>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-white/50">
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {record.date}</span>
              {record.duration && <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {record.duration}</span>}
              {record.creditsUsed > 0 && (
                <span className="flex items-center gap-1 font-bold text-fuchsia-400 bg-fuchsia-500/10 px-2 py-1 rounded-lg">
                  <Zap className="w-4 h-4" /> {record.creditsUsed} {isRtl ? "كريدت" : "Credits"}
                </span>
              )}
            </div>
          </div>
          <div className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 ${
            record.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
            record.status === "failed" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
            "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
          }`}>
            {record.status === "completed" && <CheckCircle className="w-4 h-4" />}
            {record.status === "failed" && <XCircle className="w-4 h-4" />}
            {isRtl 
              ? (record.status === "completed" ? "مكتمل" : record.status === "failed" ? "فشل" : "قيد المعالجة")
              : (record.status === "completed" ? "Completed" : record.status === "failed" ? "Failed" : "Processing")}
          </div>
        </div>

        {/* Input Text (If Text-to-Voice or GPT) */}
        {record.inputText && (
          <div className="bg-white/5 rounded-3xl p-6 md:p-8 border border-white/10">
            <h3 className="text-white/50 font-medium mb-4 text-sm">
              {isRtl ? "النص المدخل" : "Input Text"}
            </h3>
            <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">{record.inputText}</p>
          </div>
        )}

        {/* Result Text (If Voice-to-Text or GPT) */}
        {record.resultText && (
          <div className="bg-white/5 rounded-3xl p-6 md:p-8 border border-white/10">
            <h3 className="text-emerald-400/80 font-medium mb-4 text-sm">
              {isRtl ? "النتيجة" : "Result"}
            </h3>
            <div className="bg-black/20 rounded-xl p-4 md:p-6 border border-white/5">
              <p className="text-white leading-relaxed whitespace-pre-wrap">{record.resultText}</p>
            </div>
          </div>
        )}

        {/* Audio Player (If Audio File URL exists) */}
        {record.fileUrl && (
          <div className="bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 rounded-3xl p-6 md:p-8 border border-fuchsia-500/20">
            <h3 className="text-fuchsia-300 font-medium mb-4 text-sm flex items-center gap-2">
              <Play className="w-4 h-4" />
              {isRtl ? "الملف الصوتي" : "Audio File"}
            </h3>
            <audio controls className="w-full mt-2" src={record.fileUrl}>
              Your browser does not support the audio element.
            </audio>
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] selection:bg-violet-500/30">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="h-full flex flex-col"
        >
          {/* Back Button */}
          <button 
            onClick={() => router.push(`/${locale}/history`)}
            className="group flex items-center gap-2 text-white/50 hover:text-white transition-colors w-fit mb-8"
          >
            {isRtl ? <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /> : <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />}
            <span>{isRtl ? "العودة للسجل" : "Back to History"}</span>
          </button>

          {renderContent()}

        </motion.div>
      </main>

      <Footer />
      <MobileBottomNav />
      <div className="h-16 md:hidden" />
    </div>
  );
}
