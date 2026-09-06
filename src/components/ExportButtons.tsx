import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, Image as ImageIcon, Lock, ShieldCheck, Printer, FileDown, ChevronDown, Users, WalletCards } from 'lucide-react';
import { useShiftStore } from '../store/useShiftStore';
import { useCalculations } from '../hooks/useCalculations';
import { useValidationStore } from '../store/useValidationStore';
import { SmartValidationModal } from './SmartValidationModal';
import { exportToExcel, printDocument, exportToImage, exportToPdf, ExportImageTarget } from '../lib/exportUtils';
import toast from 'react-hot-toast';

export const ExportButtons = () => {
  const data = useShiftStore(state => state.data);
  const calc = useCalculations();
  const closeShift = useShiftStore(state => state.closeShift);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const triggerValidation = useValidationStore(state => state.triggerValidation);
  const errors = useValidationStore(state => state.errors);
  const isValidationTriggered = useValidationStore(state => state.isValidationTriggered);

  // Close image options dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowImageMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleCloseShiftClick = () => {
    if (data.isClosed) {
      toast.error('الشفت مغلق بالفعل');
      return;
    }

    const { isValid, errorList } = triggerValidation(data, calc.totalCollected, calc.totalInventory);

    if (!isValid) {
      toast.error(`⚠️ يوجد ${errorList.length} نواقص يجب استكمالها! تم تظليل الجداول بالأحمر.`);
      setShowValidationModal(true);
      return;
    }

    if (window.confirm('هل أنت متأكد أنك تريد إغلاق الشفت؟ لن تتمكن من التعديل عليه بعد الإغلاق.')) {
      performShiftClose();
    }
  };

  const performShiftClose = () => {
    closeShift();
    toast.success('تم إغلاق الشفت بنجاح ✅');
    
    const loadingToast = toast.loading('جاري تجهيز الصورتين (إغلاق الكاش + إغلاق جدول الموظفين)...');
    try {
      exportToImage(data.date, 'both').then(() => {
        toast.success('تم تصدير صورة إغلاق الكاش وصورة إغلاق جدول الموظفين بنجاح ✅', { id: loadingToast });
      }).catch(() => {
        toast.error('حدث خطأ أثناء تصدير الصور', { id: loadingToast });
      });
    } catch (error) {
      toast.error('حدث خطأ أثناء التصدير', { id: loadingToast });
    }
  };

  const handleExportImages = (target: ExportImageTarget = 'both') => {
    setShowImageMenu(false);
    let msg = 'جاري التقاط الصورتين بدقة فائقة وتجميع الملف...';
    if (target === 'cash') msg = 'جاري تجهيز صورة إغلاق الكاش بدقة فائقة...';
    if (target === 'employees') msg = 'جاري تجهيز صورة إغلاق جدول الموظفين بدقة فائقة...';

    const loadingToast = toast.loading(msg);
    exportToImage(data.date, target).then(() => {
      if (target === 'both') {
        toast.success('تم تصدير ملف الصور المضغوط (ZIP) بنجاح 🖼️📦', { id: loadingToast });
      } else if (target === 'cash') {
        toast.success('تم تصدير صورة إغلاق الكاش بنجاح ✅', { id: loadingToast });
      } else {
        toast.success('تم تصدير صورة إغلاق جدول الموظفين بنجاح ✅', { id: loadingToast });
      }
    }).catch(() => {
      toast.error('حدث خطأ أثناء تصدير الصور', { id: loadingToast });
    });
  };

  const handleExport = (action: 'excel' | 'pdf' | 'print') => {
    if (action === 'print') {
      toast.success('جاري فتح نافذة الطباعة...');
      setTimeout(() => {
        printDocument();
      }, 100);
      return;
    }

    if (action === 'pdf') {
      const loadingToast = toast.loading('جاري إنشاء ملف PDF...');
      exportToPdf(data.date).then(() => {
        toast.success('تم تحميل ملف PDF بنجاح 📄', { id: loadingToast });
      }).catch((err) => {
        console.error(err);
        toast.error('حدث خطأ أثناء إنشاء PDF، جاري التحويل للطباعة...', { id: loadingToast });
        printDocument();
      });
    } else if (action === 'excel') {
      const loadingToast = toast.loading('جاري تجهيز وتصدير ملف Excel مطابق للقالب...');
      exportToExcel(data, calc)
        .then(() => {
          toast.success('تم تصدير ملف Excel بنجاح 📊', { id: loadingToast });
        })
        .catch((err) => {
          console.error(err);
          toast.error('حدث خطأ أثناء تصدير Excel، يرجى المحاولة مرة أخرى', { id: loadingToast });
        });
    }
  };

  const hasErrors = Object.keys(errors).length > 0 && isValidationTriggered;

  return (
    <>
      <div className="flex gap-2 print:hidden flex-wrap justify-end items-center">
        {!data.isClosed && (
          <button
            onClick={handleCloseShiftClick}
            className={`flex items-center gap-2 px-4 py-2 text-white rounded-xl font-bold transition-all shadow-sm text-sm sm:text-base mr-auto ${
              hasErrors
                ? 'bg-amber-600 hover:bg-amber-700 ring-2 ring-amber-400/50 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
            title="فحص النواقص وإغلاق الشفت"
          >
            <ShieldCheck size={18} />
            <span>{hasErrors ? 'فحص النواقص والأخطاء' : 'التحقق الذكي وإغلاق الشفت'}</span>
          </button>
        )}
        
        <button
          onClick={() => handleExport('pdf')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold transition-all shadow-sm text-sm cursor-pointer"
          title="تحميل ملف PDF يحوي الجداول النشطة فقط"
        >
          <FileDown size={17} className="text-white" />
          <span>تحميل PDF</span>
        </button>

        <button
          onClick={() => handleExport('print')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all shadow-sm text-sm cursor-pointer"
          title="طباعة فورية عبر الطابعة"
        >
          <Printer size={17} className="text-emerald-400" />
          <span>طباعة</span>
        </button>

        <button
          onClick={() => handleExport('excel')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-sm text-sm cursor-pointer"
        >
          <Download size={17} />
          <span>Excel</span>
        </button>

        {/* Dual Image Export Button with Split Option Dropdown */}
        <div className="relative inline-flex rounded-xl shadow-sm" ref={menuRef}>
          <button
            type="button"
            onClick={() => handleExportImages('both')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r-xl font-bold transition-colors text-sm cursor-pointer"
            title="تصدير الصورتين معاً (إغلاق الكاش + إغلاق جدول الموظفين)"
          >
            <ImageIcon size={17} />
            <span>صورة</span>
          </button>
          <button
            type="button"
            onClick={() => setShowImageMenu(prev => !prev)}
            className="px-2 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-l-xl border-r border-blue-500 font-bold transition-colors text-sm cursor-pointer flex items-center justify-center"
            title="خيارات تصدير الصور"
          >
            <ChevronDown size={15} className={`transform transition-transform ${showImageMenu ? 'rotate-180' : ''}`} />
          </button>

          {showImageMenu && (
            <div className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50 py-1 text-right animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 border-b border-gray-100 text-[11px] font-extrabold text-gray-400 uppercase">
                خيارات تصدير الصور المنفصلة
              </div>
              <button
                type="button"
                onClick={() => handleExportImages('both')}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-gray-800 hover:bg-blue-50 hover:text-blue-700 transition-colors text-right cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <ImageIcon size={16} />
                </div>
                <div>
                  <div className="font-extrabold">تصدير الصورتين معاً (افتراضي)</div>
                  <div className="text-[11px] text-gray-500 font-normal">إغلاق الكاش + إغلاق جدول الموظفين</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleExportImages('cash')}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-gray-800 hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-right cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <WalletCards size={16} />
                </div>
                <div>
                  <div className="font-extrabold">صورة إغلاق الكاش فقط</div>
                  <div className="text-[11px] text-gray-500 font-normal">جداول الكاش والجرد والمصاريف والمطبخ</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleExportImages('employees')}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-gray-800 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-right cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Users size={16} />
                </div>
                <div>
                  <div className="font-extrabold">صورة إغلاق جدول الموظفين فقط</div>
                  <div className="text-[11px] text-gray-500 font-normal">جدول حضور وسلف الموظفين باليوم والتاريخ</div>
                </div>
              </button>
            </div>
          )}
        </div>

      </div>

      <SmartValidationModal 
        isOpen={showValidationModal} 
        onClose={() => setShowValidationModal(false)}
        onConfirmForceClose={performShiftClose}
      />
    </>
  );
};

