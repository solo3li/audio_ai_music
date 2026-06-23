"use client";

import React, { useEffect, useState } from 'react';
import { usePlansStore } from '@/store/usePlansStore';
import { Check, X, Sparkles, Zap, Server } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from "../../../src/components/Navbar";
import Footer from "../../../src/components/Footer";
import MobileBottomNav from "../../../src/components/MobileBottomNav";
import CursorGlow from "../../../src/components/CursorGlow";
import { useLocale } from 'next-intl';
import CheckoutModal from '@/components/CheckoutModal';
import { Plan } from '@/store/usePlansStore';

export default function PricingPage() {
  const { plans, isLoading, error, fetchPlans } = usePlansStore();
  const [currency, setCurrency] = useState<'USD' | 'EGP'>('USD');
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const locale = useLocale();
  const isRtl = locale === 'ar';

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const getIcon = (index: number) => {
    switch (index) {
      case 0: return <Sparkles className="w-8 h-8 text-blue-400" />;
      case 1: return <Zap className="w-8 h-8 text-purple-400" />;
      case 2: return <Server className="w-8 h-8 text-emerald-400" />;
      default: return <Sparkles className="w-8 h-8 text-blue-400" />;
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      <CursorGlow />
      <Navbar />
      
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 py-32 px-4">
        <div className="text-center mb-16 space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400"
          >
            {isRtl ? 'اختر باقتك الخارقة' : 'Choose Your Superpower'}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto"
          >
            {isRtl ? 'أطلق العنان لإمكانيات نماذج الذكاء الاصطناعي من الجيل القادم بأسعار تتناسب مع طموحاتك.' : 'Unleash the full potential of Next-Gen AI models with pricing that scales with your ambitions.'}
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center p-1 bg-white/5 border border-white/10 rounded-full mt-8 backdrop-blur-sm"
          >
            <button
              onClick={() => setCurrency('USD')}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${currency === 'USD' ? 'bg-white text-black shadow-lg shadow-white/20' : 'text-gray-400 hover:text-white'}`}
            >
              USD
            </button>
            <button
              onClick={() => setCurrency('EGP')}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-300 ${currency === 'EGP' ? 'bg-white text-black shadow-lg shadow-white/20' : 'text-gray-400 hover:text-white'}`}
            >
              EGP
            </button>
          </motion.div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl p-6 max-w-lg mx-auto">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {plans.map((plan, index) => {
              const isPopular = index === 1;
              const price = currency === 'USD' ? plan.priceUsd : plan.priceEgp;
              const currencySymbol = currency === 'USD' ? '$' : 'EGP ';

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 }}
                  className={`relative group rounded-3xl p-[1px] transition-all duration-500 hover:scale-105 hover:z-10 ${isPopular ? 'bg-gradient-to-b from-purple-500 to-blue-500 shadow-2xl shadow-purple-500/20' : 'bg-white/10'}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none`} />
                  
                  <div className="h-full bg-[#111111]/90 backdrop-blur-xl rounded-[23px] p-8 flex flex-col relative overflow-hidden">
                    {/* Glow effect on hover */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-white/5 rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    {isPopular && (
                      <div className="absolute top-0 inset-x-0 flex justify-center -translate-y-1/2">
                        <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div className="mb-8">
                      <div className="p-3 bg-white/5 inline-block rounded-2xl mb-4 border border-white/5 group-hover:border-white/20 transition-colors">
                        {getIcon(index)}
                      </div>
                      <h3 className="text-2xl font-semibold text-white mb-2">{isRtl ? plan.nameAr : plan.name}</h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-extrabold tracking-tight">
                          {price === 0 ? 'Free' : `${currencySymbol}${price}`}
                        </span>
                        {price > 0 && <span className="text-gray-400 font-medium">/mo</span>}
                      </div>
                      <p className="text-gray-400 mt-4 font-medium">
                        {plan.monthlyCredits.toLocaleString()} Credits included
                      </p>
                    </div>

                    <div className="space-y-6 flex-grow">
                      <div>
                        <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-3">Text-to-Speech (TTS)</p>
                        <ul className="space-y-3">
                          <li className="flex items-start gap-3">
                            {plan.ttsEnabled ? <Check className="w-5 h-5 text-emerald-400 shrink-0" /> : <X className="w-5 h-5 text-red-400 shrink-0" />}
                            <span className="text-gray-300">Access to standard models</span>
                          </li>
                          {plan.ttsEnabled && (
                            <>
                              <li className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                                <span className="text-gray-300">Max Chars: {plan.ttsMaxCharsPerRequest === -1 ? 'Unlimited' : plan.ttsMaxCharsPerRequest.toLocaleString()}</span>
                              </li>
                              <li className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                                <span className="text-gray-300">Cost: ${plan.ttsCostPerChar}/char</span>
                              </li>
                            </>
                          )}
                        </ul>
                      </div>

                      <div>
                        <p className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-3">Speech-to-Text (STT)</p>
                        <ul className="space-y-3">
                          <li className="flex items-start gap-3">
                            {plan.sttEnabled ? <Check className="w-5 h-5 text-emerald-400 shrink-0" /> : <X className="w-5 h-5 text-red-400 shrink-0" />}
                            <span className="text-gray-300">Ultra-fast transcription</span>
                          </li>
                          {plan.sttEnabled && (
                            <>
                              <li className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                                <span className="text-gray-300">Max File Size: {plan.sttMaxFileSizeMb === -1 ? 'Unlimited' : `${plan.sttMaxFileSizeMb}MB`}</span>
                              </li>
                              <li className="flex items-start gap-3">
                                <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                                <span className="text-gray-300">Cost: ${plan.sttCostPerMinute}/min</span>
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>

                    <button 
                      onClick={() => setSelectedPlan(plan)}
                      className={`w-full py-4 mt-8 rounded-xl font-semibold transition-all duration-300 ${isPopular ? 'bg-white text-black hover:bg-gray-100 hover:shadow-lg hover:shadow-white/20' : 'bg-white/10 text-white hover:bg-white/20'}`}
                    >
                      {plan.priceUsd === 0 ? (isRtl ? 'ابدأ مجاناً' : 'Get Started for Free') : (isRtl ? 'اشترك الآن' : 'Subscribe Now')}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
      <MobileBottomNav />
      <div className="h-16 md:hidden" />

      {selectedPlan && (
        <CheckoutModal 
          plan={selectedPlan} 
          currency={currency} 
          onClose={() => setSelectedPlan(null)} 
        />
      )}
    </div>
  );
}
