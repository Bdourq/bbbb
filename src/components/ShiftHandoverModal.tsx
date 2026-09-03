import React, { useState } from 'react';
import { X, ArrowRightLeft, CheckCircle2, Calculator, Clock } from 'lucide-react';
import { useShiftStore } from '../store/useShiftStore';
import toast from 'react-hot-toast';

export const ShiftHandoverModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const data = useShiftStore(state => state.data);
  const updateData = useShiftStore(state => state.updateData);

  const [morningCashier, setMorningCashier] = useState('');
  const [eveningCashier, setEveningCashier] = useState(data.cashierName || '');
  const [morningOpeningCash, setMorningOpeningCash] = useState(data.cashAndSales.openingCash || 0);
  const [morningSales, setMorningSales] = useState(0);
  const [morningExpenses, setMorningExpenses] = useState(0);
  const [actualHandoverCash, setActualHandoverCash] = useState(0);

  if (!isOpen) return null;

  // Expected cash at handover = Opening + Morning Sales - Morning Expenses
  const expectedHandoverCash = morningOpeningCash + morningSales - morningExpenses;
  const handoverDifference = actualHandoverCash - expectedHandoverCash; // Positive = surplus, Negative = shortage

  const handleApplyHandover = () => {
    // Set opening cash for evening shift to actual handover cash
    updateData(['cashAndSales', 'openingCash'], actualHandoverCash);
    if (eveningCashier) {
      updateData(['cashierName'], eveningCashier);
    }
    toast.success('تم اعتماد تسليم الشفت بنجاح وتحديث الكاش الافتتاحي للشفت المسائي');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 print:hidden" dir="rtl">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4 text-indigo-600">
          <ArrowRightLeft size={28} />
          <h3 className="text-xl font-bold text-gray-800">مساعد تسليم الشفت (بين الصباحي والمسائي)</h3>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          أداة ذكية لتسليم الكاش بين كاشير الشفت الصباحي وكاشير الشفت المسائي بدقة متناهية وحساب الفروقات فوراً:
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">اسم كاشير الشفت الصباحي:</label>
              <input 
                type="text"
                value={morningCashier}
                onChange={(e) => setMorningCashier(e.target.value)}
                placeholder="اسم الكاشير الصباحي"
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">اسم كاشير الشفت المسائي:</label>
              <input 
                type="text"
                value={eveningCashier}
                onChange={(e) => setEveningCashier(e.target.value)}
                placeholder="اسم الكاشير المسائي"
                className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border space-y-3">
            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              <Clock size={16} className="text-indigo-600" />
              <span>حسابات الفترة الصباحية:</span>
            </h4>
            
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-gray-600 mb-1">النقد الافتتاحي</label>
                <input 
                  type="number"
                  value={morningOpeningCash}
                  onChange={(e) => setMorningOpeningCash(Number(e.target.value))}
                  className="w-full px-2 py-1.5 border rounded-lg text-sm text-center bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-600 mb-1">مبيعات الصباح</label>
                <input 
                  type="number"
                  value={morningSales}
                  onChange={(e) => setMorningSales(Number(e.target.value))}
                  className="w-full px-2 py-1.5 border rounded-lg text-sm text-center bg-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-600 mb-1">مصاريف الصباح</label>
                <input 
                  type="number"
                  value={morningExpenses}
                  onChange={(e) => setMorningExpenses(Number(e.target.value))}
                  className="w-full px-2 py-1.5 border rounded-lg text-sm text-center bg-white"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="bg-indigo-50/60 border border-indigo-200 p-4 rounded-xl space-y-3">
            <h4 className="font-bold text-indigo-900 text-sm flex items-center gap-2">
              <Calculator size={16} className="text-indigo-600" />
              <span>نتائج التسليم والاستلام الفعلي:</span>
            </h4>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-700">الكاش المتوقع في الدرج:</span>
              <span className="font-bold text-gray-900" dir="ltr">{expectedHandoverCash.toLocaleString()}</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">الكاش الفعلي المسلم للمسائي (المعدود باليد):</label>
              <input 
                type="number"
                value={actualHandoverCash}
                onChange={(e) => setActualHandoverCash(Number(e.target.value))}
                className="w-full px-3 py-2 border-2 border-indigo-300 rounded-xl text-base font-bold text-center bg-white text-indigo-700 outline-none"
                placeholder="أدخل المبلغ المعدود فعلياً"
              />
            </div>

            {actualHandoverCash > 0 && (
              <div className={`p-3 rounded-lg text-sm font-bold flex items-center justify-between ${handoverDifference === 0 ? 'bg-emerald-100 text-emerald-800' : handoverDifference > 0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                <span>{handoverDifference === 0 ? 'مطابقة تامة!' : handoverDifference > 0 ? 'زيادة نقدية عند التسليم:' : 'عجز نقدى عند التسليم:'}</span>
                <span dir="ltr">{Math.abs(handoverDifference).toLocaleString()} {handoverDifference > 0 ? '(زيادة)' : handoverDifference < 0 ? '(عجز)' : ''}</span>
              </div>
            )}
          </div>
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
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors flex items-center gap-2"
          >
            <CheckCircle2 size={16} />
            اعتماد التسليم وتمرير الكاش للمسائي
          </button>
        </div>
      </div>
    </div>
  );
};
