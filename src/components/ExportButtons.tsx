import React, { useState } from 'react';
import { Download, FileText, Image as ImageIcon, Lock, ShieldCheck, Printer } from 'lucide-react';
import { useShiftStore } from '../store/useShiftStore';
import { useCalculations } from '../hooks/useCalculations';
import { useValidationStore } from '../store/useValidationStore';
import { SmartValidationModal } from './SmartValidationModal';
import { exportToExcel, printDocument, exportToImage } from '../lib/exportUtils';
import toast from 'react-hot-toast';

export const ExportButtons = () => {
  const data = useShiftStore(state => state.data);
  const calc = useCalculations();
  const closeShift = useShiftStore(state => state.closeShift);
  const [showValidationModal, setShowValidationModal] = useState(false);
  
  const triggerValidation = useValidationStore(state => state.triggerValidation);
  const errors = useValidationStore(state => state.errors);
  const isValidationTriggered = useValidationStore(state => state.isValidationTriggered);

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
    
    const loadingToast = toast.loading('جاري تجهيز الصورة...');
    try {
      exportToImage(data.date).then(() => {
        toast.success('تم تصدير الصورة بنجاح', { id: loadingToast });
      });
    } catch (error) {
      toast.error('حدث خطأ أثناء تصدير الصورة', { id: loadingToast });
    }
  };

  const handleExport = (action: 'excel' | 'pdf' | 'image') => {
    // Basic cashier check
    if (!data.cashierName?.trim()) {
      triggerValidation(data, calc.totalCollected, calc.totalInventory);
      toast.error('الرجاء إدخال اسم الكاشير قبل التصدير');
      return;
    }

    // Action
    if (action === 'excel') {
      exportToExcel(data, calc);
      toast.success('تم تصدير ملف Excel بنجاح');
    } else if (action === 'pdf') {
      printDocument();
    } else if (action === 'image') {
      const loadingToast = toast.loading('جاري تجهيز الصورة...');
      exportToImage(data.date).then(() => {
        toast.success('تم تصدير الصورة بنجاح', { id: loadingToast });
      }).catch(() => {
        toast.error('حدث خطأ أثناء تصدير الصورة', { id: loadingToast });
      });
    }
  };

  const hasErrors = Object.keys(errors).length > 0 && isValidationTriggered;

  return (
    <>
      <div className="flex gap-2.5 print:hidden flex-wrap justify-end items-center">
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
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold transition-all shadow-sm text-sm"
          title="طباعة التقرير فوراً أو حفظه كـ PDF بالجداول فقط"
        >
          <Printer size={17} className="text-emerald-400" />
          <span>طباعة فورية / PDF</span>
        </button>
        <button
          onClick={() => handleExport('excel')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-sm text-sm"
        >
          <Download size={17} />
          <span>Excel</span>
        </button>
        <button
          onClick={() => handleExport('image')}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-sm text-sm"
        >
          <ImageIcon size={17} />
          <span>صورة</span>
        </button>
      </div>

      <SmartValidationModal 
        isOpen={showValidationModal} 
        onClose={() => setShowValidationModal(false)}
        onConfirmForceClose={performShiftClose}
      />
    </>
  );
};

