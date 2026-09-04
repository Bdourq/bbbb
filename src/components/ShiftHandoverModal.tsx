import React, { useState } from 'react';
import { X, ArrowRightLeft, CheckCircle2, Calculator, Clock, TrendingDown, TrendingUp } from 'lucide-react';
import { useShiftStore } from '../store/useShiftStore';
import toast from 'react-hot-toast';

export const ShiftHandoverModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const data = useShiftStore(state => state.data);
  const updateData = useShiftStore(state => state.updateData);

  const [morningCashier, setMorningCashier] = useState('');
  const [eveningCashier, setEveningCashier] = useState(data.cashierName || '');
  
  // Required fields for Shift Handover
  const [sales, setSales] = useState(data.cashAndSales.sales || 0);
  const [rt, setRt] = useState(data.actualInventory.rt || 0);
  const [visa, setVisa] = useState(data.actualInventory.visa || 0);
  const [maestro, setMaestro] = useState(data.actualInventory.maestro || 0);
  const [actualCash, setActualCash] = useState(data.actualInventory.actualCash || 0);

  if (!isOpen) return null;

  // Automatically pulled from main shift state / tables
  const openingCash = data.cashAndSales.openingCash || 0;
  const addedReceivables = data.addCashReceivables ? data.addCashReceivables.reduce((sum, item) => sum + (item.amount || 0), 0) : (data.cashAndSales.addedReceivables || 0);
  const paidOldReceivables = data.cashAndSales.paidOldReceivables || 0;
  const otherSales = data.cashAndSales.otherSales || 0;

  // Sum of all expenses / deductions from main tables
  const totalExpenses = [
    ...(data.purchases || []),
    ...(data.otherExpenses || []),
    ...(data.abuAbdullah || []),
    ...(data.equipment || []),
    ...(data.addMerchantReceivables || []),
    ...(data.apartment || []),
    ...(data.adminExpenses || []),
    ...(data.ewallet || []),
    ...(data.payMerchantReceivables || []),
    ...(data.yahya || []),
    ...(data.spices || [])
  ].reduce((sum, item) => sum + (item.amount || 0), 0);

  // Expected cash = Opening + Added Receivables + Paid Old Receivables + Sales + Other Sales - Expenses - Visa - RT - Maestro
  const expectedCash = openingCash + addedReceivables + paidOldReceivables + sales + otherSales - totalExpenses - visa - rt - maestro;
  const handoverDifference = actualCash - expectedCash; // Positive = surplus, Negative = shortage

  const handleApplyHandover = () => {
    const handoverObj = {
      morningCashier: morningCashier || 'كاشير صباحي',
      eveningCashier: eveningCashier || 'كاشير مسائي',
      sales,
      actualCash,
      expectedCash,
      difference: handoverDifference,
      timestamp: new Date().toISOString()
    };

    updateData(['shiftHandover'], handoverObj);
    updateData(['cashAndSales', 'sales'], sales);
    updateData(['actualInventory', 'rt'], rt);
    updateData(['actualInventory', 'visa'], visa);
    updateData(['actualInventory', 'maestro'], maestro);
    updateData(['actualInventory', 'actualCash'], actualCash);
    
    // Set opening cash for evening shift to actual cash
    updateData(['cashAndSales', 'openingCash'], actualCash);
    if (eveningCashier) {
      updateData(['cashierName'], eveningCashier);
    }
    toast.success('تم تسليم الشفت بنجاح: تم تسجيل زيادة/عجز الصباحي وتحديث الكاش الافتتاحي للمسائي');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 print:hidden" dir="rtl">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4 text-indigo-600">
          <ArrowRightLeft size={28} />
          <h3 className="text-xl font-bold text-gray-800">مساعد تسليم الشفت السريع (بين الصباحي والمسائي)</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">كاشير الشفت الصباحي:</label>
              <select
                value={morningCashier}
                onChange={(e) => setMorningCashier(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold bg-white"
              >
                <option value="">-- اختر الكاشير --</option>
                <option value="قصي البدور">قصي البدور</option>
                <option value="أمجد شحادات">أمجد شحادات</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">كاشير الشفت المسائي:</label>
              <select
                value={eveningCashier}
                onChange={(e) => setEveningCashier(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold bg-white"
              >
                <option value="">-- اختر الكاشير --</option>
                <option value="قصي البدور">قصي البدور</option>
                <option value="أمجد شحادات">أمجد شحادات</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border space-y-3">
            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Clock size={16} className="text-indigo-600" />
              <span>أدخل البيانات الأساسية للشفت الصباحي:</span>
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">المبيعات</label>
                <input 
                  type="number"
                  value={sales}
                  onChange={(e) => setSales(Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-center bg-white font-bold text-blue-700"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">الـ RT</label>
                <input 
                  type="number"
                  value={rt}
                  onChange={(e) => setRt(Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-center bg-white font-bold"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">الفيزا</label>
                <input 
                  type="number"
                  value={visa}
                  onChange={(e) => setVisa(Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-center bg-white font-bold"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">المايسترو</label>
                <input 
                  type="number"
                  value={maestro}
                  onChange={(e) => setMaestro(Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-center bg-white font-bold"
                  placeholder="0"
                />
              </div>
              <div className="col-span-2 sm:col-span-2">
                <label className="block text-[11px] font-bold text-indigo-700 mb-1">النقد الفعلي (المعدود باليد)</label>
                <input 
                  type="number"
                  value={actualCash}
                  onChange={(e) => setActualCash(Number(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full px-3 py-2.5 border-2 border-indigo-400 rounded-lg text-base text-center bg-indigo-50 font-extrabold text-indigo-900 outline-none"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="text-[11px] text-gray-500 pt-2 border-t flex justify-between">
              <span>النقد الافتتاحي والمصاريف والذمم مسحوبة تلقائياً من الجداول الرئيسية.</span>
              <span className="font-bold text-gray-700">الكاش المتوقع: {expectedCash.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          {actualCash > 0 && (
            <div className={`p-4 rounded-xl text-sm font-bold space-y-2 border ${handoverDifference === 0 ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : handoverDifference > 0 ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-red-50 border-red-300 text-red-900'}`}>
              <div className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  {handoverDifference === 0 ? <CheckCircle2 size={20} className="text-emerald-600" /> : handoverDifference > 0 ? <TrendingUp size={20} className="text-blue-600" /> : <TrendingDown size={20} className="text-red-600" />}
                  <span>{handoverDifference === 0 ? 'مطابقة تامة بين الحسابات والكاش الفعلي!' : handoverDifference > 0 ? 'زيادة نقدية في الشفت الصباحي:' : 'عجز نقدي في الشفت الصباحي:'}</span>
                </span>
                <span className="text-lg font-extrabold" dir="ltr">
                  {Math.abs(handoverDifference).toLocaleString()} {handoverDifference > 0 ? '(زيادة)' : handoverDifference < 0 ? '(عجز)' : ''}
                </span>
              </div>
              
              <div className="pt-2 border-t border-black/10 text-xs leading-relaxed font-semibold">
                {handoverDifference < 0 ? (
                  <p className="text-red-700">
                    ⚠️ <strong>تقرير العجز:</strong> يوجد نقص بقيمة <span dir="ltr" className="font-extrabold">{Math.abs(handoverDifference).toLocaleString()}</span> مسجل على الكاشير الصباحي (<span className="underline">{morningCashier || 'غير محدد'}</span>).
                  </p>
                ) : handoverDifference > 0 ? (
                  <p className="text-blue-700">
                    🌟 <strong>تقرير الزيادة:</strong> يوجد فائض نقدي بقيمة <span dir="ltr" className="font-extrabold">{handoverDifference.toLocaleString()}</span> لصالح الكاشير الصباحي (<span className="underline">{morningCashier || 'غير محدد'}</span>).
                  </p>
                ) : (
                  <p className="text-emerald-700">
                    ✅ الدرج مطابق تماماً للحسابات بين الكاشير الصباحي والكاشير المسائي (<span className="underline">{eveningCashier || 'المسائي'}</span>).
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm transition-colors"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleApplyHandover}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2 shadow-lg"
          >
            <CheckCircle2 size={18} />
            اعتماد وتمرير الرصيد للكاشير المسائي ({eveningCashier || 'المسائي'})
          </button>
        </div>
      </div>
    </div>
  );
};


