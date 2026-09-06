import React, { useEffect, useState } from 'react';
import { X, ShieldAlert, User, TrendingDown, TrendingUp, CheckCircle2 } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { ShiftData } from '../store/useShiftStore';

type CashierSummary = {
  cashier: string;
  totalShortage: number;
  totalSurplus: number;
  shiftCount: number;
  details: Array<{ date: string; amount: number; type: 'shortage' | 'surplus' | 'exact' }>;
};

export const CashierDeficitModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [loading, setLoading] = useState(true);
  const [cashierStats, setCashierStats] = useState<CashierSummary[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'shifts'));
        const snapshot = await getDocs(q);
        
        const map: { [key: string]: { totalShortage: number; totalSurplus: number; shiftCount: number; details: Array<{ date: string; amount: number; type: 'shortage' | 'surplus' | 'exact' }> } } = {};

        const sumExpenses = (docData: ShiftData) => {
          return (docData.purchases || []).reduce((sum, item) => sum + (item.amount || 0), 0) +
            (docData.otherExpenses || []).reduce((sum, item) => sum + (item.amount || 0), 0) +
            (docData.abuAbdullah || []).reduce((sum, item) => sum + (item.amount || 0), 0) +
            (docData.equipment || []).reduce((sum, item) => sum + (item.amount || 0), 0) +
            (docData.addMerchantReceivables || []).reduce((sum, item) => sum + (item.amount || 0), 0) +
            (docData.apartment || []).reduce((sum, item) => sum + (item.amount || 0), 0) +
            (docData.adminExpenses || []).reduce((sum, item) => sum + (item.amount || 0), 0) +
            (docData.ewallet || []).reduce((sum, item) => sum + (item.amount || 0), 0) +
            (docData.payMerchantReceivables || []).reduce((sum, item) => sum + (item.amount || 0), 0) +
            (docData.yahya || []).reduce((sum, item) => sum + (item.amount || 0), 0) +
            (docData.spices || []).reduce((sum, item) => sum + (item.amount || 0), 0);
        };

        snapshot.forEach(docSnap => {
          const docData = docSnap.data() as ShiftData;
          const date = docData.date;

          // 1. Check Morning Shift Handover if recorded
          if (docData.shiftHandover && docData.shiftHandover.morningCashier) {
            const mCashier = docData.shiftHandover.morningCashier.trim();
            const mDiff = docData.shiftHandover.difference || 0; // Positive = surplus, Negative = shortage

            if (!map[mCashier]) {
              map[mCashier] = { totalShortage: 0, totalSurplus: 0, shiftCount: 0, details: [] };
            }
            map[mCashier].shiftCount += 1;
            if (mDiff < -0.01) {
              const shortage = Math.abs(mDiff);
              map[mCashier].totalShortage += shortage;
              map[mCashier].details.push({ date: `${date} (صباحي)`, amount: shortage, type: 'shortage' });
            } else if (mDiff > 0.01) {
              map[mCashier].totalSurplus += mDiff;
              map[mCashier].details.push({ date: `${date} (صباحي)`, amount: mDiff, type: 'surplus' });
            } else {
              map[mCashier].details.push({ date: `${date} (صباحي)`, amount: 0, type: 'exact' });
            }
          }

          // 2. Full End-of-Day Closure Cashier
          const closingCashier = docData.cashierName?.trim() || docData.shiftHandover?.eveningCashier?.trim() || 'غير محدد';

           const totalInventory = (docData.actualInventory?.actualCash || 0) + 
            (docData.actualInventory?.visa || 0) + 
            (docData.actualInventory?.rt || 0) + 
            (docData.actualInventory?.maestro || 0) + 
            (docData.actualInventory?.priceDifference || 0) + 
            (docData.actualInventory?.advances || 0) + 
            ((docData.ewallet || []).reduce((sum, item) => sum + (item.amount || 0), 0)) +
            sumExpenses(docData);

          const cashInfo = (docData.cashAndSales as any) || {};
          const addedReceivablesTotal = docData.addCashReceivables 
            ? docData.addCashReceivables.reduce((sum, item) => sum + (item.amount || 0), 0)
            : (cashInfo.paidOldReceivables || 0);

          const newReceivablesTotal = docData.addNewReceivables
            ? docData.addNewReceivables.reduce((sum, item) => sum + (item.amount || 0), 0)
            : (cashInfo.addedReceivables || 0);

          const totalExpectedCash = (cashInfo.openingCash || 0) + (cashInfo.sales || 0) + (cashInfo.otherSales || 0) + newReceivablesTotal - addedReceivablesTotal;
          
          const eDiff = totalInventory - totalExpectedCash; // Positive = surplus, Negative = shortage

          if (!map[closingCashier]) {
            map[closingCashier] = { totalShortage: 0, totalSurplus: 0, shiftCount: 0, details: [] };
          }
          map[closingCashier].shiftCount += 1;
          
          if (eDiff < -0.01) {
            const shortage = Math.abs(eDiff);
            map[closingCashier].totalShortage += shortage;
            map[closingCashier].details.push({ 
              date: docData.shiftHandover ? `${date} (مسائي)` : date, 
              amount: shortage, 
              type: 'shortage' 
            });
          } else if (eDiff > 0.01) {
            map[closingCashier].totalSurplus += eDiff;
            map[closingCashier].details.push({ 
              date: docData.shiftHandover ? `${date} (مسائي)` : date, 
              amount: eDiff, 
              type: 'surplus' 
            });
          } else {
            map[closingCashier].details.push({ 
              date: docData.shiftHandover ? `${date} (مسائي)` : date, 
              amount: 0, 
              type: 'exact' 
            });
          }
        });

        const list = Object.keys(map).map(cashier => ({
          cashier,
          totalShortage: map[cashier].totalShortage,
          totalSurplus: map[cashier].totalSurplus,
          shiftCount: map[cashier].shiftCount,
          details: map[cashier].details
        })).sort((a, b) => (b.totalShortage - b.totalSurplus) - (a.totalShortage - a.totalSurplus));

        setCashierStats(list);
      } catch (err) {
        console.error('Error fetching cashier stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 print:hidden" dir="rtl">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4 text-indigo-700">
          <ShieldAlert size={28} />
          <div>
            <h3 className="text-xl font-bold text-gray-900">تقرير الزيادة والعجز للكشيرية</h3>
            <p className="text-xs text-gray-500 mt-0.5">تفصيل ومتابعة أداء الصباحي والمسائي بشكل منفصل ودقيق</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-gray-600 mb-4 bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 leading-relaxed">
          يستعرض هذا التقرير إجمالي الزيادات والنواقص المالية المسجلة لكل كاشير بشكل منفصل (تسليم الشفت الصباحي + الإغلاق الكامل المسائي):
        </p>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {loading ? (
            <div className="text-center py-12 text-gray-500">جاري احتساب البيانات وتحليل الفروقات...</div>
          ) : cashierStats.length === 0 ? (
            <div className="text-center py-12 text-gray-500">لا توجد بيانات مسجلة للكشيرية بعد.</div>
          ) : (
            cashierStats.map((item, idx) => {
              const netBalance = item.totalSurplus - item.totalShortage;
              return (
                <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-gray-50/70 hover:bg-white transition-colors shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                        <User size={18} />
                      </div>
                      <span className="font-extrabold text-gray-900 text-base">{item.cashier}</span>
                      <span className="text-xs bg-gray-200 text-gray-700 font-bold px-2.5 py-0.5 rounded-full">
                        {item.shiftCount} شفت مسجل
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-extrabold">
                      <span className="text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <TrendingDown size={14} />
                        العجز: {item.totalShortage.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <TrendingUp size={14} />
                        الزيادة: {item.totalSurplus.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg border font-black ${
                        netBalance === 0 
                          ? 'bg-gray-100 border-gray-300 text-gray-700' 
                          : netBalance > 0 
                          ? 'bg-blue-50 border-blue-300 text-blue-800' 
                          : 'bg-red-100 border-red-300 text-red-900'
                      }`}>
                        الصافي: {netBalance > 0 ? `+${netBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : netBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {item.details.length > 0 && (
                    <div className="pt-2.5 border-t border-gray-200 flex flex-wrap gap-2">
                      {item.details.map((d, dIdx) => (
                        <span 
                          key={dIdx} 
                          className={`text-xs border px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 ${
                            d.type === 'shortage'
                              ? 'bg-rose-50 border-rose-200 text-rose-700'
                              : d.type === 'surplus'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-gray-100 border-gray-200 text-gray-600'
                          }`} 
                          dir="ltr"
                        >
                          {d.type === 'shortage' && <TrendingDown size={12} />}
                          {d.type === 'surplus' && <TrendingUp size={12} />}
                          {d.type === 'exact' && <CheckCircle2 size={12} />}
                          <span>{d.date}: {d.type === 'shortage' ? `عجز ${d.amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : d.type === 'surplus' ? `زيادة ${d.amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : 'مطابق'}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 pt-4 border-t flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-colors cursor-pointer"
          >
            إغلاق التقرير
          </button>
        </div>
      </div>
    </div>
  );
};
