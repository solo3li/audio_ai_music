"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import Navbar from "../../../../src/components/Navbar";
import Footer from "../../../../src/components/Footer";
import {
  UploadCloud, Mic, Square, Play, Pause, Copy, Download,
  Loader2, FileAudio, CheckCircle2, X, Volume2, Zap
} from "lucide-react";
import { uploadDirectToMinio } from "../../../../src/utils/upload";
import api from "../../../../src/utils/api";

const LANGUAGES = [
  { code: 'auto', name: 'Auto-Detect' },
  { code: 'ar', name: 'Arabic - العربية' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish - Español' },
  { code: 'fr', name: 'French - Français' },
  { code: 'de', name: 'German - Deutsch' },
  { code: 'it', name: 'Italian - Italiano' },
  { code: 'pt', name: 'Portuguese - Português' },
  { code: 'ru', name: 'Russian - Русский' },
  { code: 'zh', name: 'Chinese - 中文' },
  { code: 'ja', name: 'Japanese - 日本語' },
  { code: 'ko', name: 'Korean - 한국어' },
  { code: 'hi', name: 'Hindi - हिन्दी' },
  { code: 'tr', name: 'Turkish - Türkçe' },
];

type Stage = 'idle' | 'uploading' | 'transcribing' | 'done' | 'error';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VoiceToTextPage() {
  const t = useTranslations("VoiceToText");
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [file, setFile] = useState<File | Blob | null>(null);
  const [mode, setMode] = useState("transcribe");
  const [language, setLanguage] = useState("auto");
  const [isRecording, setIsRecording] = useState(false);
  const [stage, setStage] = useState<Stage>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  // Audio preview player state
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await api.get("/api/platform/vtt-config");
        setIsMaintenanceMode(res.data.isMaintenanceMode || false);
      } catch (err) {
        console.error("Failed to fetch config:", err);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    if (!file || duration <= 0) {
      setEstimatedCost(null);
      return;
    }
    const fetchEstimate = async () => {
      setIsEstimating(true);
      try {
        const fileSizeBytes = file.size;
        const durationMinutes = duration / 60;
        const res = await api.post("/api/ai/voice-to-text/estimate", { fileSizeBytes, durationMinutes });
        setEstimatedCost(res.data.estimatedCost);
      } catch (err) {
        console.error("Failed to estimate:", err);
      } finally {
        setIsEstimating(false);
      }
    };
    fetchEstimate();
  }, [file, duration]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setFile(blob);
        // Create preview URL for recorded audio
        if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        const url = URL.createObjectURL(blob);
        setAudioPreviewUrl(url);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setResult("");
        setStage('idle');
      };

      mediaRecorder.start();
      setIsRecording(true);
      setFile(null);
      setResult("");
      setStage('idle');
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    // Create object URL for preview
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    const url = URL.createObjectURL(selectedFile);
    setAudioPreviewUrl(url);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setResult("");
    setStage('idle');
    setUploadProgress(0);
    setError("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith('audio/')) {
      handleFileSelect(droppedFile);
    }
  }, []);

  const clearFile = () => {
    setFile(null);
    setStage('idle');
    setUploadProgress(0);
    setResult("");
    setError("");
    if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
    setAudioPreviewUrl(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    audioRef.current.currentTime = ratio * duration;
    setCurrentTime(ratio * duration);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const processAudio = async () => {
    if (!file) return;
    setError("");
    setResult("");

    try {
      // Stage 1: Upload
      setStage('uploading');
      setUploadProgress(0);
      const audioFile = file instanceof File
        ? file
        : new File([file], "recording.webm", { type: "audio/webm" });

      const fileId = await uploadDirectToMinio(audioFile, 'voice-to-text', (percent) => {
        setUploadProgress(percent);
      });

      // Stage 2: Transcribe
      setStage('transcribing');
      const res = await api.post("/api/ai/voice-to-text/transcribe", {
        fileId,
        translate: mode === "translate",
        targetLanguage: language,
      });

      setResult(res.data.translated_text || res.data.original_text);
      setStage('done');
    } catch (err) {
      setError(t('error'));
      setStage('error');
    }
  };

  const copyText = () => navigator.clipboard.writeText(result);

  const downloadText = () => {
    const element = document.createElement("a");
    const fileBlob = new Blob([result], { type: "text/plain" });
    element.href = URL.createObjectURL(fileBlob);
    element.download = "transcription.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const isProcessing = stage === 'uploading' || stage === 'transcribing';

  const stageLabel = {
    idle: '',
    uploading: isRtl ? 'جاري رفع الملف...' : 'Uploading file...',
    transcribing: isRtl ? 'جاري تحليل الصوت...' : 'Analyzing audio...',
    done: isRtl ? 'اكتمل بنجاح!' : 'Completed!',
    error: isRtl ? 'حدث خطأ' : 'Error occurred',
  };

  return (
    <div className="relative min-h-screen bg-[#0a0015] flex flex-col">
      <div className="fixed top-1/4 left-1/4 w-[60%] h-[500px] bg-violet-600/10 blur-[150px] pointer-events-none z-0 rounded-full" />

      <Navbar />

      <main className="flex-1 container mx-auto px-4 pt-32 pb-20 relative z-10 max-w-5xl">
        {isMaintenanceMode ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="w-20 h-20 bg-violet-600/20 rounded-full flex items-center justify-center mb-6">
              <Mic className="w-10 h-10 text-violet-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">هذه الأداة تحت الصيانة مؤقتاً</h1>
            <p className="text-white/60 max-w-md">نحن نقوم بتحديث أداة تحويل الصوت إلى نص لتحسين الجودة. يرجى المحاولة لاحقاً. نعتذر عن الإزعاج.</p>
          </div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">{t('title')}</h1>
          <p className="text-lg text-white/60">{t('subtitle')}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Controls & Input */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col gap-6"
          >
            {/* Mode Selection */}
            <div className="flex gap-4 p-1 bg-white/5 rounded-xl border border-white/10" dir={isRtl ? 'rtl' : 'ltr'}>
              <button
                onClick={() => setMode("transcribe")}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${mode === "transcribe" ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg" : "text-white/60 hover:text-white"}`}
              >
                {t('transcribe')}
              </button>
              <button
                onClick={() => {
                  setMode("translate");
                  if (language === 'auto') setLanguage('en');
                }}
                className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${mode === "translate" ? "bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-lg" : "text-white/60 hover:text-white"}`}
              >
                {t('translate')}
              </button>
            </div>

            {/* Language Selection */}
            <div dir={isRtl ? 'rtl' : 'ltr'}>
              <label className="block text-sm font-medium text-white/70 mb-2">
                {mode === 'translate' ? t('targetLanguage') : t('language')}
              </label>
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all appearance-none"
                >
                  {LANGUAGES.filter(lang => mode === 'transcribe' || lang.code !== 'auto').map(lang => (
                    <option key={lang.code} value={lang.code} className="bg-[#0a0015]">{lang.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Upload / Record area */}
            <div className="grid grid-cols-2 gap-4">
              {/* Drag & Drop Upload */}
              <label
                className={`cursor-pointer group flex flex-col items-center justify-center p-6 border border-dashed rounded-2xl hover:bg-white/10 transition-all text-center ${
                  isDragOver
                    ? 'bg-violet-500/20 border-violet-500 scale-105'
                    : 'bg-white/5 border-white/10 hover:border-violet-500/50'
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
              >
                <UploadCloud className={`w-8 h-8 mb-3 transition-all ${isDragOver ? 'text-violet-300 scale-125' : 'text-violet-400 group-hover:scale-110'}`} />
                <span className="text-sm font-medium text-white">{t('upload')}</span>
                <span className="text-[10px] text-white/30 mt-1">MP3, WAV, M4A...</span>
                <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
              </label>

              {/* Record Button */}
              {isRecording ? (
                <button
                  onClick={stopRecording}
                  className="flex flex-col items-center justify-center p-6 bg-red-500/20 border border-red-500/50 rounded-2xl hover:bg-red-500/30 transition-all text-center animate-pulse"
                >
                  <Square className="w-8 h-8 text-red-400 mb-3" />
                  <span className="text-sm font-medium text-red-100">{t('stopRecording')}</span>
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  className="group flex flex-col items-center justify-center p-6 bg-white/5 border border-white/10 border-dashed rounded-2xl hover:bg-white/10 hover:border-fuchsia-500/50 transition-all text-center"
                >
                  <Mic className="w-8 h-8 text-fuchsia-400 mb-3 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-white">{t('record')}</span>
                </button>
              )}
            </div>

            {/* File Card + Progress */}
            <AnimatePresence>
              {file && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.97 }}
                  className="rounded-2xl overflow-hidden border border-white/10 bg-white/5"
                >
                  {/* File Header */}
                  <div className="flex items-center gap-3 px-4 py-3" dir={isRtl ? 'rtl' : 'ltr'}>
                    <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                      <FileAudio className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {file instanceof File ? file.name : (isRtl ? 'تسجيل صوتي' : 'Recorded Audio')}
                      </p>
                      <p className="text-[11px] text-white/40">
                        {file instanceof File ? formatBytes(file.size) : ''}
                      </p>
                    </div>
                    {!isProcessing && (
                      <button onClick={clearFile} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    {stage === 'done' && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                  </div>

                  {/* ── Hidden Audio Element ── */}
                  {audioPreviewUrl && (
                    <audio
                      ref={audioRef}
                      src={audioPreviewUrl}
                      onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
                      onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
                      onEnded={() => setIsPlaying(false)}
                    />
                  )}

                  {/* ── Custom Audio Player ── */}
                  {audioPreviewUrl && !isProcessing && (
                    <div className="mx-4 mb-3 p-3 bg-[#0a0015]/60 border border-violet-500/20 rounded-xl" dir="ltr">
                      <div className="flex items-center gap-3">
                        {/* Play/Pause Button */}
                        <button
                          onClick={togglePlay}
                          className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shrink-0 hover:shadow-[0_0_16px_rgba(139,92,246,0.5)] transition-all active:scale-95"
                        >
                          {isPlaying
                            ? <Pause className="w-4 h-4 text-white" />
                            : <Play className="w-4 h-4 text-white ml-0.5" />
                          }
                        </button>

                        {/* Timeline */}
                        <div className="flex-1 flex flex-col gap-1">
                          {/* Clickable progress track */}
                          <div
                            className="relative h-1.5 bg-white/10 rounded-full cursor-pointer group"
                            onClick={handleSeek}
                          >
                            {/* Filled portion */}
                            <div
                              className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all"
                              style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                            />
                            {/* Thumb */}
                            <div
                              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1.5"
                              style={{ left: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                            />
                          </div>

                          {/* Time display */}
                          <div className="flex justify-between text-[10px] text-white/40 font-mono">
                            <span>{formatTime(currentTime)}</span>
                            <span>{duration ? formatTime(duration) : '--:--'}</span>
                          </div>
                        </div>

                        {/* Volume icon */}
                        <Volume2 className="w-4 h-4 text-white/30 shrink-0" />
                      </div>
                    </div>
                  )}

                  {/* Progress Bar Area */}
                  <AnimatePresence>
                    {(isProcessing || stage === 'done') && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4"
                      >
                        {/* Stage Label */}
                        <div className="flex items-center justify-between mb-2" dir={isRtl ? 'rtl' : 'ltr'}>
                          <div className="flex items-center gap-1.5">
                            {stage === 'transcribing' && (
                              <Loader2 className="w-3.5 h-3.5 text-fuchsia-400 animate-spin" />
                            )}
                            {stage === 'uploading' && (
                              <UploadCloud className="w-3.5 h-3.5 text-violet-400" />
                            )}
                            {stage === 'done' && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            )}
                            <span className={`text-xs font-medium ${
                              stage === 'done' ? 'text-emerald-400' :
                              stage === 'transcribing' ? 'text-fuchsia-400' : 'text-violet-300'
                            }`}>
                              {stageLabel[stage]}
                            </span>
                          </div>
                          <span className="text-xs text-white/40 font-mono">
                            {stage === 'uploading' ? `${uploadProgress}%` :
                             stage === 'transcribing' ? '...' :
                             stage === 'done' ? '100%' : ''}
                          </span>
                        </div>

                        {/* Main Progress Bar */}
                        <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            className={`absolute inset-y-0 left-0 rounded-full ${
                              stage === 'done'
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                : 'bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500'
                            }`}
                            initial={{ width: '0%' }}
                            animate={{
                              width: stage === 'uploading'
                                ? `${uploadProgress}%`
                                : stage === 'transcribing'
                                ? '100%'
                                : stage === 'done'
                                ? '100%'
                                : '0%',
                            }}
                            transition={{
                              duration: stage === 'transcribing' ? 2.5 : 0.3,
                              ease: stage === 'transcribing' ? 'easeInOut' : 'linear',
                              repeat: stage === 'transcribing' ? Infinity : 0,
                              repeatType: 'mirror',
                            }}
                          />
                          {/* Shimmer effect */}
                          {isProcessing && (
                            <motion.div
                              className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                              animate={{ x: ['-80px', '400px'] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                            />
                          )}
                        </div>

                        {/* Step indicators */}
                        <div className="flex items-center justify-between mt-3" dir={isRtl ? 'rtl' : 'ltr'}>
                          {[
                            { key: 'uploading', label: isRtl ? 'رفع الملف' : 'Upload', done: stage === 'transcribing' || stage === 'done' || stage === 'uploading' },
                            { key: 'transcribing', label: isRtl ? 'تحليل الصوت' : 'Analyze', done: stage === 'done' || stage === 'transcribing' },
                            { key: 'done', label: isRtl ? 'اكتمل' : 'Done', done: stage === 'done' },
                          ].map((step) => (
                            <div key={step.key} className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
                                step.done ? 'bg-fuchsia-400' : 'bg-white/20'
                              }`} />
                              <span className={`text-[10px] font-medium transition-colors duration-500 ${
                                step.done ? 'text-white/70' : 'text-white/30'
                              }`}>{step.label}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Process Button */}
                  {!isProcessing && stage !== 'done' && (
                    <div className="px-4 pb-4">
                      {estimatedCost !== null && (
                        <div className="flex justify-center items-center pb-3 text-sm">
                          {isEstimating ? (
                            <span className="text-white/40 flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> {isRtl ? "جاري حساب التكلفة..." : "Calculating cost..."}</span>
                          ) : (
                            <span className="text-fuchsia-400 font-medium flex items-center gap-1.5 bg-fuchsia-500/10 px-3 py-1 rounded-full border border-fuchsia-500/20">
                              <Zap className="w-4 h-4" />
                              {isRtl ? "التكلفة المتوقعة:" : "Estimated Cost:"} {estimatedCost.toFixed(2)} {isRtl ? "كريدت" : "Credits"}
                            </span>
                          )}
                        </div>
                      )}
                      <button
                        onClick={processAudio}
                        disabled={isEstimating}
                        className="w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-semibold text-sm hover:shadow-[0_0_25px_rgba(139,92,246,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Play className="w-4 h-4" />
                        {t('process')}
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 text-sm p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center"
              >
                {error}
              </motion.div>
            )}
          </motion.div>

          {/* Output */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col"
          >
            <div className="flex items-center justify-between mb-4" dir={isRtl ? 'rtl' : 'ltr'}>
              <h2 className="text-lg font-bold text-white">{t('result')}</h2>
              {result && (
                <div className="flex gap-2">
                  <button onClick={copyText} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-white/70 hover:text-white transition-all" title={t('copy')}>
                    <Copy className="w-4 h-4" />
                  </button>
                  <button onClick={downloadText} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-white/70 hover:text-white transition-all" title={t('download')}>
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className={`flex-1 w-full bg-[#0a0015]/50 border border-white/5 rounded-2xl p-4 min-h-[300px] overflow-y-auto ${!result && !isProcessing ? 'flex items-center justify-center' : ''}`}>
              <AnimatePresence mode="wait">
                {stage === 'transcribing' ? (
                  <motion.div
                    key="transcribing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-full gap-4 text-white/50"
                  >
                    {/* Animated waveform bars */}
                    <div className="flex items-end gap-1 h-12">
                      {[...Array(7)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 bg-gradient-to-t from-violet-600 to-fuchsia-400 rounded-full"
                          animate={{ height: ['8px', `${16 + Math.random() * 28}px`, '8px'] }}
                          transition={{ duration: 0.6 + i * 0.1, repeat: Infinity, ease: 'easeInOut', delay: i * 0.08 }}
                        />
                      ))}
                    </div>
                    <p className="text-sm">{isRtl ? 'جاري تحليل الصوت...' : 'Analyzing audio...'}</p>
                  </motion.div>
                ) : result ? (
                  <motion.p
                    key="result"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-white/90 leading-relaxed whitespace-pre-wrap"
                    dir="auto"
                  >
                    {result}
                  </motion.p>
                ) : (
                  <motion.p
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-white/30 text-sm text-center"
                  >
                    {isRtl ? 'النص المحوَّل سيظهر هنا...' : 'Your transcribed text will appear here...'}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
