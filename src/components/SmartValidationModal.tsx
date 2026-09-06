import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ArrowLeft, ShieldAlert, Sparkles, UserCheck, AlertTriangle } from 'lucide-react';
import { useValidationStore } from '../store/useValidationStore';
import { useShiftStore } from '../store/useShiftStore';
import { useCalculations } from '../hooks/useCalculations';
import { cn } from '../lib/utils';
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

  const totalDiffAmount = calc.cashShortage > 0.009 
    ? Number(calc.cashShortage.toFixed(2)) 
    : calc.cashSurplus > 0.009 
    ? Number(calc.cashSurplus.toFixed(2)) 
    : 0;
  const totalDiffType = calc.cashShortage > 0.009 ? 'shortage' : calc.cashSurplus > 0.009 ? 'surplus' : 'exact';

  const hasDifference = totalDiffAmount > 0.009 || morningDiff.amount > 0 || eveningDiff.amount > 0;

  const isInitiallySplit = (morningDiff.amount > 0 && eveningDiff.amount > 0) || morningDiff.notes === 'تقسيم' || eveningDiff.notes === 'تقسيم';
  const [assignMode, setAssignMode] = useState<'single' | 'split'>(isInitiallySplit ? 'split' : 'single');

  const [morningCashier, setMorningCashier] = useState(morningDiff.cashierName || shiftHandover?.morningCashier || '');
  const [morningType, setMorningType] = useState(morningDiff.type || totalDiffType);
  const [morningAmount, setMorningAmount] = useState(morningDiff.amount || 0);

  const [eveningCashier, setEveningCashier] = useState(eveningDiff.cashierName || cashierName || shiftHandover?.eveningCashier || '');
  const [eveningType, setEveningType] = useState(eveningDiff.type || totalDiffType);
  const [eveningAmount, setEveningAmount] = useState(eveningDiff.amount || 0);

  // Sync when modal opens
  useEffect(() => {
    if (isOpen) {
      const isSplit = (morningDiff.amount > 0 && eveningDiff.amount > 0) || morningDiff.notes === 'تقسيم' || eveningDiff.notes === 'تقسيم';
      setAssignMode(isSplit ? 'split' : 'single');

      const defaultMorning = morningDiff.cashierName || shiftHandover?.morningCashier || 'قصي البدور';
      const isQusayMorning = defaultMorning.includes('قصي');
      const defaultEvening = eveningDiff.cashierName || cashierName?.replace(/\s*\(.*?\)/, '') || shiftHandover?.eveningCashier || (isQusayMorning ? 'أمجد شحادات' : 'قصي البدور');

      setMorningCashier(defaultMorning);
      setMorningType(morningDiff.type || totalDiffType);
      setMorningAmount(morningDiff.amount || 0);

      setEveningCashier(defaultEvening);
      setEveningType(eveningDiff.type || totalDiffType);
      setEveningAmount(eveningDiff.amount || (isSplit ? 0 : totalDiffAmount));
    }
  }, [isOpen, shiftDifferences, cashierName, shiftHandover, totalDiffAmount, totalDiffType]);

  if (!isOpen) return null;

  // إسناد كامل المبلغ لكاشير وشفت محدد
  const handleAssignSingle = (name: string, shift: 'صباحي' | 'مسائي') => {
    const isQusay = name.includes('قصي');
    const otherName = isQusay ? 'أمجد شحادات' : 'قصي البدور';

    setAssignMode('single');
    if (shift === 'صباحي') {
      setMorningCashier(name);
      setMorningType(totalDiffType);
      setMorningAmount(totalDiffAmount);

      setEveningCashier(otherName);
      setEveningType('exact');
      setEveningAmount(0);
    } else {
      setMorningCashier(otherName);
      setMorningType('exact');
      setMorningAmount(0);

      setEveningCashier(name);
      setEveningType(totalDiffType);
      setEveningAmount(totalDiffAmount);
    }
  };

  // تقسيم بالتساوي 50% / 50%
  const handleSplitFiftyFifty = () => {
    setAssignMode('split');
    const half = Number((totalDiffAmount / 2).toFixed(2));
    const remainder = Number((totalDiffAmount - half).toFixed(2));
    
    const mName = morningCashier || 'قصي البدور';
    const isQusay = mName.includes('قصي');
    const eName = eveningCashier || (isQusay ? 'أمجد شحادات' : 'قصي البدور');

    setMorningCashier(mName);
    setMorningType(totalDiffType);
    setMorningAmount(half);

    setEveningCashier(eName);
    setEveningType(totalDiffType);
    setEveningAmount(remainder);
  };

  // وضع الباقي لكاشير 2
  const handleAssignRemainderToEvening = () => {
    const rem = Math.max(0, Number((totalDiffAmount - (morningAmount || 0)).toFixed(2)));
    setEveningAmount(rem);
    setEveningType(totalDiffType);
  };

  const handleFinalConfirm = () => {
    if (hasDifference) {
      if (assignMode === 'single') {
        const isMorning = morningAmount > 0;
        if (isMorning) {
          updateData(['shiftDifferences', 'morning'], {
            cashierName: morningCashier.trim(),
            type: totalDiffType,
            amount: totalDiffAmount,
            notes: 'صباحي'
          });
          updateData(['shiftDifferences', 'evening'], {
            cashierName: eveningCashier.trim(),
            type: 'exact',
            amount: 0,
            notes: 'مسائي'
          });
          updateData(['cashierName'], `${morningCashier.trim()} (صباحي)`);
        } else {
          updateData(['shiftDifferences', 'morning'], {
            cashierName: morningCashier.trim(),
            type: 'exact',
            amount: 0,
            notes: 'صباحي'
          });
          updateData(['shiftDifferences', 'evening'], {
            cashierName: eveningCashier.trim(),
            type: totalDiffType,
            amount: totalDiffAmount,
            notes: 'مسائي'
          });
          updateData(['cashierName'], `${eveningCashier.trim()} (مسائي)`);
        }
      } else {
        // Mode split
        if (morningAmount > 0 && !morningCashier.trim()) {
          toast.error('يرجى تحديد اسم كاشير 1');
          return;
        }
        if (eveningAmount > 0 && !eveningCashier.trim()) {
          toast.error('يرجى تحديد اسم كاشير 2');
          return;
        }
        if (morningAmount <= 0 && eveningAmount <= 0) {
          toast.error('يرجى إدخال مبالغ التقسيم بين الكاشيرين');
          return;
        }

        updateData(['shiftDifferences', 'morning'], {
          cashierName: morningCashier.trim(),
          type: morningAmount > 0 ? morningType : 'exact',
          amount: Number((morningAmount || 0).toFixed(2)),
          notes: 'صباحي'
        });

        updateData(['shiftDifferences', 'evening'], {
          cashierName: eveningCashier.trim(),
          type: eveningAmount > 0 ? eveningType : 'exact',
          amount: Number((eveningAmount || 0).toFixed(2)),
          notes: 'مسائي'
        });

        updateData(['cashierName'], `${morningCashier.trim()} (${morningAmount} د.أ صباحي) + ${eveningCashier.trim()} (${eveningAmount} د.أ مسائي)`);
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
            <p className="text-xs text-gray-500 mt-0.5">فحص توازن الكاش وتوثيق الفوارق على الكاشيرية</p>
          </div>
        </div>

        {/* CASHIER & TWO SHIFT SELECTION: ONLY IF THERE IS SHORTAGE OR SURPLUS */}
        {hasDifference ? (
          <div className={cn(
            "mb-5 p-4 rounded-2xl space-y-3.5 border-2 shadow-sm",
            totalDiffType === 'shortage'
              ? "bg-gradient-to-br from-rose-50/90 via-rose-50/50 to-orange-50/40 border-rose-300"
              : "bg-gradient-to-br from-emerald-50/90 via-emerald-50/50 to-teal-50/40 border-emerald-300"
          )}>
            {/* رأس اللوحة - إشارة واضحة لموجب أو سالب الكاش */}
            <div className="flex items-center justify-between flex-wrap gap-2 border-b pb-2.5 border-gray-200/80">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "p-2 rounded-xl text-white font-black text-xs flex items-center gap-1",
                  totalDiffType === 'shortage' ? "bg-rose-600 shadow-rose-200" : "bg-emerald-600 shadow-emerald-200"
                )}>
                  {totalDiffType === 'shortage' ? '🔻 عجز كاش (سالب)' : '🔺 زيادة كاش (موجب)'}
                </span>
                <span className="text-sm sm:text-base font-black text-gray-900" dir="ltr">
                  {totalDiffType === 'shortage' ? '-' : '+'}{totalDiffAmount.toFixed(2)} د.أ
                </span>
              </div>
              <span className="text-xs font-extrabold text-gray-700">
                يرجى تحديد الشفت والكاشير المسؤول:
              </span>
            </div>

            {/* أزرار التبديل: كاشير واحد أم الكاشيرين مجتمعين */}
            <div className="flex items-center bg-white p-1 rounded-xl border border-rose-200 shadow-xs">
              <button
                type="button"
                onClick={() => {
                  const currentC = morningAmount > 0 ? morningCashier : (eveningCashier || 'قصي البدور');
                  const currentS = morningAmount > 0 ? 'صباحي' : 'مسائي';
                  handleAssignSingle(currentC || 'قصي البدور', currentS);
                }}
                className={cn(
                  "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center",
                  assignMode === 'single'
                    ? "bg-indigo-600 text-white shadow-xs font-black"
                    : "text-gray-600 hover:text-indigo-700"
                )}
              >
                👤 عند أحد الكاشيرين (كامل المبلغ)
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSplitFiftyFifty();
                }}
                className={cn(
                  "flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center",
                  assignMode === 'split'
                    ? "bg-indigo-600 text-white shadow-xs font-black"
                    : "text-gray-600 hover:text-indigo-700"
                )}
              >
                👥 عند الكاشيرين مجتمعين (تحديد مبلغ كل كاشير)
              </button>
            </div>

            {/* الوضع 1: عند أحد الكاشيرين */}
            {assignMode === 'single' ? (
              <div className="bg-white p-3.5 border border-indigo-200 rounded-xl space-y-2.5 shadow-xs">
                <span className="text-xs font-bold text-gray-700 block">
                  اختر الكاشير والشفت الذي ظهر عنده {totalDiffType === 'shortage' ? 'النقص' : 'الزيادة'} ({totalDiffAmount.toFixed(2)} د.أ):
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAssignSingle('قصي البدور', 'صباحي')}
                    className={cn(
                      "p-2.5 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer",
                      (morningCashier === 'قصي البدور' && morningAmount > 0)
                        ? "bg-amber-50 border-amber-500 text-amber-950 font-black ring-2 ring-amber-300"
                        : "bg-gray-50/80 border-gray-200 hover:bg-amber-50/50 text-gray-800"
                    )}
                  >
                    <span className="text-xs font-black">☀️ قصي البدور</span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">شفت صباحي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAssignSingle('قصي البدور', 'مسائي')}
                    className={cn(
                      "p-2.5 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer",
                      (eveningCashier === 'قصي البدور' && eveningAmount > 0)
                        ? "bg-indigo-50 border-indigo-500 text-indigo-950 font-black ring-2 ring-indigo-300"
                        : "bg-gray-50/80 border-gray-200 hover:bg-indigo-50/50 text-gray-800"
                    )}
                  >
                    <span className="text-xs font-black">🌙 قصي البدور</span>
                    <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">شفت مسائي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAssignSingle('أمجد شحادات', 'صباحي')}
                    className={cn(
                      "p-2.5 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer",
                      (morningCashier === 'أمجد شحادات' && morningAmount > 0)
                        ? "bg-amber-50 border-amber-500 text-amber-950 font-black ring-2 ring-amber-300"
                        : "bg-gray-50/80 border-gray-200 hover:bg-amber-50/50 text-gray-800"
                    )}
                  >
                    <span className="text-xs font-black">☀️ أمجد شحادات</span>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">شفت صباحي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAssignSingle('أمجد شحادات', 'مسائي')}
                    className={cn(
                      "p-2.5 rounded-xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer",
                      (eveningCashier === 'أمجد شحادات' && eveningAmount > 0)
                        ? "bg-indigo-50 border-indigo-500 text-indigo-950 font-black ring-2 ring-indigo-300"
                        : "bg-gray-50/80 border-gray-200 hover:bg-indigo-50/50 text-gray-800"
                    )}
                  >
                    <span className="text-xs font-black">🌙 أمجد شحادات</span>
                    <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded">شفت مسائي</span>
                  </button>
                </div>

                <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-center text-emerald-950 font-bold">
                  ✅ سيتم توثيق كامل الفارق ({totalDiffAmount.toFixed(2)} د.أ) على:{' '}
                  <strong className="text-emerald-900 font-black">
                    {morningAmount > 0 ? `${morningCashier} (شفت صباحي)` : `${eveningCashier} (شفت مسائي)`}
                  </strong>
                </div>
              </div>
            ) : (
              /* الوضع 2: تفاصيل التقسيم على كاشيرين */
              <div className="space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-1.5 bg-indigo-100/70 p-2 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={handleSplitFiftyFifty}
                    className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-950 border border-indigo-300 rounded font-black text-[11px] cursor-pointer"
                  >
                    ⚡ تقسيم 50% / 50%
                  </button>

                  {(() => {
                    const sum = Number(((morningAmount || 0) + (eveningAmount || 0)).toFixed(2));
                    const rem = Number((totalDiffAmount - sum).toFixed(2));
                    return Math.abs(rem) < 0.01 ? (
                      <span className="text-emerald-800 font-black text-[11px]">✔️ المجموع موزع بالكامل ({sum.toFixed(2)} د.أ)</span>
                    ) : rem > 0 ? (
                      <div className="flex items-center gap-1">
                        <span className="text-amber-800 font-bold text-[11px]">متبقي: {rem.toFixed(2)} د.أ</span>
                        <button
                          type="button"
                          onClick={handleAssignRemainderToEvening}
                          className="px-1.5 py-0.5 bg-amber-500 text-white rounded text-[10px] font-bold cursor-pointer"
                        >
                          + وضعه لكاشير 2
                        </button>
                      </div>
                    ) : (
                      <span className="text-rose-800 font-bold text-[11px]">⚠️ زائد بـ {Math.abs(rem).toFixed(2)} د.أ</span>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* كاشير 1 */}
                  <div className="p-2.5 bg-white border border-amber-200 rounded-lg space-y-1.5 shadow-xs">
                    <span className="text-[11px] font-black text-amber-900 flex items-center gap-1">
                      <span>👤</span>
                      <span>كاشير 1</span>
                    </span>
                    <select
                      value={morningCashier}
                      onChange={(e) => setMorningCashier(e.target.value)}
                      className="w-full px-2 py-1 bg-amber-50/40 border border-amber-300 rounded text-xs font-bold text-gray-900 outline-none"
                    >
                      <option value="">-- اختر كاشير 1 --</option>
                      <option value="قصي البدور">قصي البدور</option>
                      <option value="أمجد شحادات">أمجد شحادات</option>
                    </select>
                    <div className="grid grid-cols-2 gap-1.5">
                      <select
                        value={morningType}
                        onChange={(e) => setMorningType(e.target.value as any)}
                        className="w-full px-1.5 py-1 border border-gray-300 rounded text-xs font-bold text-gray-900"
                      >
                        <option value="shortage">عجز</option>
                        <option value="surplus">زيادة</option>
                        <option value="exact">مطابق</option>
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={morningAmount || ''}
                        onChange={(e) => setMorningAmount(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full px-1.5 py-1 border-2 border-amber-300 rounded text-xs font-black text-gray-900 text-center"
                      />
                    </div>
                  </div>

                  {/* كاشير 2 */}
                  <div className="p-2.5 bg-white border border-indigo-200 rounded-lg space-y-1.5 shadow-xs">
                    <span className="text-[11px] font-black text-indigo-900 flex items-center gap-1">
                      <span>👤</span>
                      <span>كاشير 2</span>
                    </span>
                    <select
                      value={eveningCashier}
                      onChange={(e) => setEveningCashier(e.target.value)}
                      className="w-full px-2 py-1 bg-indigo-50/40 border border-indigo-300 rounded text-xs font-bold text-gray-900 outline-none"
                    >
                      <option value="">-- اختر كاشير 2 --</option>
                      <option value="أمجد شحادات">أمجد شحادات</option>
                      <option value="قصي البدور">قصي البدور</option>
                    </select>
                    <div className="grid grid-cols-2 gap-1.5">
                      <select
                        value={eveningType}
                        onChange={(e) => setEveningType(e.target.value as any)}
                        className="w-full px-1.5 py-1 border border-gray-300 rounded text-xs font-bold text-gray-900"
                      >
                        <option value="shortage">عجز</option>
                        <option value="surplus">زيادة</option>
                        <option value="exact">مطابق</option>
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={eveningAmount || ''}
                        onChange={(e) => setEveningAmount(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full px-1.5 py-1 border-2 border-indigo-300 rounded text-xs font-black text-gray-900 text-center"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <p className="text-[10px] text-gray-600 font-semibold text-center">
              سيتم توثيق فوارق كل كاشير بدقة وترحيلها لتقرير الكاشيرية.
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
              disabled={hasDifference && (
                (assignMode === 'single' && !morningCashier?.trim() && !eveningCashier?.trim()) ||
                (assignMode === 'single' && morningAmount <= 0 && eveningAmount <= 0) ||
                (assignMode === 'split' && morningAmount > 0 && !morningCashier?.trim()) ||
                (assignMode === 'split' && eveningAmount > 0 && !eveningCashier?.trim()) ||
                (assignMode === 'split' && morningAmount <= 0 && eveningAmount <= 0)
              )}
              onClick={handleFinalConfirm}
              className="w-full px-5 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-xl font-bold text-sm transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <Sparkles size={18} />
              <span>
                {hasDifference
                  ? 'تأكيد توثيق فوارق الكاشير وإغلاق الشفت'
                  : 'تأكيد إغلاق الشفت النهائي (الكاش مطابق)'}
              </span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
