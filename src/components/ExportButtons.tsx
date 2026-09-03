import React, { useState } from 'react';
import { Download, FileText, Image as ImageIcon, Lock, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { useShiftStore } from '../store/useShiftStore';
import { useCalculations } from '../hooks/useCalculations';
import { exportToExcel, printDocument, exportToImage } from '../lib/exportUtils';
import toast from 'react-hot-toast';

export const ExportButtons = () => {
  const data = useShiftStore(state => state.data);
  const calc = useCalculations();
  const closeShift = useShiftStore(state => state.closeShift);
  const [showModal, setShowModal] = useState(false);

  const allLists = [
    data.purchases, data.otherExpenses, data.abuAbdullah, data.equipment,
    data.addMerchantReceivables, data.apartment, data.adminExpenses, data.ewallet,
    data.payMerchantReceivables, data.yahya, data.spices, data.addCashReceivables || []
  ];
  
  let hasEmptyLabels = false;
  for (const list of allLists) {
    if (list.some(item => item.amount > 0 && !item.label.trim())) {
      hasEmptyLabels = true;
      break;
    }
  }

  // Gather validation errors & calculation notes
  const getValidationDetails = () => {
    const missing: string[] = [];
    const warnings: string[] = [];

    if (!data.cashierName.trim()) {
      missing.push('اسم الكاشير غير مدخل (يرجى تحديد اسم الكاشير في أعلى التقرير).');
    }
    if (hasEmptyLabels) {
      missing.push('يوجد مبالغ مدخلة في الجداول بدون كتابة "البيان" التوضيحي.');
    }
    if (data.cashAndSales.openingCash === 0 && data.cashAndSales.sales === 0) {
      missing.push('لم يتم إدخال قيمة النقد الافتتاحي أو المبيعات في قسم حركات الكاش.');
    }
    if (data.actualInventory.actualCash === 0 && calc.totalInventory === 0) {
      missing.push('لم يتم إدخال قيم الجرد الفعلي (الكاش الفعلي، فيزا، سلف، إلخ).');
    }
    if (data.isClosed) {
      warnings.push('الشفت مغلق مسبقاً.');
    }

    // Calculation Assistance / Insights
    if (calc.cashShortage > 0) {
      warnings.push(`تنبيه عجز الكاش: يوجد عجز بقيمة ${calc.cashShortage.toLocaleString()}. تأكد من المطابقة أو تسجيل المصاريف النقدية بدقة.`);
    } else if (calc.cashSurplus > 0) {
      warnings.push(`تنبيه زيادة الكاش: يوجد فائض نقدي بقيمة ${calc.cashSurplus.toLocaleString()}. تأكد من تسجيل جميع المبيعات.`);
    }

    return { missing, warnings };
  };

  const { missing, warnings } = getValidationDetails();
  const canCloseShift = missing.length === 0 && !data.isClosed;

  const handleCloseShiftClick = () => {
    if (!canCloseShift) {
      setShowModal(true);
      return;
    }

    if (window.confirm('هل أنت متأكد أنك تريد إغلاق الشفت؟ لن تتمكن من التعديل عليه بعد الإغلاق.')) {
      closeShift();
      toast.success('تم إغلاق الشفت بنجاح');
      
      const loadingToast = toast.loading('جاري تجهيز الصورة...');
      try {
        exportToImage(data.date).then(() => {
          toast.success('تم تصدير الصورة بنجاح', { id: loadingToast });
        });
      } catch (error) {
        toast.error('حدث خطأ أثناء تصدير الصورة', { id: loadingToast });
      }
    }
  };

  const handleExport = (action: 'excel' | 'pdf' | 'image') => {
    // Validation
    if (!data.cashierName.trim()) {
      toast.error('الرجاء إدخال اسم الكاشير قبل التصدير');
      return;
    }
    
    if (hasEmptyLabels) {
      toast.error('توجد مبالغ مدخلة بدون توضيح "البيان"، يرجى تعبئتها');
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

  return (
    <>
      <div className="flex gap-3 print:hidden flex-wrap justify-end">
        {!data.isClosed && (
          <button
            onClick={handleCloseShiftClick}
            className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg font-medium transition-colors shadow-sm text-sm sm:text-base mr-auto ${canCloseShift ? 'bg-indigo-600 hover:bg-indigo-700 animate-pulse' : 'bg-amber-600 hover:bg-amber-700'}`}
            title={canCloseShift ? 'الشفت جاهز للإغلاق' : 'اضغط لمعرفة النواقص والأخطاء قبل الإغلاق'}
          >
            <Lock size={18} />
            {canCloseShift ? 'إغلاق الشفت (جاهز)' : 'فحص النواقص والأخطاء'}
          </button>
        )}
        <button
          onClick={() => handleExport('image')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm text-sm sm:text-base"
        >
          <ImageIcon size={18} />
          تصدير صورة
        </button>
        <button
          onClick={() => handleExport('excel')}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors shadow-sm text-sm sm:text-base"
        >
          <Download size={18} />
          تصدير Excel
        </button>
        <button
          onClick={() => handleExport('pdf')}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium transition-colors shadow-sm text-sm sm:text-base"
        >
          <FileText size={18} />
          تصدير PDF / طباعة
        </button>
      </div>

      {/* Validation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4 text-amber-600">
              <AlertTriangle size={28} />
              <h3 className="text-xl font-bold text-gray-800">تقرير فحص الشفت والنواقص</h3>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              لا يمكن إغلاق الشفت حالياً لعدم استكمال البيانات أو وجود تنبيهات حسابية تحتاج للمراجعة:
            </p>

            {missing.length > 0 && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4">
                <h4 className="font-bold text-red-800 text-sm mb-2 flex items-center gap-2">
                  <span>❌ النواقص والأخطاء الواجب تصحيحها:</span>
                </h4>
                <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-red-700">
                  {missing.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h4 className="font-bold text-amber-800 text-sm mb-2 flex items-center gap-2">
                  <span>💡 مساعد الحسابات والتنبيهات:</span>
                </h4>
                <ul className="list-disc list-inside space-y-1.5 text-xs sm:text-sm text-amber-700">
                  {warnings.map((warn, i) => (
                    <li key={i}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}

            {missing.length === 0 && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle2 className="text-emerald-600 flex-shrink-0" size={24} />
                <span className="text-emerald-800 text-sm font-bold">جميع البيانات الأساسية مكتملة وجاهزة للإغلاق!</span>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm transition-colors"
              >
                فهمت، العودة للتعديل
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

