"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import Navbar from "../../../../../src/components/Navbar";
import Footer from "../../../../../src/components/Footer";
import {
  ArrowLeft, ArrowRight, Volume2, Mic, FileText, Image as ImageIcon,
  Clock, Globe, User, Zap, Loader2, Download, Copy, Play, Pause,
  XCircle, CheckCircle2, AlertTriangle, FileAudio, AlignLeft
} from "lucide-react";
import api from "../../../../../src/utils/api";

interface HistoryDetail {
  id: string;
  type: string;
  title: string;
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

/* ─── helpers ─── */
const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://178.62.192.74:8080";

function absoluteUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${BACKEND}${path}`;
}

function detectMediaType(url: string): "audio" | "video" | "image" | "none" {
  if (!url) return "none";
  const cleanUrl = url.split("?")[0];
  const ext = cleanUrl.split(".").pop()?.toLowerCase() ?? "";
  if (["mp3", "wav", "ogg", "webm", "m4a", "aac", "flac"].includes(ext)) return "audio";
  if (["mp4", "webm", "ogg", "mov", "avi"].includes(ext)) return "video";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(ext)) return "image";
  return "none";
}

const TOOL_META: Record<string, { icon: any; label_ar: string; label_en: string; gradient: string }> = {
  "text-to-voice": { icon: Volume2, label_ar: "نص إلى صوت",      label_en: "Text to Voice",        gradient: "from-violet-600 to-fuchsia-600" },
  "voice-to-text": { icon: Mic,     label_ar: "صوت إلى نص",      label_en: "Voice to Text",        gradient: "from-fuchsia-600 to-pink-600" },
  "gpt":           { icon: FileText, label_ar: "توليد نص GPT",    label_en: "GPT Text Generation",  gradient: "from-blue-600 to-cyan-500" },
  "bg-remover":    { icon: ImageIcon, label_ar: "إزالة خلفية",   label_en: "Background Remover",   gradient: "from-emerald-600 to-teal-500" },
  "img-to-txt":    { icon: AlignLeft, label_ar: "صورة إلى نص",  label_en: "Image to Text",         gradient: "from-orange-500 to-amber-500" },
};

/* ─── Custom Audio Player ─── */
function AudioPlayer({ src, isRtl }: { src: string; isRtl: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = ratio * duration;
    setCurrentTime(ratio * duration);
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  const download = () => {
    const a = document.createElement("a");
    a.href = src;
    a.download = "audio_output";
    a.click();
  };

  return (
    <div className="bg-[#0a0015]/60 border border-violet-500/20 rounded-2xl p-5" dir="ltr">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => setPlaying(false)}
      />
      <div className="flex items-center gap-4">
        {/* Play / Pause */}
        <button
          onClick={toggle}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center hover:shadow-[0_0_20px_rgba(139,92,246,0.5)] transition-all active:scale-95 shrink-0"
        >
          {playing
            ? <Pause className="w-5 h-5 text-white" />
            : <Play  className="w-5 h-5 text-white ml-0.5" />
          }
        </button>

        {/* Timeline */}
        <div className="flex-1">
          <div
            className="relative h-2 bg-white/10 rounded-full cursor-pointer group mb-2"
            onClick={seek}
          >
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
              style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1/2"
              style={{ left: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-white/40 font-mono">
            <span>{fmt(currentTime)}</span>
            <span>{duration ? fmt(duration) : "--:--"}</span>
          </div>
        </div>

        {/* Download */}
        <button
          onClick={download}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all shrink-0"
          title={isRtl ? "تحميل" : "Download"}
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function HistoryDetailPage() {
  const locale   = useLocale();
  const isRtl    = locale === "ar";
  const params   = useParams();
  const router   = useRouter();
  const id       = params?.id as string;

  const [record,   setRecord]   = useState<HistoryDetail | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied,   setCopied]   = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/api/history/${id}`)
      .then(r => setRecord(r.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const goBack = () => router.push(`/${locale}/profile`);
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  /* ── Loading ── */
  if (loading) return (
    <div className="min-h-screen bg-[#0a0015] flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
          <p className="text-white/40 text-sm">{isRtl ? "جاري التحميل..." : "Loading..."}</p>
        </div>
      </main>
      <Footer />
    </div>
  );

  /* ── Not Found ── */
  if (notFound || !record) return (
    <div className="min-h-screen bg-[#0a0015] flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center text-center px-4">
        <div>
          <XCircle className="w-16 h-16 text-red-400/50 mx-auto mb-4" />
          <p className="text-white/60 text-lg mb-4">{isRtl ? "العملية غير موجودة" : "Record not found"}</p>
          <button onClick={goBack} className="px-6 py-2 bg-violet-600/30 hover:bg-violet-600/50 text-violet-300 rounded-xl transition-all">
            {isRtl ? "العودة" : "Go Back"}
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );

  const meta       = TOOL_META[record.type] ?? { icon: Zap, label_ar: record.type, label_en: record.type, gradient: "from-violet-600 to-fuchsia-600" };
  const Icon       = meta.icon;
  const toolLabel  = isRtl ? meta.label_ar : meta.label_en;
  const mediaType  = detectMediaType(record.fileUrl);
  const mediaSrc   = absoluteUrl(record.fileUrl);

  return (
    <div className="relative min-h-screen bg-[#0a0015] flex flex-col">
      <div className="fixed top-[-20%] right-[-10%] w-[60%] h-[600px] bg-violet-600/10 blur-[150px] pointer-events-none z-0 rounded-full" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[50%] h-[500px] bg-fuchsia-600/8 blur-[120px] pointer-events-none z-0 rounded-full" />

      <Navbar />

      <main className="flex-1 container mx-auto px-4 pt-32 pb-20 relative z-10 max-w-3xl">

        {/* Back */}
        <motion.button
          initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={goBack}
          className="flex items-center gap-2 text-white/50 hover:text-white mb-8 transition-colors group"
          dir={isRtl ? "rtl" : "ltr"}
        >
          <BackArrow className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm">{isRtl ? "العودة للملف الشخصي" : "Back to Profile"}</span>
        </motion.button>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 mb-5"
          dir={isRtl ? "rtl" : "ltr"}
        >
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center shrink-0 shadow-lg`}>
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full bg-gradient-to-r ${meta.gradient} text-white`}>
                  {toolLabel}
                </span>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                  record.status === "completed"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}>
                  {record.status === "completed"
                    ? (isRtl ? "✓ مكتمل" : "✓ Completed")
                    : (isRtl ? "✗ فشل" : "✗ Failed")}
                </span>
              </div>
              <h1 className="text-lg font-extrabold text-white leading-snug truncate" title={record.title}>
                {record.title.split('/').pop()}
              </h1>
              <p className="text-xs text-white/40 mt-1">{record.date}</p>
            </div>
          </div>
        </motion.div>

        {/* ── Meta Pills ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="grid grid-cols-3 gap-3 mb-5"
          dir={isRtl ? "rtl" : "ltr"}
        >
          {[
            { icon: Globe, label: isRtl ? "اللغة" : "Language", value: record.lang || "Auto" },
            { icon: Zap,   label: isRtl ? "الكريدت" : "Credits", value: `${record.creditsUsed}` },
            { icon: User,  label: isRtl ? "الصوت" : "Voice",    value: record.voice && record.voice !== "-" ? record.voice : "—" },
          ].map((item, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center">
              <item.icon className="w-4 h-4 text-white/30 mx-auto mb-1.5" />
              <p className="text-[10px] text-white/40 mb-0.5">{item.label}</p>
              <p className="text-sm font-bold text-white truncate">{item.value}</p>
            </div>
          ))}
        </motion.div>

        {/* ─────────────────────────────────── */}
        {/* ── SECTION: INPUT TEXT (if any) ── */}
        {/* ─────────────────────────────────── */}
        {record.inputText && (
          <motion.div
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
            className="mb-5"
            dir={isRtl ? "rtl" : "ltr"}
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <AlignLeft className="w-4 h-4 text-white/40" />
                <span className="text-xs font-semibold text-white/50">
                  {isRtl ? "النص المُدخل" : "Input Text"}
                </span>
              </div>
              <button
                onClick={() => copyText(record.inputText)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/50 hover:text-white text-[11px] transition-all"
              >
                <Copy className="w-3 h-3" />
                {copied ? (isRtl ? "تم!" : "Copied!") : (isRtl ? "نسخ" : "Copy")}
              </button>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap" dir="auto">
                {record.inputText}
              </p>
            </div>
          </motion.div>
        )}

        {/* ─────────────────────────────── */}
        {/* ── SECTION: AUDIO PLAYER ── */}
        {/* ─────────────────────────────── */}
        {mediaType === "audio" && mediaSrc && (
          <motion.div
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
            className="mb-5"
            dir={isRtl ? "rtl" : "ltr"}
          >
            <div className="flex items-center gap-2 mb-2 px-1">
              <FileAudio className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-semibold text-white/50">
                {isRtl ? "الملف الصوتي" : "Audio Output"}
              </span>
            </div>
            <AudioPlayer src={mediaSrc} isRtl={isRtl} />
          </motion.div>
        )}

        {/* ─────────────────────────────── */}
        {/* ── SECTION: IMAGE VIEWER ── */}
        {/* ─────────────────────────────── */}
        {mediaType === "image" && mediaSrc && (
          <motion.div
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
            className="mb-5"
            dir={isRtl ? "rtl" : "ltr"}
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-white/50">
                  {isRtl ? "الصورة الناتجة" : "Output Image"}
                </span>
              </div>
              <a
                href={mediaSrc}
                download
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/50 hover:text-white text-[11px] transition-all"
              >
                <Download className="w-3 h-3" />
                {isRtl ? "تحميل" : "Download"}
              </a>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaSrc}
                alt={record.title}
                className="w-full max-h-[500px] object-contain"
                style={{ background: "repeating-conic-gradient(#ffffff10 0% 25%, transparent 0% 50%) 0 0 / 16px 16px" }}
              />
            </div>
          </motion.div>
        )}

        {/* ─────────────────────────────── */}
        {/* ── SECTION: VIDEO PLAYER ── */}
        {/* ─────────────────────────────── */}
        {mediaType === "video" && mediaSrc && (
          <motion.div
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
            className="mb-5"
            dir={isRtl ? "rtl" : "ltr"}
          >
            <div className="flex items-center gap-2 mb-2 px-1">
              <Volume2 className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-white/50">
                {isRtl ? "الفيديو الناتج" : "Output Video"}
              </span>
            </div>
            <div className="bg-black rounded-2xl overflow-hidden border border-white/10">
              <video
                src={mediaSrc}
                controls
                className="w-full max-h-[450px]"
              />
            </div>
          </motion.div>
        )}

        {/* ────────────────────────────────── */}
        {/* ── SECTION: RESULT TEXT ── */}
        {/* ────────────────────────────────── */}
        {record.resultText && (
          <motion.div
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.20 }}
            className="mb-5"
            dir={isRtl ? "rtl" : "ltr"}
          >
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-fuchsia-400" />
                <span className="text-xs font-semibold text-white/50">
                  {record.type === "voice-to-text"
                    ? (isRtl ? "النص المُحوَّل" : "Transcribed Text")
                    : (isRtl ? "النتيجة" : "Result")}
                </span>
              </div>
              <button
                onClick={() => copyText(record.resultText)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/50 hover:text-white text-[11px] transition-all"
              >
                <Copy className="w-3 h-3" />
                {copied ? (isRtl ? "تم!" : "Copied!") : (isRtl ? "نسخ" : "Copy")}
              </button>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap" dir="auto">
                {record.resultText}
              </p>
            </div>
          </motion.div>
        )}

        {/* If nothing to show */}
        {!record.inputText && mediaType === "none" && !record.resultText && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center"
          >
            <AlertTriangle className="w-10 h-10 text-yellow-400/50 mx-auto mb-3" />
            <p className="text-white/40 text-sm">
              {isRtl ? "لا توجد بيانات مرتبطة بهذه العملية" : "No output data associated with this record"}
            </p>
          </motion.div>
        )}

      </main>

      <Footer />
    </div>
  );
}
