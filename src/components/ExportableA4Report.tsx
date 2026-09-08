import React, { useMemo } from 'react';
import { useShiftStore } from '../store/useShiftStore';
import { calculateShiftMetrics } from '../lib/shiftCalculations';
import { calculateWage } from './sections2';
import { formatCurrencyExact } from '../lib/utils';
import { getDayLabel } from '../lib/exportUtils';
import restaurantLogo from '../assets/logo.jpeg';

const A4_WIDTH = 1123; // landscape width at 96dpi
const A4_HEIGHT = 794; // landscape height at 96dpi

const Header = ({ title, date }: { title: string; date: string }) => {
  const dayLabel = getDayLabel(date);
  return (
    <div className="flex items-center justify-between border-b-4 border-[#C8102E] pb-3 mb-4 shrink-0">
      <div className="flex items-center gap-4">
        <img 
          src={restaurantLogo} 
          alt="Al Baik Logo" 
          className="w-16 h-16 object-contain rounded-lg border-2 border-[#C8102E]" 
          crossOrigin="anonymous" 
        />
        <div>
          <h1 className="text-2xl font-black text-[#C8102E] mb-1">مطعم يحيى البيك</h1>
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        </div>
      </div>
      <div className="text-left text-sm font-bold text-gray-700 bg-gray-50 border border-gray-200 p-3 rounded-lg shadow-sm">
        <div className="flex justify-end gap-2 mb-1">
          <span className="text-[#C8102E]">التاريخ:</span>
          <span dir="ltr">{date}</span>
        </div>
        <div className="flex justify-end gap-2">
          <span className="text-[#C8102E]">اليوم:</span>
          <span>{dayLabel}</span>
        </div>
      </div>
    </div>
  );
};

const Footer = () => (
  <div className="mt-6 pt-3 border-t-2 border-[#C8102E] flex justify-between items-center text-xs text-gray-600 font-bold shrink-0">
    <div>نظام إدارة الكاش - مطعم يحيى البيك</div>
    <div dir="ltr">Engineered by Eng. Qusai Albdour</div>
  </div>
);

const formatQuantity = (val: number | string) => {
  const num = Number(val) || 0;
  return num % 1 === 0 ? num.toString() : num.toFixed(2);
};

export const ExportableA4Report = () => {
  const data = useShiftStore(state => state.data);
  const metrics = useMemo(() => calculateShiftMetrics(data), [data]);

  // 1. Cash Data Preparation (Right Box in Row 1)
  const newRecItems = (data.addNewReceivables && data.addNewReceivables.length > 0)
    ? data.addNewReceivables.map(item => ({ 
        label: item.label ? `إضافة ذمم: ${item.label}` : 'إضافة ذمم جديدة', 
        amount: item.amount 
      }))
    : ((data.cashAndSales?.addedReceivables || 0) > 0 
        ? [{ label: data.cashAndSales?.addedReceivablesDesc || 'إضافة ذمم جديدة', amount: data.cashAndSales.addedReceivables }] 
        : []);

  const paidOldRecItems = (data.addCashReceivables && data.addCashReceivables.length > 0)
    ? data.addCashReceivables.map(item => ({ 
        label: item.label ? `سداد ذمم: ${item.label}` : 'سداد ذمم قديمة', 
        amount: item.amount 
      }))
    : ((data.cashAndSales?.paidOldReceivables || 0) > 0 
        ? [{ label: data.cashAndSales?.paidOldReceivablesDesc || 'سداد ذمم قديمة', amount: data.cashAndSales.paidOldReceivables }] 
        : []);

  const cashDataInfo = [
    { label: 'النقد الافتتاحي', amount: data.cashAndSales?.openingCash || 0 },
    ...newRecItems,
    ...paidOldRecItems,
    { label: 'مبيعات الكاشير', amount: data.cashAndSales?.sales || 0 },
    { label: 'مبيعات أخرى', amount: data.cashAndSales?.otherSales || 0 },
  ].filter(i => (Number(i.amount) || 0) > 0 || (i.label && i.label.trim() !== ''));

  // 2. Actual Inventory Summary (Left Box in Row 1) - including all tables with data
  const actualInventorySummary = [
    { label: 'النقد الفعلي المعدود', amount: data.actualInventory?.actualCash || 0 },
    { label: 'فيزا', amount: data.actualInventory?.visa || 0 },
    { label: 'RT', amount: data.actualInventory?.rt || 0 },
    { label: 'مايسترو', amount: data.actualInventory?.maestro || 0 },
    { label: 'فرق السعر', amount: data.actualInventory?.priceDifference || 0 },
    ...(metrics.ewalletTotal > 0 ? [{ label: 'المحفظة الإلكترونية', amount: metrics.ewalletTotal }] : []),
    ...(metrics.effectiveAdvances > 0 ? [{ label: 'السلف والمياومات', amount: metrics.effectiveAdvances }] : []),
    ...(metrics.purchasesTotal > 0 ? [{ label: 'مشتريات', amount: metrics.purchasesTotal }] : []),
    ...(metrics.addMerchantTotal > 0 ? [{ label: 'إضافة ذمم تجار', amount: metrics.addMerchantTotal }] : []),
    ...(metrics.payMerchantTotal > 0 ? [{ label: 'سداد ذمم تجار', amount: metrics.payMerchantTotal }] : []),
    ...(metrics.adminExpensesTotal > 0 ? [{ label: 'مصاريف إدارية', amount: metrics.adminExpensesTotal }] : []),
    ...(metrics.yahyaTotal > 0 ? [{ label: 'يحيى', amount: metrics.yahyaTotal }] : []),
    ...(metrics.abuAbdullahTotal > 0 ? [{ label: 'أبو عبدالله', amount: metrics.abuAbdullahTotal }] : []),
    ...(metrics.apartmentTotal > 0 ? [{ label: 'الشقة', amount: metrics.apartmentTotal }] : []),
    ...(metrics.equipmentTotal > 0 ? [{ label: 'معدات وصيانة', amount: metrics.equipmentTotal }] : []),
    ...(metrics.spicesTotal > 0 ? [{ label: 'بهارات', amount: metrics.spicesTotal }] : []),
    ...(metrics.otherExpensesTotal > 0 ? [{ label: 'مصاريف أخرى', amount: metrics.otherExpensesTotal }] : []),
  ].filter(i => (Number(i.amount) || 0) !== 0);

  // 3. Kitchen Consumption (Bottom / Last)
  const kitchenList = [
    { label: 'سيخ 1', amount: data.kitchenConsumption?.skewer1 || 0 },
    { label: 'سيخ 2', amount: data.kitchenConsumption?.skewer2 || 0 },
    { label: 'تزويد', amount: data.kitchenConsumption?.supply || 0 },
    { label: 'مرتجع', amount: data.kitchenConsumption?.return || 0 },
    { label: 'استهلاك رز', amount: data.kitchenConsumption?.rice || 0 },
    { label: 'استهلاك لوز', amount: data.kitchenConsumption?.almond || 0 },
    { label: 'استهلاك بطاطا', amount: data.kitchenConsumption?.potato || 0 },
  ].filter(i => (Number(i.amount) || 0) > 0);

  const hasKitchenData = kitchenList.length > 0;

  // 4. Production Inventory (Row 2)
  const broastedTotal = Number(data.productionInventory?.broasted) || 0;
  const tikkaTotal = Number(data.productionInventory?.tikka) || 0;
  const zingerTotal = Number(data.productionInventory?.zinger) || 0;

  const broastedShift1 = (data.productionInventory as any)?.broastedShift1 ?? (data.productionInventory as any)?.shift1?.broasted ?? '';
  const broastedShift2 = (data.productionInventory as any)?.broastedShift2 ?? (data.productionInventory as any)?.shift2?.broasted ?? '';
  const tikkaShift1 = (data.productionInventory as any)?.tikkaShift1 ?? (data.productionInventory as any)?.shift1?.tikka ?? '';
  const tikkaShift2 = (data.productionInventory as any)?.tikkaShift2 ?? (data.productionInventory as any)?.shift2?.tikka ?? '';
  const zingerShift1 = (data.productionInventory as any)?.zingerShift1 ?? (data.productionInventory as any)?.shift1?.zinger ?? '';
  const zingerShift2 = (data.productionInventory as any)?.zingerShift2 ?? (data.productionInventory as any)?.shift2?.zinger ?? '';

  const hasProductionData = 
    broastedTotal > 0 || tikkaTotal > 0 || zingerTotal > 0 ||
    broastedShift1 !== '' || broastedShift2 !== '' ||
    tikkaShift1 !== '' || tikkaShift2 !== '' ||
    zingerShift1 !== '' || zingerShift2 !== '';

  // 5. Multi-Column Categories Grid (Row 3)
  const cleanItems = (items: any[]) => 
    (items || []).filter(i => (Number(i.amount) || 0) > 0 || (i.label && i.label.trim() !== ''));

  const rawCategories = [
    { title: 'مشتريات', items: cleanItems(data.purchases), total: metrics.purchasesTotal },
    { title: 'إضافة ذمم تجار', items: cleanItems(data.addMerchantReceivables), total: metrics.addMerchantTotal },
    { title: 'مصاريف إدارية', items: cleanItems(data.adminExpenses), total: metrics.adminExpensesTotal },
    { title: 'يحيى', items: cleanItems(data.yahya), total: metrics.yahyaTotal },
    { title: 'سداد ذمم تجار', items: cleanItems(data.payMerchantReceivables), total: metrics.payMerchantTotal },
    { title: 'الشقة', items: cleanItems(data.apartment), total: metrics.apartmentTotal },
    { title: 'معدات وصيانة', items: cleanItems(data.equipment), total: metrics.equipmentTotal },
    { title: 'بهارات', items: cleanItems(data.spices), total: metrics.spicesTotal },
    { title: 'مصاريف أخرى', items: cleanItems(data.otherExpenses), total: metrics.otherExpensesTotal },
    { title: 'أبو عبدالله', items: cleanItems(data.abuAbdullah), total: metrics.abuAbdullahTotal },
  ];

  const categories = rawCategories.filter(cat => 
    cat.items.length > 0 && (cat.total > 0 || cat.items.some(i => (Number(i.amount) || 0) > 0 || (i.label && i.label.trim() !== '')))
  );

  // Employees data
  const employees = (data.employeeAdvances || []).filter(
    e => e.employeeName?.trim() || Number(e.amount) > 0 || calculateWage(e.startTime, e.endTime, e.hourlyRate) > 0
  );
  const hasEmployees = employees.length > 0;

  return (
    <div 
      className="absolute bg-gray-200 pointer-events-none" 
      style={{ left: '-9999px', top: 0, width: A4_WIDTH, display: 'flex', flexDirection: 'column', gap: '30px' }}
      dir="rtl"
    >
      {/* ========================================================================= */}
      {/* 1. MAIN FINANCIAL SHEET (export-a4-page-1) - AUTO HEIGHT, PAPER LAYOUT   */}
      {/* ========================================================================= */}
      <div 
        id="export-a4-page-1"
        data-cash-page="1"
        className="bg-white p-6 flex flex-col mx-auto shadow-2xl relative"
        style={{ width: A4_WIDTH, minHeight: A4_HEIGHT, height: 'auto', boxSizing: 'border-box' }}
      >
        {/* Header */}
        <Header title="تقرير إغلاق الكاش اليومي" date={data.date} />

        {/* ----------------------------------------------------------------------- */}
        {/* ROW 1: Cash Data (Right) & Actual Inventory Summary (Left)              */}
        {/* ----------------------------------------------------------------------- */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Right: بيانات الكاش والمبيعات */}
          <div className="border border-gray-300 bg-white shadow-sm flex flex-col">
            <div className="bg-[#C8102E] text-white text-center font-black py-2 px-3 text-sm sm:text-base border-b border-gray-300">
              بيانات الكاش والمبيعات
            </div>
            <table className="w-full text-xs border-collapse">
              <tbody>
                {cashDataInfo.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'}>
                    <td className="py-1 px-2.5 border-b border-gray-200 text-gray-800 font-bold text-right">{item.label}</td>
                    <td className="py-1 px-2.5 border-b border-gray-200 text-center font-mono font-bold text-gray-900 w-28" dir="ltr">
                      {formatCurrencyExact(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-100 font-black border-t-2 border-gray-300">
                <tr>
                  <td className="py-1.5 px-2.5 text-right text-gray-900 font-black">مجموع الكاش</td>
                  <td className="py-1.5 px-2.5 text-center font-mono text-[#C8102E] font-black text-sm" dir="ltr">
                    {formatCurrencyExact(metrics.totalCash)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Left: ملخص الجرد الفعلي */}
          <div className="border border-gray-300 bg-white shadow-sm flex flex-col">
            <div className="bg-[#C8102E] text-white text-center font-black py-2 px-3 text-sm sm:text-base border-b border-gray-300">
              ملخص الجرد الفعلي
            </div>
            <table className="w-full text-xs border-collapse">
              <tbody>
                {actualInventorySummary.map((item, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'}>
                    <td className="py-1 px-2.5 border-b border-gray-200 text-gray-800 font-bold text-right">{item.label}</td>
                    <td className="py-1 px-2.5 border-b border-gray-200 text-center font-mono font-bold text-gray-900 w-28" dir="ltr">
                      {formatCurrencyExact(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-300">
                <tr className="bg-gray-100 font-black">
                  <td className="py-1.5 px-2.5 text-right text-gray-900 font-black">مجموع الجرد الفعلي</td>
                  <td className="py-1.5 px-2.5 text-center font-mono text-gray-900 font-black text-sm" dir="ltr">
                    {formatCurrencyExact(metrics.totalInventory)}
                  </td>
                </tr>
                {metrics.diff < -0.009 && (
                  <tr className="bg-red-100 text-red-700 font-black">
                    <td className="py-2 px-2.5 text-right font-black">
                      نقص الكاش (عجز) {data.cashierName ? `- الكاشير: ${data.cashierName}` : ''}
                    </td>
                    <td className="py-2 px-2.5 text-center font-mono font-black text-red-600 text-sm" dir="ltr">
                      - {formatCurrencyExact(metrics.cashShortage)}
                    </td>
                  </tr>
                )}
                {metrics.diff > 0.009 && (
                  <tr className="bg-green-100 text-green-800 font-black">
                    <td className="py-2 px-2.5 text-right font-black">
                      زيادة الكاش (فائض) {data.cashierName ? `- الكاشير: ${data.cashierName}` : ''}
                    </td>
                    <td className="py-2 px-2.5 text-center font-mono font-black text-green-700 text-sm" dir="ltr">
                      + {formatCurrencyExact(metrics.cashSurplus)}
                    </td>
                  </tr>
                )}
                {Math.abs(metrics.diff) <= 0.009 && (
                  <tr className="bg-gray-100 text-gray-700 font-bold">
                    <td className="py-2 px-2.5 text-right">
                      فارق الكاش {data.cashierName ? `- الكاشير: ${data.cashierName}` : ''}
                    </td>
                    <td className="py-2 px-2.5 text-center font-mono text-gray-700" dir="ltr">
                      0.00 (متطابق)
                    </td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* ROW 2: Production Inventory (Full or Half width)                        */}
        {/* ----------------------------------------------------------------------- */}
        {hasProductionData && (
          <div className="mb-3">
            <div className="border border-gray-300 bg-white shadow-sm flex flex-col">
              <div className="bg-[#C8102E] text-white text-center font-black py-2 px-3 text-sm sm:text-base border-b border-gray-300">
                جرد الإنتاج
              </div>
              <table className="w-full text-xs border-collapse border border-gray-300 text-center">
                <thead className="bg-gray-100 text-gray-800 font-bold">
                  <tr>
                    <th className="py-1.5 px-3 border border-gray-300 text-right">الصنف</th>
                    <th className="py-1.5 px-3 border border-gray-300">الشفت الأول</th>
                    <th className="py-1.5 px-3 border border-gray-300">الشفت الثاني</th>
                    <th className="py-1.5 px-3 border border-gray-300 bg-red-50 text-[#C8102E]">المجموع</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1.5 px-3 border border-gray-300 font-bold text-right bg-gray-50">بروستد</td>
                    <td className="py-1.5 px-3 border border-gray-300 font-mono" dir="ltr">{broastedShift1 || '-'}</td>
                    <td className="py-1.5 px-3 border border-gray-300 font-mono" dir="ltr">{broastedShift2 || '-'}</td>
                    <td className="py-1.5 px-3 border border-gray-300 font-mono font-black text-gray-900 bg-red-50/50" dir="ltr">
                      {broastedTotal > 0 ? formatQuantity(broastedTotal) : '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 border border-gray-300 font-bold text-right bg-gray-50">تكا</td>
                    <td className="py-1.5 px-3 border border-gray-300 font-mono" dir="ltr">{tikkaShift1 || '-'}</td>
                    <td className="py-1.5 px-3 border border-gray-300 font-mono" dir="ltr">{tikkaShift2 || '-'}</td>
                    <td className="py-1.5 px-3 border border-gray-300 font-mono font-black text-gray-900 bg-red-50/50" dir="ltr">
                      {tikkaTotal > 0 ? formatQuantity(tikkaTotal) : '-'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5 px-3 border border-gray-300 font-bold text-right bg-gray-50">زنجر</td>
                    <td className="py-1.5 px-3 border border-gray-300 font-mono" dir="ltr">{zingerShift1 || '-'}</td>
                    <td className="py-1.5 px-3 border border-gray-300 font-mono" dir="ltr">{zingerShift2 || '-'}</td>
                    <td className="py-1.5 px-3 border border-gray-300 font-mono font-black text-gray-900 bg-red-50/50" dir="ltr">
                      {zingerTotal > 0 ? formatQuantity(zingerTotal) : '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* ROW 3: Multi-Column Expense Categories Grid                             */}
        {/* ----------------------------------------------------------------------- */}
        {categories.length > 0 && (
          <div className={`grid ${categories.length === 6 ? 'grid-cols-6' : 'grid-cols-5'} gap-2.5 items-start mb-3`}>
            {categories.map((cat, idx) => (
              <div key={idx} className="border border-gray-300 bg-white flex flex-col shadow-sm">
                <div className="bg-[#C8102E] text-white text-center font-black py-2 px-1.5 text-xs sm:text-sm border-b border-gray-300 truncate">
                  {cat.title}
                </div>
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-gray-100 text-gray-600 text-[10px] font-bold border-b border-gray-200">
                    <tr>
                      <th className="py-0.5 px-1.5 text-right">البيان</th>
                      <th className="py-0.5 px-1 text-center w-14">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cat.items.map((item, iIdx) => (
                      <tr key={iIdx} className={iIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/70'}>
                        <td 
                          className="py-0.5 px-1.5 border-b border-gray-200 text-gray-800 font-medium text-[11px] text-right truncate max-w-[125px]" 
                          title={item.label}
                        >
                          {item.label}
                        </td>
                        <td 
                          className="py-0.5 px-1 border-b border-gray-200 text-center font-mono font-bold text-gray-900 text-[11px] w-14 whitespace-nowrap" 
                          dir="ltr"
                        >
                          {formatCurrencyExact(item.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-100 font-black border-t border-gray-300">
                    <tr>
                      <td className="py-1 px-1.5 text-right text-gray-900 text-[11px] font-black">المجموع</td>
                      <td 
                        className="py-1 px-1 text-center font-mono text-[#C8102E] font-black text-[11px] w-14 whitespace-nowrap" 
                        dir="ltr"
                      >
                        {formatCurrencyExact(cat.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ))}
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* ROW 4: Kitchen Consumption (At the very bottom / last thing)            */}
        {/* ----------------------------------------------------------------------- */}
        {hasKitchenData && (
          <div className="mt-1 mb-2">
            <div className="border border-gray-300 bg-white shadow-sm flex flex-col">
              <div className="bg-[#C8102E] text-white text-center font-black py-2 px-3 text-sm sm:text-base border-b border-gray-300">
                استهلاك المطبخ
              </div>
              <table className="w-full text-xs border-collapse">
                <tbody>
                  {kitchenList.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="py-1.5 px-3 border-b border-gray-200 text-gray-800 font-bold text-right">{item.label}</td>
                      <td className="py-1.5 px-3 border-b border-gray-200 text-center font-mono font-bold text-gray-900 w-32" dir="ltr">
                        {formatQuantity(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <Footer />
      </div>

      {/* ========================================================================= */}
      {/* 2. EMPLOYEE ADVANCES & ATTENDANCE SHEET (export-a4-page-2)                */}
      {/* ========================================================================= */}
      {hasEmployees && (
        <div 
          id="export-a4-page-2"
          data-emp-page="1"
          className="bg-white p-6 flex flex-col mx-auto shadow-2xl relative"
          style={{ width: A4_WIDTH, minHeight: A4_HEIGHT, height: 'auto', boxSizing: 'border-box' }}
        >
          <Header title="تقرير سلف ومياومات الموظفين" date={data.date} />
          
          <div className="flex-1 overflow-hidden mt-2">
            <table className="w-full text-xs text-right border-collapse border-2 border-gray-300">
              <thead className="bg-[#C8102E] text-white text-[11px]">
                <tr>
                  <th className="py-2 px-3 border border-gray-400 font-black w-8 text-center">#</th>
                  <th className="py-2 px-3 border border-gray-400 font-black">اسم الموظف</th>
                  <th className="py-2 px-3 border border-gray-400 font-black text-center w-20">وقت الحضور</th>
                  <th className="py-2 px-3 border border-gray-400 font-black text-center w-20">وقت الانصراف</th>
                  <th className="py-2 px-3 border border-gray-400 font-black text-center w-20">الأجرة/س</th>
                  <th className="py-2 px-3 border border-gray-400 font-black text-center w-20">المياومة</th>
                  <th className="py-2 px-3 border border-gray-400 font-black text-center w-20">السلفة</th>
                  <th className="py-2 px-3 border border-gray-400 font-black text-center w-32">الملاحظات</th>
                  <th className="py-2 px-3 border border-gray-400 font-black text-center w-20">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp, idx) => {
                  const wage = calculateWage(emp.startTime, emp.endTime, emp.hourlyRate);
                  const advance = Number(emp.amount) || 0;
                  const total = wage + advance;
                  return (
                    <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-200`}>
                      <td className="py-1.5 px-3 border border-gray-300 text-center font-bold text-gray-500">{idx + 1}</td>
                      <td className="py-1.5 px-3 border border-gray-300 font-bold text-gray-900">{emp.employeeName || '-'}</td>
                      <td className="py-1.5 px-3 border border-gray-300 text-center text-gray-700" dir="ltr">{emp.startTime || '-'}</td>
                      <td className="py-1.5 px-3 border border-gray-300 text-center text-gray-700" dir="ltr">{emp.endTime || '-'}</td>
                      <td className="py-1.5 px-3 border border-gray-300 text-center font-mono text-gray-700" dir="ltr">{formatCurrencyExact(Number(emp.hourlyRate) || 0)}</td>
                      <td className="py-1.5 px-3 border border-gray-300 text-center font-mono text-gray-900 font-bold" dir="ltr">{formatCurrencyExact(wage)}</td>
                      <td className="py-1.5 px-3 border border-gray-300 text-center font-mono text-red-600 font-bold" dir="ltr">{formatCurrencyExact(advance)}</td>
                      <td className="py-1.5 px-3 border border-gray-300 text-gray-600 truncate max-w-[120px]" title={emp.notes}>{emp.notes || '-'}</td>
                      <td className="py-1.5 px-3 border border-gray-300 text-center font-mono text-[#C8102E] font-black" dir="ltr">{formatCurrencyExact(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-100">
                <tr>
                  <td colSpan={8} className="py-2 px-3 border border-gray-300 font-black text-gray-900 text-left">
                    إجمالي السلف والمياومات الكلي
                  </td>
                  <td className="py-2 px-3 border border-gray-300 text-center font-mono text-[#C8102E] font-black text-sm" dir="ltr">
                    {formatCurrencyExact(metrics.advancesTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <Footer />
        </div>
      )}
    </div>
  );
};
