"use client";

import React from "react";
import { useTranslations } from "next-intl";

interface MaintenanceScreenProps {
  endDate?: string | null;
}

export function MaintenanceScreen({ endDate }: MaintenanceScreenProps) {
  const t = useTranslations("Common");
  
  let formattedDate = "";
  if (endDate) {
    try {
      const date = new Date(endDate);
      formattedDate = new Intl.DateTimeFormat('ar-EG', {
        dateStyle: 'full',
        timeStyle: 'short'
      }).format(date);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#121212] p-4 font-cairo">
      <div className="max-w-md w-full bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-xl p-8 text-center border border-gray-100 dark:border-gray-800">
        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          الموقع تحت الصيانة
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
          نحن نقوم ببعض التحديثات الهامة لتحسين تجربتك. سنعود في أقرب وقت ممكن.
          شكراً لتفهمك وصبرك!
        </p>
        
        {formattedDate && (
          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-lg p-4 mb-6">
            <span className="block text-sm opacity-80 mb-1">الوقت المتوقع للانتهاء:</span>
            <span className="font-semibold" dir="rtl">{formattedDate}</span>
          </div>
        )}

        <button 
          onClick={() => window.location.reload()}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          إعادة التحميل
        </button>
      </div>
    </div>
  );
}
