import React, { useEffect, useState } from 'react';
import { Menu, X, Calendar, ChevronLeft, ShieldAlert, ArrowRightLeft } from 'lucide-react';
import { useShiftStore } from './store/useShiftStore';
import { useCalculations } from './hooks/useCalculations';
import { DynamicList } from './components/ui';
import { ActualInventorySection, CashDataSection } from './components/sections';
import { KitchenConsumptionSection, ProductionInventorySection, EmployeeAdvancesSection } from './components/sections2';
import { ExportButtons } from './components/ExportButtons';
import { LogoUpload } from './components/LogoUpload';
import { CashierDeficitModal } from './components/CashierDeficitModal';
import { ShiftHandoverModal } from './components/ShiftHandoverModal';
import { Toaster, toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { db } from './lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

function App() {
  const { data, isLoading, initSync, updateData, setShiftDate, fetchSavedDates, savedDates } = useShiftStore();
  const calc = useCalculations();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showDeficitModal, setShowDeficitModal] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');
  const isReadOnly = data.isClosed || data.date !== today;

  useEffect(() => {
    fetchSavedDates();
    const unsubscribe = initSync();
    return () => unsubscribe();
  }, [initSync, data.date, fetchSavedDates]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  const baseMerchantSuggestions = [
    "خس", "خبز الشيخ", "خبز بروستد", "نوافله", "خضار", "ابو جليل", "منظفات"
  ];
  
  const ohdaSuggestions = [
    "عهده سيف", "عهده الزعبي", "عهده سعد", "عهده النابلسي"
  ];
  
  const purchasesSuggestions = [...baseMerchantSuggestions, ...ohdaSuggestions];

  const personalSuggestions = ["اوردر", "اغراض"];
  
  const adminSuggestions = ["ضمان", "كهرباء", "فاتورة نت", "فاتورة اتصال", "ضيافة", "رعاية", "قرطاسية"];
  
  const spiceSuggestions = ["بهارات شاورما", "كبا", "مشكل", "جنات", "قشرة", "شطة زبدة", "مدخن ملونين", "بطاطا", "صبغة حا", "صبغة رز"];

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">جاري التحميل...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 font-sans text-gray-900" dir="rtl" id="report-content">
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
              className="w-full flex items-center gap-2 p-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 transition-colors text-sm"
            >
              <ShieldAlert size={18} />
              <span>عجز الكاش (تقرير الكشيرية)</span>
            </button>
            <button
              onClick={() => {
                setShowHandoverModal(true);
                setIsSidebarOpen(false);
              }}
              className="w-full flex items-center gap-2 p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 transition-colors text-sm"
            >
              <ArrowRightLeft size={18} />
              <span>تسليم الشفت (صباحي ➔ مسائي)</span>
            </button>
          </div>

          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">التقارير السابقة</h3>
          {savedDates.length === 0 ? (
            <div className="text-center text-gray-500 py-8">لا توجد تقارير سابقة</div>
          ) : (
            savedDates.map(d => (
              <button
                key={d}
                onClick={() => {
                  setShiftDate(d);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  data.date === d 
                    ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold' 
                    : 'bg-white hover:bg-gray-50 text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{d}</span>
                <ChevronLeft size={16} className={data.date === d ? "text-blue-500" : "text-gray-400"} />
              </button>
            ))
          )}
        </div>
      </div>

      <CashierDeficitModal isOpen={showDeficitModal} onClose={() => setShowDeficitModal(false)} />
      <ShiftHandoverModal isOpen={showHandoverModal} onClose={() => setShowHandoverModal(false)} />

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Actions Bar */}
        <div className="flex justify-end print:hidden mb-4" data-html2canvas-ignore="true">
          <ExportButtons />
        </div>

        {/* Header */}
        <header className="bg-white p-6 rounded-xl shadow-sm border mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative">
          {isReadOnly && (
            <div className="absolute top-0 right-0 left-0 bottom-0 pointer-events-none rounded-xl bg-gray-50/20 border-2 border-amber-400/50 flex items-center justify-center z-0 overflow-hidden">
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
              {isReadOnly && <span className="text-sm font-bold text-amber-600 mt-1 print:hidden">⚠️ وضع القراءة فقط - التقرير مغلق للتعديل</span>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 z-10">
            <div className="flex items-center gap-2 font-bold text-gray-700 bg-gray-50 px-4 py-2 rounded-lg border">
              <span className="text-gray-500 font-medium">اليوم:</span>
              <span>{new Intl.DateTimeFormat('ar-JO', { weekday: 'long' }).format(new Date(data.date))}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 font-medium">التاريخ:</label>
              <input 
                type="date" 
                lang="en-US"
                dir="ltr"
                value={data.date}
                onChange={(e) => setShiftDate(e.target.value)}
                className="px-3 py-1.5 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 print:font-bold print:border-none print:p-0"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 font-medium">الكاشير:</label>
              <div className="flex flex-col">
                <input 
                  type="text" 
                  list="cashier-suggestions"
                  value={data.cashierName}
                  readOnly={isReadOnly}
                  onChange={(e) => updateData(['cashierName'], e.target.value)}
                  className={`px-3 py-1.5 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 print:font-bold print:border-none print:p-0 w-32 ${isReadOnly ? 'bg-gray-50' : ''}`}
                  placeholder="اسم الكاشير"
                />
                <datalist id="cashier-suggestions">
                  <option value="قصي البدور" />
                  <option value="امجد شحادات" />
                </datalist>
              </div>
            </div>
          </div>
        </header>

        <div className={`transition-opacity duration-300 ${isReadOnly ? 'pointer-events-none' : ''}`}>
          {/* Top Grid: 4 columns layout to exactly match PDF */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2 export-grid-4">
          
          {/* Column 1 (Rightmost in RTL) */}
          <div className="space-y-4 print:space-y-2">
            <DynamicList listKey="purchases" title="مشتريات" total={calc.purchasesTotal} suggestions={purchasesSuggestions} />
            <DynamicList listKey="otherExpenses" title="مصاريف أخرى" total={calc.otherExpensesTotal} />
            <DynamicList listKey="abuAbdullah" title="أبو عبدالله" total={calc.abuAbdullahTotal} />
            <DynamicList listKey="equipment" title="معدات وصيانة" total={calc.equipmentTotal} />
          </div>
          
          {/* Column 2 */}
          <div className="space-y-4 print:space-y-2">
            <DynamicList listKey="addMerchantReceivables" title="إضافة ذمم تجار" total={calc.addMerchantTotal} suggestions={baseMerchantSuggestions} />
            <DynamicList listKey="apartment" title="الشقة" total={calc.apartmentTotal} suggestions={personalSuggestions} />
            <DynamicList listKey="adminExpenses" title="مصاريف إدارية" total={calc.adminExpensesTotal} suggestions={adminSuggestions} />
            <DynamicList listKey="ewallet" title="المحفظة الإلكترونية" total={calc.ewalletTotal} />
          </div>
          
          {/* Column 3 */}
          <div className="space-y-4 print:space-y-2">
            <DynamicList listKey="payMerchantReceivables" title="سداد ذمم تجار" total={calc.payMerchantTotal} suggestions={baseMerchantSuggestions} />
            <DynamicList listKey="yahya" title="يحيى" total={calc.yahyaTotal} suggestions={personalSuggestions} />
            <DynamicList listKey="spices" title="بهارات" total={calc.spicesTotal} suggestions={spiceSuggestions} />
          </div>

          {/* Column 4 (Leftmost in RTL) */}
          <div className="space-y-4 print:space-y-2">
            <CashDataSection />
            <ActualInventorySection />
          </div>
        </div>

        {/* Lower Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 print:mt-4 print:grid-cols-2 print:gap-2 export-grid-2">
          <KitchenConsumptionSection />
          <ProductionInventorySection />
        </div>

        {/* Advances */}
        <div className="mt-8">
          <EmployeeAdvancesSection />
        </div>
        
        </div>

      </div>
    </div>
  );
}

export default App;
