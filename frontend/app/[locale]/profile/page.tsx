"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Navbar from "../../../src/components/Navbar";
import Footer from "../../../src/components/Footer";
import MobileBottomNav from "../../../src/components/MobileBottomNav";
import {
  Activity, Crown, History, FileText, User as UserIcon, Lock,
  Image as ImageIcon, Loader2, Save, Upload
} from "lucide-react";
import api from "../../../src/utils/api";
import { useAppStore } from "../../../src/store/useAppStore";

export default function ProfilePage() {
  const t = useTranslations("Profile");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const router = useRouter();
  
  const user = useAppStore(state => state.user);
  const setUser = useAppStore(state => state.setUser);
  
  const [historyCount, setHistoryCount] = useState(0);
  
  // Settings State
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(user?.imageUrl || null);
  
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && !fullName) {
      setFullName(user.fullName || "");
      setImagePreview(user.imageUrl || null);
    }
  }, [user]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/api/history");
        setHistoryCount(res.data.length);
      } catch (err) {
        console.error("Failed to fetch history count:", err);
      }
    };
    fetchHistory();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateProfile = async () => {
    setSavingProfile(true);
    try {
      const formData = new FormData();
      formData.append("FullName", fullName);
      if (profileImage) {
        formData.append("ProfileImage", profileImage);
      }

      const res = await api.put("/api/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      
      // Update local store
      if (user) {
        useAppStore.setState({ user: { ...user, fullName: res.data.fullName, imageUrl: res.data.imageUrl } });
      }
      alert(isRtl ? "تم التحديث بنجاح" : "Profile updated successfully");
    } catch (err) {
      console.error(err);
      alert(isRtl ? "حدث خطأ أثناء التحديث" : "Error updating profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) return;
    setSavingPassword(true);
    try {
      await api.post("/api/profile/change-password", { currentPassword, newPassword });
      alert(isRtl ? "تم تغيير كلمة المرور بنجاح" : "Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      console.error(err);
      alert(isRtl ? "كلمة المرور الحالية غير صحيحة" : "Incorrect current password");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0a0015] flex flex-col selection:bg-violet-500/30">
      <div className="fixed top-[-20%] right-[-10%] w-[60%] h-[600px] bg-fuchsia-600/10 blur-[150px] pointer-events-none z-0 rounded-full" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[50%] h-[500px] bg-violet-600/10 blur-[120px] pointer-events-none z-0 rounded-full" />

      <Navbar />

      <main className="flex-1 container mx-auto px-4 pt-32 pb-20 relative z-10 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex items-center justify-between">
          <h1 className="text-4xl font-extrabold text-white">{t('title')}</h1>
          <button 
            onClick={() => router.push(`/${locale}/history`)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-fuchsia-500/25"
          >
            <History className="w-5 h-5" />
            {isRtl ? "سجل العمليات" : "Generation History"}
          </button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Info & Stats */}
          <div className="lg:col-span-1 space-y-6">

            {/* Profile Avatar summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-center"
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-white/10 mb-4 overflow-hidden border-2 border-white/20 flex items-center justify-center">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-10 h-10 text-white/50" />
                )}
              </div>
              <h2 className="text-xl font-bold text-white">{user?.fullName || "User"}</h2>
              <p className="text-white/50 text-sm mt-1">{user?.email}</p>
            </motion.div>

            {/* Subscription Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-transparent blur-2xl" />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                  <Crown className="w-5 h-5 text-yellow-400" />
                </div>
                <h2 className="text-xl font-bold text-white">{t('subscription.title')}</h2>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-white/60">{t('subscription.plan')}</span>
                  <span className="text-white font-bold bg-white/10 px-3 py-1 rounded-full text-sm">
                    {user?.activePlan ? (isRtl ? user.activePlan.nameAr : user.activePlan.name) : (isRtl ? "مجاني" : "Free")}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-white/60">{t('subscription.status')}</span>
                  <span className="text-emerald-400 font-medium text-sm flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> {user?.activePlan ? user.activePlan.status : "Active"}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-white/60">{isRtl ? "تاريخ الانتهاء" : "Expiration Date"}</span>
                  <span className="text-white font-medium text-sm">
                    {user?.activePlan?.endDate 
                      ? new Date(user.activePlan.endDate).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : (isRtl ? "بدون تاريخ انتهاء (مجاني)" : "No expiration (Free)")
                    }
                  </span>
                </div>
                <button onClick={() => router.push(`/${locale}/pricing`)} className="w-full py-3 mt-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-medium transition-all hover:border-white/20">
                  {t('subscription.upgrade')}
                </button>
              </div>
            </motion.div>

            {/* Stats Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center border border-violet-500/30">
                  <Activity className="w-5 h-5 text-violet-400" />
                </div>
                <h2 className="text-xl font-bold text-white">{t('usage.title')}</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 rounded-2xl p-3 text-center">
                  <p className="text-2xl font-extrabold text-white">{historyCount}</p>
                  <p className="text-xs text-white/50 mt-1">{isRtl ? "إجمالي العمليات" : "Total Operations"}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-3 text-center">
                  <p className="text-2xl font-extrabold text-emerald-400">
                    {user?.availableCredits || 0}
                  </p>
                  <p className="text-xs text-white/50 mt-1">{isRtl ? "كريدت متاح" : "Available Credits"}</p>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Right Column: Settings */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* General Profile Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8"
              dir={isRtl ? "rtl" : "ltr"}
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <UserIcon className="w-6 h-6 text-fuchsia-400" />
                {isRtl ? "إعدادات الحساب" : "Account Settings"}
              </h2>

              <div className="space-y-6">
                {/* Profile Picture Upload */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-3">
                    {isRtl ? "الصورة الشخصية" : "Profile Picture"}
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      {imagePreview ? (
                        <img src={imagePreview} alt="Profile Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-white/30" />
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <Upload className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-white/40 mb-2">
                        {isRtl ? "الصور المدعومة: JPG, PNG. أقصى حجم 2MB." : "Supported formats: JPG, PNG. Max size 2MB."}
                      </p>
                      <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors">
                        {isRtl ? "اختر صورة" : "Choose Image"}
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleImageChange} 
                        accept="image/*" 
                        className="hidden" 
                      />
                    </div>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    {isRtl ? "الاسم الكامل" : "Full Name"}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all"
                    placeholder={isRtl ? "أدخل اسمك" : "Enter your name"}
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={savingProfile}
                    className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {savingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {isRtl ? "حفظ التغييرات" : "Save Changes"}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Password Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8"
              dir={isRtl ? "rtl" : "ltr"}
            >
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <Lock className="w-6 h-6 text-violet-400" />
                {isRtl ? "تغيير كلمة المرور" : "Change Password"}
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    {isRtl ? "كلمة المرور الحالية" : "Current Password"}
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    {isRtl ? "كلمة المرور الجديدة" : "New Password"}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all"
                  />
                </div>
                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleChangePassword}
                    disabled={savingPassword || !currentPassword || !newPassword}
                    className="px-6 py-3 bg-white/10 border border-white/20 text-white font-bold rounded-xl hover:bg-white/20 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {savingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {isRtl ? "تحديث كلمة المرور" : "Update Password"}
                  </button>
                </div>
              </div>
            </motion.div>

          </div>

        </div>
      </main>

      <Footer />
      <MobileBottomNav />
      <div className="h-16 md:hidden" />
    </div>
  );
}
