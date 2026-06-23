"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Menu, X, Globe } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname, useRouter } from "../i18n/routing";
import { useAppStore } from "../store/useAppStore";
import api from "../utils/api";

function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLanguage = () => {
    const nextLocale = locale === 'ar' ? 'en' : 'ar';
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <button 
      onClick={toggleLanguage}
      className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors px-2"
    >
      <Globe className="w-4 h-4" />
      <span className="text-sm font-medium uppercase mt-0.5">{locale === 'ar' ? 'EN' : 'عربي'}</span>
    </button>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  const t = useTranslations('Navbar');
  const locale = useLocale();
  const router = useRouter();

  const { isAuthenticated, user, setUser, logout } = useAppStore();

  useEffect(() => {
    if (!isAuthenticated) {
      api.get("/api/auth/me").then(res => {
        setUser(res.data);
      }).catch(() => {});
    }
  }, [isAuthenticated, setUser]);

  const navLinks = [
    { label: t('home'), href: "/" },
    { label: t('tools'), href: "/tools" },
    { label: t('pricing'), href: "/pricing" },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-[#0a0015]/90 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-purple-900/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <img src="/images/logo.png" alt={t('logo')} className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-violet-500/30 group-hover:shadow-violet-500/60 transition-all duration-300" />
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 opacity-0 group-hover:opacity-30 blur-md transition-all duration-300" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">
              <span className="text-violet-400">Nex</span>Media
            </span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-white/70 hover:text-white text-sm font-medium transition-colors duration-200 relative group"
              >
                {link.label}
                <span className={`absolute -bottom-0.5 ${locale === 'ar' ? 'right-0' : 'left-0'} w-full h-px bg-gradient-to-r from-violet-500 to-fuchsia-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ${locale === 'ar' ? 'origin-right' : 'origin-left'}`} />
              </Link>
            ))}
          </div>

          {/* CTA & Lang */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-white/80 hidden lg:block">
                  {user?.fullName || user?.email}
                </span>
                <Link
                  href="/profile"
                  className="relative px-5 py-2.5 rounded-xl text-sm font-semibold text-white overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 group-hover:from-violet-500 group-hover:to-fuchsia-500 transition-all duration-300" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-400/20 to-fuchsia-400/20 blur-sm" />
                  </div>
                  <span className="relative">{locale === 'ar' ? 'حسابي' : 'Profile'}</span>
                </Link>
                <button
                  onClick={() => {
                    api.post('/api/auth/logout').finally(() => {
                      logout();
                      router.push('/');
                    });
                  }}
                  className="text-white/60 hover:text-white/90 text-sm font-medium transition-colors cursor-pointer"
                >
                  {locale === 'ar' ? 'خروج' : 'Logout'}
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-white/80 hover:text-white text-sm font-medium transition-colors px-4 py-2"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  className="relative px-5 py-2.5 rounded-xl text-sm font-semibold text-white overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-purple-600 group-hover:from-violet-500 group-hover:to-fuchsia-500 transition-all duration-300" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-400/20 to-fuchsia-400/20 blur-sm" />
                  </div>
                  <span className="relative">{t('startNow')}</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <LanguageSwitcher />
            <button
              className="text-white/80 hover:text-white transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-[#0d0020]/95 backdrop-blur-xl border-b border-white/10 overflow-hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-4" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-white/80 hover:text-white text-base font-medium py-2 border-b border-white/5 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              {isAuthenticated ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="mt-2 w-full text-center py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold"
                  >
                    {locale === 'ar' ? 'حسابي' : 'Profile'}
                  </Link>
                  <button
                    onClick={() => {
                      api.post('/api/auth/logout').finally(() => {
                        logout();
                        setMenuOpen(false);
                        router.push('/');
                      });
                    }}
                    className="mt-2 w-full text-center py-3 rounded-xl bg-white/5 border border-white/10 text-white font-semibold"
                  >
                    {locale === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                  </button>
                </>
              ) : (
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="mt-2 w-full text-center py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold"
                >
                  {t('startNow')}
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

