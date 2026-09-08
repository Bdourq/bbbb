import React, { useEffect, useState, useCallback } from 'react';
import { X, ShieldAlert, User, TrendingDown, TrendingUp, CheckCircle2, RefreshCw, CalendarCheck } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { ShiftData } from '../store/useShiftStore';
import { calculateShiftMetrics } from '../lib/shiftCalculations';

export const START_CASHIER_REPORT_DATE = '2026-09-05'; // تقرير 5/9

type CashierSummary = {
  cashier: string;
  totalShortage: number;
  totalSurplus: number;
  shiftCount: number;
  details: Array<{ date: string; amount: number; type: 'shortage' | 'surplus' | 'exact' }>;
};

// Exact shift difference calculation conforming to accounting formulas
export const calculateShiftShortageAndSurplus = (docData: ShiftData) => {
  const { totalInventory, totalCash, diff, cashShortage, cashSurplus } = calculateShiftMetrics(docData);
  return { totalInventory, totalCash, diff, cashShortage, cashSurplus };
};

export const CashierDeficitModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [loading, setLoading] = useState(true);
  const [cashierStats, setCashierStats] = useState<CashierSummary[]>([]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'shifts'));
      const snapshot = await getDocs(q);

      const map: { [key: string]: { totalShortage: number; totalSurplus: number; shiftCount: number; details: Array<{ date: string; amount: number; type: 'shortage' | 'surplus' | 'exact' }> } } = {};

      snapshot.forEach(docSnap => {
        const docData = docSnap.data() as ShiftData;
        const date = docData.date;

        // تجاهل وحذف أي بيانات قبل تاريخ 5/9 تماماً أو الشفتات غير المغلقة
        if (!date || date < START_CASHIER_REPORT_DATE || !docData.isClosed) {
          return;
        }

        // 1. فحص وجود توثيق مخصص للشفتين (صباحي ومسائي)
        const hasShiftDifferences = Boolean(
          (docData.shiftDifferences?.morning?.cashierName && (docData.shiftDifferences.morning.amount > 0 || docData.shiftDifferences.morning.type === 'exact')) ||
          (docData.shiftDifferences?.evening?.cashierName && (docData.shiftDifferences.evening.amount > 0 || docData.shiftDifferences.evening.type === 'exact'))
        );

        if (hasShiftDifferences) {
          // حساب الشفت الصباحي
          if (docData.shiftDifferences?.morning?.cashierName) {
            const m = docData.shiftDifferences.morning;
            const mCashier = m.cashierName.trim();
            const mAmount = Number((m.amount || 0).toFixed(2));

            if (!map[mCashier]) {
              map[mCashier] = { totalShortage: 0, totalSurplus: 0, shiftCount: 0, details: [] };
            }
            map[mCashier].shiftCount += 1;

            const label = m.notes ? `${date} (${m.notes})` : `${date} (صباحي)`;

            if (m.type === 'shortage' && mAmount > 0.009) {
              map[mCashier].totalShortage += mAmount;
              map[mCashier].details.push({ date: label, amount: mAmount, type: 'shortage' });
            } else if (m.type === 'surplus' && mAmount > 0.009) {
              map[mCashier].totalSurplus += mAmount;
              map[mCashier].details.push({ date: label, amount: mAmount, type: 'surplus' });
            } else {
              map[mCashier].details.push({ date: label, amount: 0, type: 'exact' });
            }
          }

          // حساب الشفت المسائي
          if (docData.shiftDifferences?.evening?.cashierName) {
            const e = docData.shiftDifferences.evening;
            const eCashier = e.cashierName.trim();
            const eAmount = Number((e.amount || 0).toFixed(2));

            if (!map[eCashier]) {
              map[eCashier] = { totalShortage: 0, totalSurplus: 0, shiftCount: 0, details: [] };
            }
            map[eCashier].shiftCount += 1;

            const label = e.notes ? `${date} (${e.notes})` : `${date} (مسائي)`;

            if (e.type === 'shortage' && eAmount > 0.009) {
              map[eCashier].totalShortage += eAmount;
              map[eCashier].details.push({ date: label, amount: eAmount, type: 'shortage' });
            } else if (e.type === 'surplus' && eAmount > 0.009) {
              map[eCashier].totalSurplus += eAmount;
              map[eCashier].details.push({ date: label, amount: eAmount, type: 'surplus' });
            } else {
              map[eCashier].details.push({ date: label, amount: 0, type: 'exact' });
            }
          }
        } else {
          // التوافق مع تسليم الشفت الصباحي
          if (docData.shiftHandover && docData.shiftHandover.morningCashier) {
            const mCashier = docData.shiftHandover.morningCashier.trim();
            const mDiff = Number((docData.shiftHandover.difference || 0).toFixed(2));

            if (!map[mCashier]) {
              map[mCashier] = { totalShortage: 0, totalSurplus: 0, shiftCount: 0, details: [] };
            }
            map[mCashier].shiftCount += 1;

            if (mDiff < -0.009) {
              const shortage = Math.abs(mDiff);
              map[mCashier].totalShortage += shortage;
              map[mCashier].details.push({ date: `${date} (صباحي)`, amount: shortage, type: 'shortage' });
            } else if (mDiff > 0.009) {
              map[mCashier].totalSurplus += mDiff;
              map[mCashier].details.push({ date: `${date} (صباحي)`, amount: mDiff, type: 'surplus' });
            } else {
              map[mCashier].details.push({ date: `${date} (صباحي)`, amount: 0, type: 'exact' });
            }
          }

          // التوافق مع الحساب المالي الإجمالي للكاشير المسائي أو العام
          const { cashShortage, cashSurplus } = calculateShiftShortageAndSurplus(docData);
          const closingCashier = docData.cashierName?.trim() || docData.shiftHandover?.eveningCashier?.trim();

          if (closingCashier) {
            if (!map[closingCashier]) {
              map[closingCashier] = { totalShortage: 0, totalSurplus: 0, shiftCount: 0, details: [] };
            }
            map[closingCashier].shiftCount += 1;

            if (cashShortage > 0.009) {
              map[closingCashier].totalShortage += cashShortage;
              map[closingCashier].details.push({
                date: docData.shiftHandover ? `${date} (مسائي)` : date,
                amount: cashShortage,
                type: 'shortage'
              });
            } else if (cashSurplus > 0.009) {
              map[closingCashier].totalSurplus += cashSurplus;
              map[closingCashier].details.push({
                date: docData.shiftHandover ? `${date} (مسائي)` : date,
                amount: cashSurplus,
                type: 'surplus'
              });
            } else {
              map[closingCashier].details.push({
                date: docData.shiftHandover ? `${date} (مسائي)` : date,
                amount: 0,
                type: 'exact'
              });
            }
          }
        }
      });

      const list = Object.keys(map).map(cashier => ({
        cashier,
        totalShortage: Number(map[cashier].totalShortage.toFixed(2)),
        totalSurplus: Number(map[cashier].totalSurplus.toFixed(2)),
        shiftCount: map[cashier].shiftCount,
        details: map[cashier].details
      })).sort((a, b) => (b.totalShortage - b.totalSurplus) - (a.totalShortage - a.totalSurplus));

      setCashierStats(list);
    } catch (err) {
      console.error('Error fetching cashier stats', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen, fetchStats]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 print:hidden" dir="rtl">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="flex items-center justify-between gap-3 mb-3 text-indigo-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <ShieldAlert size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-gray-900">تقرير الكاشيرية (العجز والزيادة)</h3>
                <span className="text-[11px] bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <CalendarCheck size={13} />
                  بدءاً من 5/9/2026
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 font-medium">حساب دقيق لعجز وزيادة الكاش معتمد ابتداءً من تاريخ 5/9/2026</p>
            </div>
          </div>

          <button
            onClick={fetchStats}
            disabled={loading}
            className="text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-200 font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ml-6"
            title="تحديث وإعادة احتساب الفروقات"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>تحديث</span>
          </button>
        </div>

        <div className="text-xs text-indigo-950 mb-3 bg-indigo-50/70 p-2.5 rounded-xl border border-indigo-200/80 leading-relaxed font-semibold">
          📌 <span className="font-extrabold">ملاحظة تنظيمية:</span> تم تصفير كافة السجلات السابقة وحصر تسجيل عجز وزيادة الكاشيرية ابتداءً من تقرير <span className="underline font-black text-indigo-900">5/9/2026</span> وما بعده، وفق الحسابات المالية المعتمدة للدرج (الصباحي والمسائي).
        </div>

        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          {loading ? (
            <div className="text-center py-12 text-gray-500 font-bold flex flex-col items-center justify-center gap-2">
              <RefreshCw size={24} className="animate-spin text-indigo-600" />
              <span>جاري احتساب البيانات وتحليل الفروقات من 5/9...</span>
            </div>
          ) : cashierStats.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="font-bold text-sm">لا توجد فروقات مسجلة للكشيرية بدءاً من تاريخ 5/9/2026 حتى الآن.</p>
              <p className="text-xs text-gray-400 mt-1">يتم التسجيل التلقائي عند إغلاق الشفت اليومي بوجود عجز أو زيادة.</p>
            </div>
          ) : (
            cashierStats.map((item, idx) => {
              const netBalance = Number((item.totalSurplus - item.totalShortage).toFixed(2));
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

                    <div className="flex items-center gap-2.5 text-xs font-extrabold">
                      <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <TrendingDown size={14} />
                        العجز: {item.totalShortage.toFixed(2)} د.أ
                      </span>
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <TrendingUp size={14} />
                        الزيادة: {item.totalSurplus.toFixed(2)} د.أ
                      </span>
                      <span className={`px-2.5 py-1 rounded-lg border font-black ${
                        Math.abs(netBalance) < 0.01 
                          ? 'bg-gray-100 border-gray-300 text-gray-700' 
                          : netBalance > 0 
                          ? 'bg-blue-50 border-blue-300 text-blue-800' 
                          : 'bg-rose-100 border-rose-300 text-rose-900'
                      }`}>
                        الصافي: {netBalance > 0 ? `+${netBalance.toFixed(2)}` : netBalance.toFixed(2)} د.أ
                      </span>
                    </div>
                  </div>

                  {item.details.length > 0 && (
                    <div className="pt-2.5 border-t border-gray-200 flex flex-wrap gap-2">
                      {item.details.map((d, dIdx) => (
                        <span 
                          key={dIdx} 
                          className={`text-xs border px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 ${
                            d.type === 'shortage'
                              ? 'bg-rose-50 border-rose-200 text-rose-700'
                              : d.type === 'surplus'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-gray-100 border-gray-200 text-gray-600'
                          }`} 
                          dir="rtl"
                        >
                          {d.type === 'shortage' && <TrendingDown size={12} />}
                          {d.type === 'surplus' && <TrendingUp size={12} />}
                          {d.type === 'exact' && <CheckCircle2 size={12} />}
                          <span>
                            {d.date}: {d.type === 'shortage' ? `عجز ${d.amount.toFixed(2)} د.أ` : d.type === 'surplus' ? `زيادة ${d.amount.toFixed(2)} د.أ` : 'مطابق'}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 pt-3 border-t flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm transition-colors cursor-pointer"
          >
            إغلاق التقرير
          </button>
        </div>
      </div>
    </div>
  );
};
