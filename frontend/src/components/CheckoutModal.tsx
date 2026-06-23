import React, { useState, useEffect } from 'react';
import { X, UploadCloud, CheckCircle } from 'lucide-react';
import { Plan } from '@/store/usePlansStore';
import { useLocale } from 'next-intl';
import api from '@/utils/api';

interface PaymentMethod {
  id: number;
  name: string;
  accountDetails: string;
  instructions: string | null;
}

interface CheckoutModalProps {
  plan: Plan | null;
  currency: 'USD' | 'EGP';
  onClose: () => void;
}

export default function CheckoutModal({ plan, currency, onClose }: CheckoutModalProps) {
  const [method, setMethod] = useState<'Gateway' | 'Manual'>('Gateway');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const locale = useLocale();
  const isRtl = locale === 'ar';

  useEffect(() => {
    if (method === 'Manual' && paymentMethods.length === 0) {
      const fetchMethods = async () => {
        try {
          const res = await api.get('/api/ManualPayments/methods');
          setPaymentMethods(res.data);
        } catch (err) {
          console.error('Failed to fetch payment methods', err);
        }
      };
      fetchMethods();
    }
  }, [method]);

  if (!plan) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleGatewayCheckout = async () => {
    try {
      setIsSubmitting(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      // For a real implementation, we would call an API that returns a Checkout URL
      // Since CheckoutController returns a View in the backend, we might just redirect the user
      window.location.href = `${apiUrl}/Checkout/Pay?planId=${plan.id}&currency=${currency}`;
    } catch (err) {
      console.error(err);
      setError(isRtl ? 'حدث خطأ' : 'An error occurred');
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!file) {
      setError(isRtl ? 'الرجاء إرفاق إيصال التحويل' : 'Please upload a receipt');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      const formData = new FormData();
      formData.append('PlanId', plan.id.toString());
      formData.append('ReceiptImage', file);

      await api.post('/api/ManualPayments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || (isRtl ? 'حدث خطأ' : 'An error occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="bg-[#1a1a1a] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X className="w-6 h-6" />
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-white mb-2">
            {isRtl ? 'إتمام الدفع' : 'Checkout'}
          </h2>
          <p className="text-gray-400 mb-6">
            {isRtl ? 'أنت على وشك الاشتراك في ' : 'You are subscribing to '}
            <span className="text-white font-semibold">{isRtl ? plan.nameAr : plan.name}</span>
          </p>

          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">{isRtl ? 'تم إرسال الطلب بنجاح' : 'Request Submitted Successfully'}</h3>
              <p className="text-gray-400 mb-6">{isRtl ? 'سوف يقوم الإدارة بمراجعة الإيصال وتفعيل الباقة قريباً.' : 'Admin will review your receipt and activate your plan shortly.'}</p>
              <button onClick={onClose} className="w-full bg-white text-black font-semibold py-3 rounded-xl">
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>
          ) : (
            <>
              {/* Method Selection */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => setMethod('Gateway')}
                  className={`flex-1 py-3 rounded-xl border font-semibold transition-all ${method === 'Gateway' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                >
                  {currency === 'EGP' ? 'Paymob' : 'PayPal'}
                </button>
                <button
                  onClick={() => setMethod('Manual')}
                  className={`flex-1 py-3 rounded-xl border font-semibold transition-all ${method === 'Manual' ? 'bg-purple-600/20 border-purple-500 text-purple-400' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                >
                  {isRtl ? 'تحويل يدوي' : 'Manual Transfer'}
                </button>
              </div>

              {method === 'Gateway' && (
                <div className="space-y-6">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-400">{isRtl ? 'المبلغ المطلوب' : 'Total Amount'}</span>
                      <span className="text-2xl font-bold text-white">
                        {currency === 'USD' ? '$' : 'EGP '}
                        {currency === 'USD' ? plan.priceUsd : plan.priceEgp}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={handleGatewayCheckout}
                    disabled={isSubmitting}
                    className="w-full bg-white text-black font-semibold py-4 rounded-xl hover:bg-gray-100 transition disabled:opacity-50"
                  >
                    {isSubmitting ? '...' : (isRtl ? 'ادفع الآن' : 'Pay Now')}
                  </button>
                </div>
              )}

              {method === 'Manual' && (
                <div className="space-y-6">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-gray-300">
                    <p className="mb-2 font-semibold text-white">{isRtl ? 'تفاصيل التحويل:' : 'Transfer Details:'}</p>
                    {paymentMethods.length > 0 ? (
                      <ul className="list-disc list-inside space-y-2">
                        {paymentMethods.map(pm => (
                          <li key={pm.id}>
                            <span className="font-semibold text-white">{pm.name}:</span> {pm.accountDetails}
                            {pm.instructions && <p className="text-xs text-gray-400 mt-1 mr-4 ml-4">{pm.instructions}</p>}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-400">{isRtl ? 'جاري تحميل طرق الدفع...' : 'Loading payment methods...'}</p>
                    )}
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                      <span className="text-gray-400">{isRtl ? 'المبلغ المطلوب إرساله' : 'Amount to send'}</span>
                      <span className="text-xl font-bold text-white">
                        {currency === 'USD' ? '$' : 'EGP '}
                        {currency === 'USD' ? plan.priceUsd : plan.priceEgp}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      {isRtl ? 'إرفاق إيصال التحويل (صورة)' : 'Upload Transfer Receipt (Image)'}
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-white/10 border-dashed rounded-xl cursor-pointer hover:bg-white/5 transition">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-400">
                          {file ? <span className="text-emerald-400 font-semibold">{file.name}</span> : (isRtl ? 'اضغط لرفع الصورة' : 'Click to upload image')}
                        </p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  </div>

                  {error && <p className="text-red-400 text-sm">{error}</p>}

                  <button 
                    onClick={handleManualSubmit}
                    disabled={isSubmitting || !file}
                    className="w-full bg-purple-500 text-white font-semibold py-4 rounded-xl hover:bg-purple-600 transition disabled:opacity-50"
                  >
                    {isSubmitting ? '...' : (isRtl ? 'تأكيد وإرسال' : 'Confirm & Submit')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
