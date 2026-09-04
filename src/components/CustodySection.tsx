import React from 'react';
import { useShiftStore, CustodyItem } from '../store/useShiftStore';
import { Card, CardHeader } from './ui';
import { Trash2, ArrowUpRight, ArrowDownLeft, HandCoins, ArrowRightLeft } from 'lucide-react';

export const CustodySection = () => {
  const custodyItems: CustodyItem[] = useShiftStore(state => state.data.custodyItems || []);
  const updateData = useShiftStore(state => state.updateData);
  const addCustodyItem = useShiftStore(state => state.addCustodyItem);
  const removeCustodyItem = useShiftStore(state => state.removeCustodyItem);
  const isClosed = useShiftStore(state => state.data.isClosed);

  // Calculate totals
  const totalOut = custodyItems
    .filter(item => item.type === 'out')
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const totalIn = custodyItems
    .filter(item => item.type === 'in')
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const netPending = totalOut - totalIn; // المتبقي خارج الصندوق / مع الموظفين أو المسلمين

  return (
    <Card id="custodySection" className="col-span-full border border-indigo-200/80 bg-white shadow-xs overflow-hidden print:hidden">
      <CardHeader 
        title="جدول العهدة الداخلي (الكاش الخارج والعائد خلال الشفت - داخلي فقط ولا يظهر بالطباعة)" 
        action={
          <div className="flex items-center gap-2 print:hidden">
            <button 
              type="button"
              onClick={() => addCustodyItem('out')} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
              title="إضافة حركة سحب (أخذ من الكاش)"
            >
              <ArrowUpRight size={15} />
              <span>+ سحب (أخذ من الكاش)</span>
            </button>
            <button 
              type="button"
              onClick={() => addCustodyItem('in')} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
              title="إضافة حركة إيداع (أعطى إلى الكاش)"
            >
              <ArrowDownLeft size={15} />
              <span>+ إيداع (أعطى إلى الكاش)</span>
            </button>
          </div>
        }
      />

      <div className="p-2.5 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 text-indigo-900 font-bold">
          <HandCoins size={16} className="text-indigo-600 shrink-0" />
          <span>حركات العهدة اللحظية (سحب / إيداع):</span>
        </div>
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-amber-100/80 px-2.5 py-1 rounded-md text-amber-900 font-bold border border-amber-200 text-xs">
            <span>إجمالي السحب:</span>
            <span dir="ltr" className="font-extrabold">{totalOut.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-100/80 px-2.5 py-1 rounded-md text-emerald-900 font-bold border border-emerald-200 text-xs">
            <span>إجمالي الإيداع:</span>
            <span dir="ltr" className="font-extrabold">{totalIn.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-black border text-xs ${
            netPending > 0 
              ? 'bg-rose-100 text-rose-900 border-rose-300 animate-pulse' 
              : 'bg-indigo-100 text-indigo-900 border-indigo-300'
          }`}>
            <span>{netPending > 0 ? '⚠️ عهدة معلقة خارج الصندوق:' : 'الصافي المعلق:'}</span>
            <span dir="ltr">{netPending.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto max-h-56">
        <table className="w-full text-xs sm:text-sm text-right border-collapse border border-gray-300">
          <thead className="bg-gray-100 border-b border-gray-300 text-gray-700 sticky top-0 z-10">
            <tr>
              <th className="px-1 py-1 font-bold border border-gray-300 w-10 text-center">م</th>
              <th className="px-2 py-1 font-bold border border-gray-300 w-36 text-center">نوع الحركة</th>
              <th className="px-2 py-1 font-bold border border-gray-300 min-w-[200px] text-center">الشخص المستلم / البيان</th>
              <th className="px-2 py-1 font-bold border border-gray-300 w-32 text-center">المبلغ</th>
              <th className="px-1 py-1 w-12 border border-gray-300 print:hidden text-center">حذف</th>
            </tr>
          </thead>
          <tbody>
            {custodyItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-gray-400 bg-gray-50/50 text-xs">
                  <div className="flex items-center justify-center gap-2">
                    <ArrowRightLeft size={16} className="text-gray-300" />
                    <span>لا توجد حركات عهدة مسجلة. (استخدم الأزرار أعلاه لتسجيل أي سحب أو إيداع خلال الشفت).</span>
                  </div>
                </td>
              </tr>
            ) : (
              custodyItems.map((item, index) => {
                const isOut = item.type === 'out';
                return (
                  <tr 
                    key={item.id} 
                    className={`border-b border-gray-300 transition-colors ${
                      isOut ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'bg-emerald-50/30 hover:bg-emerald-50/60'
                    }`}
                  >
                    <td className="px-1 py-1.5 border border-gray-300 text-center text-gray-500 font-bold text-xs">{index + 1}</td>
                    
                    {/* نوع الحركة */}
                    <td className="p-1 border border-gray-300 text-center">
                      <select
                        disabled={isClosed}
                        value={item.type}
                        onChange={(e) => updateData(['custodyItems', index, 'type'], e.target.value)}
                        className={`w-full px-2 py-1 rounded font-bold text-xs outline-none border transition-colors cursor-pointer ${
                          isOut 
                            ? 'bg-amber-100 text-amber-950 border-amber-300 focus:ring-1 focus:ring-amber-500' 
                            : 'bg-emerald-100 text-emerald-950 border-emerald-300 focus:ring-1 focus:ring-emerald-500'
                        }`}
                      >
                        <option value="out">سحب (أخذ من الكاش)</option>
                        <option value="in">إيداع (أعطى إلى الكاش)</option>
                      </select>
                    </td>

                    {/* الشخص أو البيان */}
                    <td className="p-0 border border-gray-300">
                      <input
                        type="text"
                        disabled={isClosed}
                        value={item.personOrReason || ''}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => updateData(['custodyItems', index, 'personOrReason'], e.target.value)}
                        className="w-full h-full px-2.5 py-1.5 bg-transparent outline-none font-bold text-gray-800 text-center focus:bg-white focus:ring-1 focus:ring-indigo-500 text-xs sm:text-sm"
                        placeholder="اسم الشخص أو البيان"
                      />
                    </td>

                    {/* المبلغ */}
                    <td className="p-0 border border-gray-300">
                      <input
                        type="number"
                        inputMode="decimal"
                        pattern="[0-9]*"
                        disabled={isClosed}
                        value={item.amount || ''}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => updateData(['custodyItems', index, 'amount'], Number(e.target.value))}
                        className={`w-full h-full px-2 py-1.5 bg-transparent outline-none text-center font-black text-xs sm:text-sm focus:bg-white focus:ring-1 focus:ring-indigo-500 ${
                          isOut ? 'text-amber-800' : 'text-emerald-800'
                        }`}
                        dir="ltr"
                        placeholder="0.00"
                      />
                    </td>

                    {/* زر الحذف */}
                    <td className="p-0.5 text-center border border-gray-300 print:hidden">
                      <button 
                        type="button"
                        disabled={isClosed}
                        onClick={() => removeCustodyItem(item.id)}
                        className="text-red-500 hover:bg-red-50 hover:text-red-700 p-1 rounded mx-auto block transition-colors disabled:opacity-30"
                        title="حذف الحركة"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
