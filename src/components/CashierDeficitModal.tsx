import React, { useEffect, useState } from 'react';
import { X, AlertCircle, ShieldAlert, User, TrendingDown } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { ShiftData } from '../store/useShiftStore';

export const CashierDeficitModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [loading, setLoading] = useState(true);
  const [cashierStats, setCashierStats] = useState<Array<{ cashier: string; totalShortage: number; shiftCount: number; details: Array<{ date: string; shortage: number }> }>>([]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'shifts'));
        const snapshot = await getDocs(q);
        
        const map: { [key: string]: { totalShortage: number; shiftCount: number; details: Array<{ date: string; shortage: number }> } } = {};

        snapshot.forEach(docSnap => {
          const docData = docSnap.data() as ShiftData;
          const cashier = docData.cashierName?.trim() || 'غير محدد';
          
          // Calculate shortage for this shift
          const totalInventory = (docData.actualInventory?.actualCash || 0) + 
            (docData.actualInventory?.visa || 0) + 
            (docData.actualInventory?.rt || 0) + 
            (docData.actualInventory?.maestro || 0) + 
            (docData.actualInventory?.priceDifference || 0) + 
            (docData.actualInventory?.advances || 0) + 
            (docData.actualInventory?.wallet || 0) +
            (docData.purchases || []).reduce((sum, item) => sum + (item.amount || 0), 0) +
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

          const cashInfo = (docData.cashAndSales as any) || {};
          const addedReceivablesTotal = docData.addCashReceivables 
            ? docData.addCashReceivables.reduce((sum, item) => sum + (item.amount || 0), 0)
            : (cashInfo.addedReceivables || 0);

          const totalExpectedCash = (cashInfo.openingCash || 0) + addedReceivablesTotal + (cashInfo.paidOldReceivables || 0) + (cashInfo.sales || 0) + (cashInfo.otherSales || 0);
          const shortage = totalExpectedCash - totalInventory;

          if (!map[cashier]) {
            map[cashier] = { totalShortage: 0, shiftCount: 0, details: [] };
          }
          map[cashier].shiftCount += 1;
          if (shortage > 0) {
            map[cashier].totalShortage += shortage;
            map[cashier].details.push({ date: docData.date, shortage });
          }
        });

        const list = Object.keys(map).map(cashier => ({
          cashier,
          totalShortage: map[cashier].totalShortage,
          shiftCount: map[cashier].shiftCount,
          details: map[cashier].details
        })).sort((a, b) => b.totalShortage - a.totalShortage);

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
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4 text-rose-600">
          <ShieldAlert size={28} />
          <h3 className="text-xl font-bold text-gray-800">تقرير عجز الكاش حسب أسماء الكشيرية</h3>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          يستعرض هذا التقرير إجمالي العجز المالي المسجل لكل كشير بناءً على جميع الشفتات والتقارير المحفوظة لغاية اليوم:
        </p>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {loading ? (
            <div className="text-center py-12 text-gray-500">جاري احتساب البيانات وتحليل العجز...</div>
          ) : cashierStats.length === 0 ? (
            <div className="text-center py-12 text-gray-500">لا توجد بيانات مسجلة للكشيرية بعد.</div>
          ) : (
            cashierStats.map((item, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-gray-50 hover:bg-white transition-colors shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <User size={18} className="text-blue-600" />
                    <span className="font-bold text-gray-800 text-base">{item.cashier}</span>
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                      {item.shiftCount} شفت مسجل
                    </span>
                  </div>
                  <div className={`flex items-center gap-1 font-bold text-base ${item.totalShortage > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    <TrendingDown size={16} />
                    <span>إجمالي العجز: {item.totalShortage.toLocaleString()}</span>
                  </div>
                </div>

                {item.details.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-2">
                    {item.details.map((d, dIdx) => (
                      <span key={dIdx} className="text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded-lg">
                        {d.date}: عجز {d.shortage.toLocaleString()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="mt-6 pt-4 border-t flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-medium text-sm transition-colors"
          >
            إغلاق التقرير
          </button>
        </div>
      </div>
    </div>
  );
};
