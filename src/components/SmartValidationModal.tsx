import React, { useState } from 'react';
import { X, CheckCircle2, ArrowLeft, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';
import { useValidationStore } from '../store/useValidationStore';
import { useShiftStore } from '../store/useShiftStore';
import toast from 'react-hot-toast';

interface SmartValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmForceClose?: () => void;
}

export const SmartValidationModal: React.FC<SmartValidationModalProps> = ({
  isOpen,
  onClose,
  onConfirmForceClose
}) => {
  const errors = useValidationStore(state => state.errors);
  const scrollToError = useValidationStore(state => state.scrollToError);
  
  const cashierName = useShiftStore(state => state.data.cashierName);
  const updateData = useShiftStore(state => state.updateData);

  const [selectedCashier, setSelectedCashier] = useState(cashierName || '');

  if (!isOpen) return null;

  const handleCashierChange = (name: string) => {
    setSelectedCashier(name);
    updateData(['cashierName'], name);
  };

  const handleFinalConfirm = () => {
    if (!selectedCashier.trim()) {
      toast.error('خطوة إجبارية: يرجى تحديد اسم الكاشير المسؤول عن الإغلاق النهائي أولاً');
      return;
    }
    updateData(['cashierName'], selectedCashier.trim());
    onClose();
    onConfirmForceClose?.();
  };

  const errorEntries = Object.entries(errors).filter(([key]) => key !== 'cashierName');
  const hasErrors = errorEntries.length > 0;

  const handleFixError = (key: string) => {
    onClose();
    setTimeout(() => {
      scrollToError(key);
    }, 150);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 print:hidden" dir="rtl">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4 text-indigo-600 border-b pb-3">
          <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-700">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">نظام الإغلاق والتحقق الذكي</h3>
            <p className="text-xs text-gray-500 mt-0.5">تحديد الكاشير المسائي المسؤول وفحص الحقول قبل الإغلاق النهائي</p>
          </div>
        </div>

        {/* MANDATORY CASHIER SELECTION SECTION */}
        <div className="mb-5 bg-indigo-50/80 border-2 border-indigo-200 p-4 rounded-xl space-y-2">
          <label className="block text-xs sm:text-sm font-extrabold text-indigo-950 flex items-center gap-1.5">
            <UserCheck size={18} className="text-indigo-600" />
            <span>تحديد الكاشير المسؤول عن الإغلاق النهائي (خطوة إجبارية):</span>
          </label>
          <select
            value={selectedCashier}
            onChange={(e) => handleCashierChange(e.target.value)}
            className="w-full px-3 py-2.5 border-2 border-indigo-300 rounded-xl text-sm font-bold text-gray-900 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">-- اختر اسم الكاشير النهائي --</option>
            <option value="قصي البدور">قصي البدور</option>
            <option value="أمجد شحادات">أمجد شحادات</option>
          </select>
          {!selectedCashier.trim() && (
            <p className="text-[11px] font-bold text-rose-600 animate-pulse">
              ⚠️ يرجى اختيار اسم الكاشير لتتمكن من إتمام الإغلاق وتأكيد التقرير.
            </p>
          )}
        </div>

        {hasErrors ? (
          <div className="space-y-4">
            
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 leading-relaxed font-semibold">
              <span className="font-extrabold block text-sm mb-1 text-rose-800">⚠️ تم اكتشاف {errorEntries.length} نواقص يجب استكمالها:</span>
              تم تظليل الجداول والحقول المطلوبة بإطار أحمر وامض في الصفحة. يمكنك النقر على أي بند أدناه للذهاب إليه مباشرة.
            </div>

            <div className="space-y-2.5">
              {errorEntries.map(([key, message], index) => (
                <div 
                  key={key} 
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-rose-50/50 border border-gray-200 hover:border-rose-300 transition-all group"
                >
                  <div className="flex items-start gap-2.5 pl-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-700 font-extrabold text-xs shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-gray-800 leading-snug">
                      {message}
                    </span>
                  </div>
                  <button
                    onClick={() => handleFixError(key)}
                    className="shrink-0 flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <span>استكمال</span>
                    <ArrowLeft size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t flex flex-col sm:flex-row gap-2.5 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm"
              >
                العودة واستكمال البيانات
              </button>
              {onConfirmForceClose && (
                <button
                  type="button"
                  disabled={!selectedCashier.trim()}
                  onClick={handleFinalConfirm}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  إغلاق وتجاوز الفحص (استثنائي)
                </button>
              )}
            </div>

          </div>
        ) : (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900">جميع البيانات الحسابية مكتملة وجاهزة!</h4>
              <p className="text-xs text-gray-600 mt-1">تم فحص كافة الجداول ومطابقة الأرقام بنجاح.</p>
            </div>
            <button
              disabled={!selectedCashier.trim()}
              onClick={handleFinalConfirm}
              className="w-full px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-xl font-bold text-sm transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <Sparkles size={18} />
              <span>تأكيد الكاشير ({selectedCashier || 'غير محدد'}) وإغلاق الشفت</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
