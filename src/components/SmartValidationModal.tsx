import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ArrowLeft, ShieldAlert, Sparkles, UserCheck, AlertTriangle } from 'lucide-react';
import { useValidationStore } from '../store/useValidationStore';
import { useShiftStore } from '../store/useShiftStore';
import { useCalculations } from '../hooks/useCalculations';
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
  const shiftDifferences = useShiftStore(state => state.data.shiftDifferences) || {
    morning: { cashierName: '', type: 'exact', amount: 0, notes: '' },
    evening: { cashierName: '', type: 'exact', amount: 0, notes: '' }
  };
  const shiftHandover = useShiftStore(state => state.data.shiftHandover);
  const updateData = useShiftStore(state => state.updateData);
  const calc = useCalculations();

  const morningDiff = shiftDifferences.morning || { cashierName: '', type: 'exact', amount: 0, notes: '' };
  const eveningDiff = shiftDifferences.evening || { cashierName: '', type: 'exact', amount: 0, notes: '' };

  const hasDifference = calc.cashShortage > 0.009 || calc.cashSurplus > 0.009 || morningDiff.amount > 0 || eveningDiff.amount > 0;

  const [morningCashier, setMorningCashier] = useState(morningDiff.cashierName || shiftHandover?.morningCashier || '');
  const [morningType, setMorningType] = useState(morningDiff.type || 'exact');
  const [morningAmount, setMorningAmount] = useState(morningDiff.amount || 0);

  const [eveningCashier, setEveningCashier] = useState(eveningDiff.cashierName || cashierName || shiftHandover?.eveningCashier || '');
  const [eveningType, setEveningType] = useState(eveningDiff.type || 'exact');
  const [eveningAmount, setEveningAmount] = useState(eveningDiff.amount || 0);

  // Sync when modal opens
  useEffect(() => {
    if (isOpen) {
      setMorningCashier(morningDiff.cashierName || shiftHandover?.morningCashier || '');
      setMorningType(morningDiff.type || 'exact');
      setMorningAmount(morningDiff.amount || 0);

      setEveningCashier(eveningDiff.cashierName || cashierName || shiftHandover?.eveningCashier || '');
      setEveningType(eveningDiff.type || 'exact');
      setEveningAmount(eveningDiff.amount || 0);
    }
  }, [isOpen, shiftDifferences, cashierName, shiftHandover]);

  if (!isOpen) return null;

  const applyFullToMorning = () => {
    const isShortage = calc.cashShortage > 0;
    const amount = Number((isShortage ? calc.cashShortage : calc.cashSurplus).toFixed(2));
    const type = isShortage ? 'shortage' : calc.cashSurplus > 0 ? 'surplus' : 'exact';

    const mCashier = morningCashier || 'قصي البدور';
    setMorningCashier(mCashier);
    setMorningType(type);
    setMorningAmount(amount);

    setEveningType('exact');
    setEveningAmount(0);
  };

  const applyFullToEvening = () => {
    const isShortage = calc.cashShortage > 0;
    const amount = Number((isShortage ? calc.cashShortage : calc.cashSurplus).toFixed(2));
    const type = isShortage ? 'shortage' : calc.cashSurplus > 0 ? 'surplus' : 'exact';

    const eCashier = eveningCashier || 'أمجد شحادات';
    setEveningCashier(eCashier);
    setEveningType(type);
    setEveningAmount(amount);

    setMorningType('exact');
    setMorningAmount(0);
  };

  const handleFinalConfirm = () => {
    if (hasDifference) {
      // Validate that if there's morning diff, cashier is chosen
      if (morningType !== 'exact' && morningAmount > 0 && !morningCashier.trim()) {
        toast.error('يرجى تحديد اسم الكاشير للشفت الصباحي لوجود فارق مسجل عليه');
        return;
      }
      // Validate that if there's evening diff, cashier is chosen
      if (eveningType !== 'exact' && eveningAmount > 0 && !eveningCashier.trim()) {
        toast.error('يرجى تحديد اسم الكاشير للشفت المسائي لوجود فارق مسجل عليه');
        return;
      }

      // If no split is entered but total discrepancy exists, require at least one assignment
      if (morningAmount <= 0 && eveningAmount <= 0 && (calc.cashShortage > 0.009 || calc.cashSurplus > 0.009)) {
        toast.error('يوجد نقص أو زيادة في الكاش، يرجى تحديد الشفت والكاشير المسؤول بالأسفل');
        return;
      }

      // Save shiftDifferences
      updateData(['shiftDifferences', 'morning'], {
        cashierName: morningCashier.trim(),
        type: morningType,
        amount: Number(morningAmount.toFixed(2)),
        notes: ''
      });

      updateData(['shiftDifferences', 'evening'], {
        cashierName: eveningCashier.trim(),
        type: eveningType,
        amount: Number(eveningAmount.toFixed(2)),
        notes: ''
      });

      if (eveningCashier.trim()) {
        updateData(['cashierName'], eveningCashier.trim());
      } else if (morningCashier.trim()) {
        updateData(['cashierName'], morningCashier.trim());
      }
    }

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
            <p className="text-xs text-gray-500 mt-0.5">فحص توازن الكاش وفوارق الشفتين قبل الإغلاق النهائي</p>
          </div>
        </div>

        {/* CASHIER & TWO SHIFT SELECTION: ONLY IF THERE IS SHORTAGE OR SURPLUS */}
        {hasDifference ? (
          <div className="mb-5 bg-gradient-to-br from-rose-50/90 to-indigo-50/60 border-2 border-rose-300 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs sm:text-sm font-extrabold text-rose-950 flex items-center gap-1.5">
                <UserCheck size={18} className="text-rose-600" />
                <span>
                  توثيق فوارق الكاش للشفتين ({calc.cashShortage > 0.009 ? `عجز إجمالي ${calc.cashShortage.toFixed(2)} د.أ` : `زيادة إجمالية ${calc.cashSurplus.toFixed(2)} د.أ`}):
                </span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={applyFullToMorning}
                  className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded text-[11px] font-bold transition-all shadow-xs"
                >
                  ⚡ كامل الفرق عالصباحي
                </button>
                <button
                  type="button"
                  onClick={applyFullToEvening}
                  className="px-2 py-0.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border border-indigo-300 rounded text-[11px] font-bold transition-all shadow-xs"
                >
                  ⚡ كامل الفرق عالمسائي
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* شفت صباحي */}
              <div className="p-2.5 bg-white border border-amber-200 rounded-lg space-y-1.5 shadow-xs">
                <span className="text-[11px] font-black text-amber-900 flex items-center gap-1">
                  <span>☀️</span>
                  <span>الشفت الصباحي</span>
                </span>
                <select
                  value={morningCashier}
                  onChange={(e) => setMorningCashier(e.target.value)}
                  className="w-full px-2 py-1 bg-amber-50/40 border border-amber-300 rounded text-xs font-bold text-gray-900 outline-none"
                >
                  <option value="">-- اختر كاشير الصباحي --</option>
                  <option value="قصي البدور">قصي البدور</option>
                  <option value="أمجد شحادات">أمجد شحادات</option>
                </select>
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={morningType}
                    onChange={(e) => setMorningType(e.target.value as any)}
                    className="w-full px-1.5 py-1 border border-gray-300 rounded text-xs font-bold text-gray-900"
                  >
                    <option value="exact">مطابق</option>
                    <option value="shortage">عجز</option>
                    <option value="surplus">زيادة</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={morningAmount || ''}
                    onChange={(e) => setMorningAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-1.5 py-1 border border-gray-300 rounded text-xs font-bold text-gray-900 text-center"
                  />
                </div>
              </div>

              {/* شفت مسائي */}
              <div className="p-2.5 bg-white border border-indigo-200 rounded-lg space-y-1.5 shadow-xs">
                <span className="text-[11px] font-black text-indigo-900 flex items-center gap-1">
                  <span>🌙</span>
                  <span>الشفت المسائي</span>
                </span>
                <select
                  value={eveningCashier}
                  onChange={(e) => setEveningCashier(e.target.value)}
                  className="w-full px-2 py-1 bg-indigo-50/40 border border-indigo-300 rounded text-xs font-bold text-gray-900 outline-none"
                >
                  <option value="">-- اختر كاشير المسائي --</option>
                  <option value="أمجد شحادات">أمجد شحادات</option>
                  <option value="قصي البدور">قصي البدور</option>
                </select>
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={eveningType}
                    onChange={(e) => setEveningType(e.target.value as any)}
                    className="w-full px-1.5 py-1 border border-gray-300 rounded text-xs font-bold text-gray-900"
                  >
                    <option value="exact">مطابق</option>
                    <option value="shortage">عجز</option>
                    <option value="surplus">زيادة</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={eveningAmount || ''}
                    onChange={(e) => setEveningAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-1.5 py-1 border border-gray-300 rounded text-xs font-bold text-gray-900 text-center"
                  />
                </div>
              </div>
            </div>

            <p className="text-[10px] text-gray-600 font-semibold text-center">
              سيتم توثيق فوارق كل شفت باسم الكاشير الخاص به في تقرير الكاشيرية.
            </p>
          </div>
        ) : (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-2 text-emerald-900 text-xs font-bold">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>الكاش مطابق تماماً (لا يوجد نقص أو زيادة) — لا يتطلب تحديد الكاشير أو الشفت.</span>
          </div>
        )}

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
                    className="shrink-0 flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
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
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors shadow-sm cursor-pointer"
              >
                العودة واستكمال البيانات
              </button>
              {onConfirmForceClose && (
                <button
                  type="button"
                  disabled={hasDifference && ((morningType !== 'exact' && morningAmount > 0 && !morningCashier.trim()) || (eveningType !== 'exact' && eveningAmount > 0 && !eveningCashier.trim()))}
                  onClick={handleFinalConfirm}
                  className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
              disabled={hasDifference && ((morningType !== 'exact' && morningAmount > 0 && !morningCashier.trim()) || (eveningType !== 'exact' && eveningAmount > 0 && !eveningCashier.trim()) || (morningAmount <= 0 && eveningAmount <= 0 && (calc.cashShortage > 0.009 || calc.cashSurplus > 0.009)))}
              onClick={handleFinalConfirm}
              className="w-full px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-xl font-bold text-sm transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <Sparkles size={18} />
              <span>
                {hasDifference
                  ? 'تأكيد توثيق فوارق الشفتين وإغلاق اليوم النهائي'
                  : 'تأكيد إغلاق الشفت النهائي (الكاش مطابق)'}
              </span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
