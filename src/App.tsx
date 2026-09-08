import React, { useEffect, useState, useMemo } from 'react';
import { Menu, X, Calendar, ChevronLeft, ShieldAlert, ArrowRightLeft, HandCoins, AlertCircle, Lock, Unlock, Printer, Trash2, CheckCircle2 } from 'lucide-react';
import { useShiftStore } from './store/useShiftStore';
import { useCalculations } from './hooks/useCalculations';
import { useValidationStore } from './store/useValidationStore';
import { DynamicList } from './components/ui';
import { ActualInventorySection, CashDataSection } from './components/sections';
import { KitchenConsumptionSection, ProductionInventorySection, EmployeeAdvancesSection } from './components/sections2';
import { CustodySection } from './components/CustodySection';
import { ExportButtons } from './components/ExportButtons';
import { SmartValidationModal } from './components/SmartValidationModal';
import { LogoUpload } from './components/LogoUpload';
import { CashierDeficitModal } from './components/CashierDeficitModal';
import { ShiftHandoverModal } from './components/ShiftHandoverModal';
import { ExportableA4Report } from './components/ExportableA4Report';
import { Toaster, toast } from 'react-hot-toast';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';
import { db } from './lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { exportToImage, printDocument, getDayLabel } from './lib/exportUtils';
import { cn } from './lib/utils';
import restaurantLogo from './assets/logo.jpeg';
import { ExportHeader, ExportFooter } from './components/ReportHeaderFooter';

function App() {
  const { 
    data, isLoading, initSync, updateData, setShiftDate, fetchSavedDates, savedDates, 
    deleteReport, closeShift, reopenShift, previousDayActualCash 
  } = useShiftStore();
  const calc = useCalculations();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showDeficitModal, setShowDeficitModal] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);

  const errors = useValidationStore(state => state.errors);
  const triggerValidation = useValidationStore(state => state.triggerValidation);
  const clearError = useValidationStore(state => state.clearError);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  let daysDiff = 0;
  try {
    daysDiff = differenceInCalendarDays(parseISO(todayStr), parseISO(data.date));
  } catch {
    daysDiff = 0;
  }

  // Check if shift startup requirements are met (Date, Day, and Opening Cash entered)
  const isShiftStarted = Boolean(
    data.date && 
    (data.cashAndSales.openingCash !== undefined && data.cashAndSales.openingCash !== null && String(data.cashAndSales.openingCash) !== '')
  );

  // Editable rule: Only reports less than or equal to 3 days old (0, 1, 2, 3 days ago)
  const isWithin3Days = daysDiff <= 3;
  const isLockedByAge = !isWithin3Days;
  const isReadOnly = isLockedByAge || data.isClosed;

  useEffect(() => {
    const preventScrollNumberChange = (e: WheelEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'number') {
        target.blur();
      }
    };
    window.addEventListener('wheel', preventScrollNumberChange, { passive: true });
    return () => window.removeEventListener('wheel', preventScrollNumberChange);
  }, []);

  useEffect(() => {
    fetchSavedDates();
    const unsubscribe = initSync();
    return () => unsubscribe();
  }, [initSync, data.date, fetchSavedDates]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Print Shortcut: Ctrl+P / Cmd+P
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        printDocument();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const shiftDoc = doc(db, 'shifts', data.date);
        setDoc(shiftDoc, data, { merge: true }).then(() => {
          toast.success('تم حفظ التغييرات في قاعدة البيانات بنجاح (Ctrl+S)');
        }).catch((err) => {
          console.error(err);
          toast.error('حدث خطأ أثناء الحفظ');
        });
        return;
      }

      if (isReadOnly) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'SELECT') {
          if (e.key === 'Enter' && e.shiftKey) return;
          
          const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]), select')) as HTMLElement[];
          const index = inputs.indexOf(target);
          if (index > -1) {
            e.preventDefault();
            let nextIndex = index;
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
              nextIndex = index + 1;
            } else if (e.key === 'ArrowUp') {
              nextIndex = index - 1;
            }
            if (nextIndex >= 0 && nextIndex < inputs.length) {
              inputs[nextIndex].focus();
            }
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isReadOnly, data]);

  const performShiftClose = () => {
    closeShift();
    toast.success('تم إغلاق الشفت بنجاح ✅');
    
    const loadingToast = toast.loading('جاري تجهيز الصورتين (إغلاق الكاش + إغلاق جدول الموظفين)...');
    try {
      exportToImage(data.date, 'both').then(() => {
        toast.success('تم تصدير صورة إغلاق الكاش وصورة إغلاق جدول الموظفين بنجاح ✅', { id: loadingToast });
      });
    } catch (error) {
      toast.error('حدث خطأ أثناء تصدير الصور', { id: loadingToast });
    }
  };

  const baseMerchantSuggestions = [
    "شعبان", "رفاعي", "حبيبه", "نوافله", "ابو جليل", "العناني", "ابو المجد", "عصاصفه",
    "ملفوف", "خضار", "ثلج", "بطاطا", "ثوم", "فحم", "منظفات", "خس", "خبز الشيخ", "خبز بروستد"
  ];
  
  const ohdaSuggestions = [
    "عهده سيف", "عهده الزعبي", "عهده سعد", "عهده نابلسي", "عهده يحيى"
  ];

  // Saved custom merchant suggestions state (persisted in localStorage)
  const [customMerchantSuggestions, setCustomMerchantSuggestions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('custom_merchant_suggestions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Automatically record any new merchant/purchase statement typed in reports
  useEffect(() => {
    const newLabels = new Set<string>();
    const checkAndAdd = (items: Array<{ label: string }> | undefined) => {
      items?.forEach(item => {
        const trimmed = item?.label?.trim();
        if (trimmed && trimmed.length > 1 && !baseMerchantSuggestions.includes(trimmed)) {
          newLabels.add(trimmed);
        }
      });
    };

    checkAndAdd(data.purchases);
    checkAndAdd(data.payMerchantReceivables);
    checkAndAdd(data.addMerchantReceivables);

    if (newLabels.size > 0) {
      setCustomMerchantSuggestions(prev => {
        const merged = Array.from(new Set([...prev, ...Array.from(newLabels)]));
        if (merged.length !== prev.length) {
          try {
            localStorage.setItem('custom_merchant_suggestions', JSON.stringify(merged));
          } catch (e) {
            console.error('Failed to save custom merchant suggestions', e);
          }
          return merged;
        }
        return prev;
      });
    }
  }, [data.purchases, data.payMerchantReceivables, data.addMerchantReceivables]);

  // Dynamic merchant suggestions merging base and user-typed items
  const dynamicMerchantSuggestions = useMemo(() => {
    return Array.from(new Set([...baseMerchantSuggestions, ...customMerchantSuggestions]));
  }, [customMerchantSuggestions]);

  const purchasesSuggestions = useMemo(() => {
    return Array.from(new Set([...dynamicMerchantSuggestions, ...ohdaSuggestions]));
  }, [dynamicMerchantSuggestions]);

  const personalSuggestions = ["اوردر", "اغراض"];
  const adminSuggestions = ["ضمان", "كهرباء", "فاتورة نت", "فاتورة اتصال", "ضيافة", "رعاية", "قرطاسية"];
  const spiceSuggestions = ["بهارات شاورما", "كبا", "مشكل", "جنات", "قشرة", "شطة زبدة", "مدخن ملونين", "بطاطا", "صبغة حا", "صبغة رز"];
  const otherExpensesSuggestions = [...ohdaSuggestions];

  const allDynamicListsConfigs = [
    { key: 'purchases', title: 'مشتريات', total: calc.purchasesTotal, suggestions: purchasesSuggestions },
    { key: 'payMerchantReceivables', title: 'سداد ذمم تجار', total: calc.payMerchantTotal, suggestions: dynamicMerchantSuggestions },
    { key: 'otherExpenses', title: 'مصاريف أخرى', total: calc.otherExpensesTotal, suggestions: otherExpensesSuggestions },
    { key: 'apartment', title: 'الشقة', total: calc.apartmentTotal, suggestions: personalSuggestions },
    { key: 'adminExpenses', title: 'مصاريف إدارية', total: calc.adminExpensesTotal, suggestions: adminSuggestions },
    { key: 'abuAbdullah', title: 'أبو عبدالله', total: calc.abuAbdullahTotal },
    { key: 'equipment', title: 'معدات وصيانة', total: calc.equipmentTotal },
    { key: 'ewallet', title: 'المحفظة الإلكترونية', total: calc.ewalletTotal, hideLabel: true, className: 'print:hidden' },
    { key: 'addMerchantReceivables', title: 'إضافة ذمم تجار', total: calc.addMerchantTotal, suggestions: dynamicMerchantSuggestions },
    { key: 'yahya', title: 'يحيى', total: calc.yahyaTotal, suggestions: personalSuggestions },
    { key: 'spices', title: 'بهارات', total: calc.spicesTotal, suggestions: spiceSuggestions },
  ];

  const weekdays = [
    { label: 'الجمعة', value: 5 },
    { label: 'السبت', value: 6 },
    { label: 'الأحد', value: 0 },
    { label: 'الاثنين', value: 1 },
    { label: 'الثلاثاء', value: 2 },
    { label: 'الأربعاء', value: 3 },
    { label: 'الخميس', value: 4 },
  ];

  const currentDayLabel = weekdays.find(w => w.value === new Date(data.date).getDay())?.label || getDayLabel(data.date);

  // Helper to adjust date when a day of week is explicitly selected
  const handleDaySelect = (targetDayIndex: number) => {
    try {
      const current = parseISO(data.date);
      const currentDay = current.getDay();
      let diff = targetDayIndex - currentDay;
      // Adjust to closest past/present matching day (within 7 days)
      if (diff > 0) diff -= 7;
      const newDate = new Date(current);
      newDate.setDate(current.getDate() + diff);
      setShiftDate(format(newDate, 'yyyy-MM-dd'));
    } catch {
      // Fallback
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">جاري التحميل...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900" dir="rtl" id="report-content">
      <Toaster position="top-center" reverseOrder={false} />
      
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          data-html2canvas-ignore="true"
          className="fixed inset-0 bg-black/50 z-40 transition-opacity print:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        data-html2canvas-ignore="true"
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col print:hidden ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="text-blue-600" />
            التقارير السابقة
          </h2>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Quick Tools */}
          <div className="space-y-2 mb-4 pb-4 border-b">
            <button
              onClick={() => {
                setShowDeficitModal(true);
                setIsSidebarOpen(false);
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold border border-rose-200 transition-colors text-sm cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} />
                <span>تقرير الكاشيرية (عجز وزيادة)</span>
              </div>
              <span className="text-[11px] bg-rose-200/80 text-rose-900 px-2 py-0.5 rounded-full font-black">من 5/9</span>
            </button>
            <button
              onClick={() => {
                setShowHandoverModal(true);
                setIsSidebarOpen(false);
              }}
              className="w-full flex items-center gap-2 p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 transition-colors text-sm cursor-pointer"
            >
              <ArrowRightLeft size={18} />
              <span>تسليم الشفت (صباحي ➔ مسائي)</span>
            </button>
          </div>

          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">التقارير السابقة</h3>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
              تلقائي 1 كل شهر 🧹
            </span>
          </div>

          <div className="p-2 mb-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 leading-relaxed">
            💡 يتم أرشفة وتنظيف التقارير تلقائياً في 1 من كل شهر مع الحفاظ على التقرير المعتمد.
          </div>

          {savedDates.length === 0 ? (
            <div className="text-center text-gray-500 py-8">لا توجد تقارير سابقة</div>
          ) : (
            <div className="space-y-1.5">
              {savedDates.map(d => (
                <div 
                  key={d}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                    data.date === d 
                      ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' 
                      : 'bg-white hover:bg-gray-50 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <button
                    onClick={() => {
                      setShiftDate(d);
                      setIsSidebarOpen(false);
                    }}
                    className="flex-1 flex items-center justify-between text-right cursor-pointer"
                  >
                    <span>{d}</span>
                    <ChevronLeft size={16} className={data.date === d ? "text-blue-500" : "text-gray-400"} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`هل أنت تأكد من حذف تقرير تاريخ ${d}؟`)) {
                        deleteReport(d);
                        toast.success(`تم حذف تقرير ${d} بنجاح`);
                      }
                    }}
                    className="mr-2 text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors cursor-pointer"
                    title="حذف التقرير"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CashierDeficitModal isOpen={showDeficitModal} onClose={() => setShowDeficitModal(false)} />
      <ShiftHandoverModal isOpen={showHandoverModal} onClose={() => setShowHandoverModal(false)} />
      <SmartValidationModal 
        isOpen={showValidationModal} 
        onClose={() => setShowValidationModal(false)}
        onConfirmForceClose={performShiftClose}
      />

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        
        {/* Actions Bar */}
        <div className="flex justify-end print:hidden mb-4" data-html2canvas-ignore="true">
          <ExportButtons />
        </div>

        {/* Header */}
        <header className="bg-white p-6 rounded-xl shadow-sm border mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative">
          {isReadOnly && (
            <div className="absolute top-0 right-0 left-0 bottom-0 pointer-events-none rounded-xl bg-gray-50/20 border-2 border-amber-400/50 flex items-center justify-center z-0 overflow-hidden print:hidden">
               <span className="text-5xl md:text-7xl font-black text-amber-500/20 transform -rotate-12 whitespace-nowrap">للقراءة فقط - التقرير مغلق</span>
            </div>
          )}
          <div className="flex items-center gap-4 z-10">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              data-html2canvas-ignore="true"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors print:hidden"
              title="التقارير السابقة"
            >
              <Menu size={24} />
            </button>
            <LogoUpload />
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-gray-800">مطعم يحيى البيك - تقرير إغلاق الكاش اليومي</h1>
              {isLockedByAge && (
                <span className="text-xs font-bold text-slate-500 mt-1 print:hidden flex items-center gap-1">
                  <Lock size={12} />
                  مؤرشف (مضى عليه أكثر من 3 أيام - غير قابل للتعديل)
                </span>
              )}
              {!isLockedByAge && data.isClosed && (
                <span className="text-xs font-bold text-amber-600 mt-1 print:hidden flex items-center gap-1">
                  <Lock size={12} />
                  مغلق (متاح لإعادة الفتح والتعديل لأنه ضمن مهلة 3 أيام)
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 z-10">
            {/* 1. Day of Week Dropdown */}
            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border print:border-none print:p-0">
              <span className="text-gray-500 font-medium text-xs sm:text-sm">اليوم:</span>
              <select
                disabled={isReadOnly}
                value={new Date(data.date).getDay()}
                onChange={(e) => handleDaySelect(Number(e.target.value))}
                className="bg-transparent font-bold text-gray-800 text-xs sm:text-sm outline-none cursor-pointer disabled:cursor-default"
              >
                {weekdays.map((w) => (
                  <option key={w.value} value={w.value} className="text-gray-900 bg-white">
                    {w.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Date Picker */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs sm:text-sm text-gray-600 font-medium">التاريخ:</label>
              <input 
                type="date" 
                lang="en-US"
                dir="ltr"
                value={data.date}
                disabled={isReadOnly}
                onChange={(e) => setShiftDate(e.target.value)}
                className="px-2.5 py-1.5 border rounded-lg text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium print:font-bold print:border-none print:p-0"
              />
            </div>

            {/* 3. Opening Cash (Header Direct Input) */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs sm:text-sm text-gray-600 font-medium">النقد الافتتاحي:</label>
              <div className="flex items-center gap-1">
                <input 
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  dir="ltr"
                  disabled={isReadOnly}
                  value={data.cashAndSales.openingCash || ''}
                  onFocus={(e) => e.target.select()}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    updateData(['cashAndSales', 'openingCash'], val);
                    if (errors['cashData']) {
                      clearError('cashData');
                    }
                  }}
                  placeholder="0.00"
                  className="w-24 px-2.5 py-1.5 border rounded-lg text-xs sm:text-sm font-extrabold text-center text-indigo-900 bg-amber-50/50 border-amber-200 outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all print:font-bold print:border-none print:p-0"
                />
                {previousDayActualCash > 0 && (
                  <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => {
                      updateData(['cashAndSales', 'openingCash'], previousDayActualCash);
                      toast.success(`تم اختيار النقد الافتتاحي (${previousDayActualCash} د.أ) بناءً على النقد الفعلي لليوم السابق`);
                    }}
                    className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-md text-[11px] font-bold transition-colors cursor-pointer print:hidden shrink-0"
                    title="انقر لتطبيق النقد الفعلي لاليوم السابق كـ نقد افتتاحي"
                  >
                    ⚡ السابق: {previousDayActualCash} د.أ
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* 3-Day Editability / Reopen Notice Banner */}
        {data.isClosed && isWithin3Days && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-amber-900 shadow-xs print:hidden">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="text-amber-600 shrink-0" size={20} />
              <div>
                <p className="font-bold">الشفت مغلق حالياً، لكنه متاح للتعديل لأنه مضى عليه أقل من 3 أيام.</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  (متبقي {Math.max(0, 3 - Math.max(0, daysDiff))} يوم للتعديل قبل الأرشفة الدائمة). يمكنك الضغط على الزر لفتحه وإجراء التعديلات.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                reopenShift();
                toast.success('تمت إعادة فتح الشفت للتعديل بنجاح 🔓');
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors shrink-0 shadow-xs"
            >
              <Unlock size={14} />
              <span>إعادة فتح الشفت للتعديل</span>
            </button>
          </div>
        )}

        {/* Require Shift Startup Info Before Unlocking Inventory & Tables */}
        {!isReadOnly && !isShiftStarted && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 flex items-center gap-3 text-blue-900 shadow-sm print:hidden">
            <AlertCircle className="text-blue-600 shrink-0" size={24} />
            <div>
              <p className="font-bold text-base">يرجى استكمال بيانات بدء الشفت أولاً لفتح الجداول والإدخال</p>
              <p className="text-xs text-blue-700 mt-1">
                يتم فتح الشفت والبدء بالجرد فور تحديد: <span className="font-bold underline">اليوم والتاريخ</span>، وإدخال أو تأكيد <span className="font-bold underline">النقد الافتتاحي</span> يدوياً في الشريط العلوي (ويتم تحديد الكاشير إدبارياً عند الإغلاق الكامل بنهاية اليوم).
              </p>
            </div>
          </div>
        )}

        {isLockedByAge && (
          <div className="bg-slate-100 border border-slate-300 rounded-xl p-4 flex items-center gap-2.5 text-sm text-slate-700 shadow-xs print:hidden">
            <Lock className="text-slate-500 shrink-0" size={20} />
            <div>
              <p className="font-bold">تقرير مؤرشف ومقفل نهائياً</p>
              <p className="text-xs text-slate-500 mt-0.5">
                مضى على هذا التقرير أكثر من 3 أيام ({daysDiff} يوم)، لذا تم قفله نهائياً للحفاظ على سلامة السجلات، ويتاح فقط للعرض والطباعة.
              </p>
            </div>
          </div>
        )}

        <div className={`transition-opacity duration-300 print:opacity-100 print:pointer-events-auto print:select-text ${isReadOnly || (!isShiftStarted && !data.isClosed) ? 'pointer-events-none opacity-50 select-none' : ''}`}>
          
          {/* Custody (العهدة - الكاش الخارج والعائد - أعلى الصفحة داخلي فقط) */}
          <div className="mb-4 print:hidden">
            <CustodySection />
          </div>

          {/* Main Cash and Inventory Tables Container for Image Export 1 */}
          <div id="cash-report-export" className="space-y-6">
            {/* Export Header Banner for Cash Report */}
            <ExportHeader
              id="export-header-cash"
              title="مطعم يحيى البيك - تقرير إغلاق الكاش اليومي"
              date={data.date}
              dayLabel={currentDayLabel}
              className="hidden print:block"
            />

            <div id="cash-report-content" className="space-y-6">
              {/* Top Grid: 4 columns in screen mode, 2 wide columns in Print / Image Export */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 print:grid-cols-2 print:gap-3 export-grid-2">
              
                {/* 1. Column 1: Main Summaries (Cash & Sales Data + Actual Inventory Summary stacked on top of each other) */}
                <div className="space-y-4 print:space-y-3 export-space-y">
                  <CashDataSection />
                  <ActualInventorySection />
                </div>

                {/* 2. Dynamic Tables */}
                {allDynamicListsConfigs.map((cfg) => (
                  <DynamicList
                    key={cfg.key}
                    listKey={cfg.key as any}
                    title={cfg.title}
                    total={cfg.total}
                    suggestions={cfg.suggestions}
                    hideLabel={cfg.hideLabel}
                    className={cfg.className}
                  />
                ))}

                {/* 3. Kitchen & Production Sections (Grouped for Print Clarity & Pagination) */}
                <div className="col-span-full print:break-before-page print:mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3 export-grid-2">
                  <div className="print:break-inside-avoid">
                    <KitchenConsumptionSection />
                  </div>
                  <div className="print:break-inside-avoid">
                    <ProductionInventorySection />
                  </div>
                </div>

              </div>
            </div>

            {/* Export Footer for Cash Report (Appears ONLY in Image, PDF, and Print exports) */}
            <ExportFooter id="export-footer-cash" date={data.date} className="hidden print:flex export-mode:flex" />
          </div>

          {/* 4. Employee Attendance & Advances Section (Exported separately as Image 2) */}
          <div id="employee-report-export" className="col-span-full print:break-before-page print:mt-6 mt-6">
            {/* Export Header Banner for Employee Report with Day and Date */}
            <ExportHeader
              id="export-header-employee"
              title="مطعم يحيى البيك - تقرير الموظفين اليومي"
              date={data.date}
              dayLabel={currentDayLabel}
              className="hidden print:block"
            />

            <EmployeeAdvancesSection />

            {/* Export Footer for Employee Report (Appears ONLY in Image, PDF, and Print exports) */}
            <ExportFooter id="export-footer-employee" date={data.date} className="hidden print:flex export-mode:flex" />
          </div>

        </div>

    </div>
      <ExportableA4Report />
    </div>
  );
}

export default App;
