import React from 'react';
import { useShiftStore } from '../store/useShiftStore';
import { useCalculations } from '../hooks/useCalculations';
import { useValidationStore } from '../store/useValidationStore';
import { Card, CardHeader, CardContent } from './ui';
import { Plus, Trash2, AlertCircle, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';

export const CashDataSection = React.memo(() => {
  const cashAndSales = useShiftStore(state => state.data.cashAndSales);
  const addCashReceivables = useShiftStore(state => state.data.addCashReceivables) || [];
  const addNewReceivables = useShiftStore(state => state.data.addNewReceivables) || [];
  const updateData = useShiftStore(state => state.updateData);
  const addLineItem = useShiftStore(state => state.addLineItem);
  const removeLineItem = useShiftStore(state => state.removeLineItem);
  const { totalCash } = useCalculations();
  
  const errorMessage = useValidationStore(state => state.errors['cashData']);
  const clearError = useValidationStore(state => state.clearError);
  const hasError = Boolean(errorMessage);

  const handleInputChange = (path: (string | number)[], value: any) => {
    updateData(path, value);
    if (errorMessage && (Number(value) > 0 || (path[1] === 'sales' && Number(value) > 0))) {
      clearError('cashData');
    }
  };

  const isEmpty = totalCash === 0 && 
    !cashAndSales.openingCash && 
    !cashAndSales.sales && 
    !cashAndSales.otherSales && 
    (!addNewReceivables.length || addNewReceivables.every(i => !i.label && !i.amount)) && 
    (!addCashReceivables.length || addCashReceivables.every(i => !i.label && !i.amount));

  return (
    <Card 
      id="cashData" 
      data-empty={isEmpty}
      className={cn(
        "border-2 border-indigo-400 shadow-sm bg-indigo-50/10",
        hasError && "ring-3 ring-rose-500 border-rose-500 shadow-md shadow-rose-100"
      )}
    >
      <CardHeader 
        title="بيانات الكاش والمبيعات" 
        headerClassName="bg-indigo-600 text-white border-b border-indigo-700"
        isError={hasError}
        errorMessage={errorMessage}
        badge={totalCash > 0 ? (
          <span className="text-xs font-black bg-white text-indigo-900 px-2 py-0.5 rounded-md border border-indigo-200">
            {totalCash.toLocaleString('en-US')}
          </span>
        ) : undefined}
      />
      
      {hasError && (
        <div className="bg-rose-50 px-3 py-1.5 border-b border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-1.5">
          <AlertCircle size={14} className="shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <CardContent>
        <table className="w-full text-xs sm:text-sm text-right border-collapse border border-gray-300">
          <tbody>
            <tr className="border-b border-gray-300">
              <td className="px-2 py-1.5 bg-gray-50 border border-gray-300 font-bold text-gray-700 w-1/2 text-center">النقد الافتتاحي</td>
              <td className="p-0 border border-gray-300">
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  value={cashAndSales.openingCash || ''}
                  onFocus={(e) => e.target.select()}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) => handleInputChange(['cashAndSales', 'openingCash'], Number(e.target.value))}
                  className="w-full h-full px-2 py-1.5 bg-transparent outline-none text-center focus:bg-amber-50/80 focus:font-black focus:text-base sm:focus:text-lg focus:text-indigo-900 transition-all duration-150"
                  dir="ltr" placeholder="0"
                />
              </td>
            </tr>
            {useShiftStore(state => state.data.addNewReceivables || []).map((item, index, arr) => {
              const isItemEmpty = !item.label && !item.amount;
              return (
                <tr key={item.id} className={cn("border-b border-gray-300 relative group", isItemEmpty && "print:hidden export-empty-row")}>
                  <td className="p-0 bg-gray-50 border border-gray-300 w-1/2">
                    <div className="flex flex-col sm:flex-row h-full relative">
                      <div className="relative flex items-center justify-center min-w-[80px] bg-gray-50 px-2 py-1.5 border-b sm:border-b-0 sm:border-r-0 border-gray-300">
                        {index === 0 && (
                          <button 
                            onClick={() => addLineItem('addNewReceivables')}
                            className="absolute top-1 right-1 text-emerald-600 hover:bg-emerald-100 rounded print:hidden cursor-pointer"
                            title="إضافة بند جديد"
                          >
                            <Plus size={14} />
                          </button>
                        )}
                        {index > 0 && (
                          <button 
                            onClick={() => removeLineItem('addNewReceivables', item.id)}
                            className="absolute top-1 right-1 text-red-600 hover:bg-red-100 rounded print:hidden cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        <span className="font-bold text-gray-700 whitespace-nowrap text-xs">إضافة ذمم جديدة</span>
                      </div>
                      <input 
                        type="text" 
                        value={item.label || ''} 
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const row = (e.target as HTMLElement).closest('tr');
                            const amountInput = row?.querySelector('input[type="number"]') as HTMLInputElement;
                            amountInput?.focus();
                          }
                        }}
                        onChange={(e) => {
                          updateData(['addNewReceivables', index, 'label'], e.target.value);
                          if (index === arr.length - 1 && e.target.value) {
                            addLineItem('addNewReceivables');
                          }
                        }} 
                        className="w-full px-2 py-1 bg-white outline-none border-t sm:border-t-0 sm:border-r border-gray-300 text-xs text-center focus:bg-amber-50 focus:font-bold" 
                        placeholder="البيان..." 
                      />
                    </div>
                  </td>
                  <td className="p-0 border border-gray-300">
                    <input
                      type="number"
                      inputMode="decimal"
                      pattern="[0-9]*"
                      value={item.amount || ''}
                      onFocus={(e) => e.target.select()}
                      onWheel={(e) => e.currentTarget.blur()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Tab') {
                          e.preventDefault();
                          if (index === arr.length - 1) {
                            if (!item.label && !item.amount) return;
                            addLineItem('addNewReceivables');
                            setTimeout(() => {
                              const row = (e.target as HTMLElement).closest('tr');
                              const nextRow = row?.nextElementSibling;
                              const nextLabelInput = nextRow?.querySelector('input[type="text"]') as HTMLInputElement;
                              nextLabelInput?.focus();
                            }, 10);
                          } else {
                            const row = (e.target as HTMLElement).closest('tr');
                            const nextRow = row?.nextElementSibling;
                            const nextLabelInput = nextRow?.querySelector('input[type="text"]') as HTMLInputElement;
                            nextLabelInput?.focus();
                          }
                        }
                      }}
                      onChange={(e) => {
                        updateData(['addNewReceivables', index, 'amount'], Number(e.target.value));
                        if (index === arr.length - 1 && Number(e.target.value) > 0) {
                          addLineItem('addNewReceivables');
                        }
                      }}
                      className="w-full h-full px-2 py-1.5 bg-transparent outline-none text-center focus:bg-amber-50/80 focus:font-black focus:text-base sm:focus:text-lg focus:text-indigo-900 transition-all duration-150"
                      dir="ltr" placeholder="0"
                    />
                  </td>
                </tr>
              );
            })}
            {addCashReceivables.map((item, index) => {
              const isItemEmpty = !item.label && !item.amount;
              return (
                <tr key={item.id} className={cn("border-b border-gray-300 relative group", isItemEmpty && "print:hidden export-empty-row")}>
                  <td className="p-0 bg-gray-50 border border-gray-300 w-1/2">
                    <div className="flex flex-col sm:flex-row h-full relative">
                      <div className="relative flex items-center justify-center min-w-[80px] bg-gray-50 px-2 py-1.5 border-b sm:border-b-0 sm:border-r-0 border-gray-300">
                        {index === 0 && (
                          <button 
                            onClick={() => addLineItem('addCashReceivables')}
                            className="absolute top-1 right-1 text-emerald-600 hover:bg-emerald-100 rounded print:hidden cursor-pointer"
                            title="إضافة بند جديد"
                          >
                            <Plus size={14} />
                          </button>
                        )}
                        {index > 0 && (
                          <button 
                            onClick={() => removeLineItem('addCashReceivables', item.id)}
                            className="absolute top-1 right-1 text-red-600 hover:bg-red-100 rounded print:hidden cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        <span className="font-bold text-gray-700 whitespace-nowrap text-xs">سداد ذمم قديمة</span>
                      </div>
                      <input 
                        type="text" 
                        value={item.label || ''} 
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const row = (e.target as HTMLElement).closest('tr');
                            const amountInput = row?.querySelector('input[type="number"]') as HTMLInputElement;
                            amountInput?.focus();
                          }
                        }}
                        onChange={(e) => {
                          updateData(['addCashReceivables', index, 'label'], e.target.value);
                          if (index === addCashReceivables.length - 1 && e.target.value) {
                            addLineItem('addCashReceivables');
                          }
                        }} 
                        className="w-full px-2 py-1 bg-white outline-none border-t sm:border-t-0 sm:border-r border-gray-300 text-xs text-center focus:bg-amber-50 focus:font-bold" 
                        placeholder="التفاصيل..." 
                      />
                    </div>
                  </td>
                  <td className="p-0 border border-gray-300">
                    <input
                      type="number"
                      inputMode="decimal"
                      pattern="[0-9]*"
                      value={item.amount || ''}
                      onFocus={(e) => e.target.select()}
                      onWheel={(e) => e.currentTarget.blur()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Tab') {
                          e.preventDefault();
                          if (index === addCashReceivables.length - 1) {
                            if (!item.label && !item.amount) return;
                            addLineItem('addCashReceivables');
                            setTimeout(() => {
                              const row = (e.target as HTMLElement).closest('tr');
                              const nextRow = row?.nextElementSibling;
                              const nextLabelInput = nextRow?.querySelector('input[type="text"]') as HTMLInputElement;
                              nextLabelInput?.focus();
                            }, 10);
                          } else {
                            const row = (e.target as HTMLElement).closest('tr');
                            const nextRow = row?.nextElementSibling;
                            const nextLabelInput = nextRow?.querySelector('input[type="text"]') as HTMLInputElement;
                            nextLabelInput?.focus();
                          }
                        }
                      }}
                      onChange={(e) => {
                        updateData(['addCashReceivables', index, 'amount'], Number(e.target.value));
                        if (index === addCashReceivables.length - 1 && Number(e.target.value) > 0) {
                          addLineItem('addCashReceivables');
                        }
                      }}
                      className="w-full h-full px-2 py-1.5 bg-transparent outline-none text-center focus:bg-amber-50/80 focus:font-black focus:text-base sm:focus:text-lg focus:text-indigo-900 transition-all duration-150"
                      dir="ltr" placeholder="0"
                    />
                  </td>
                </tr>
              );
            })}
            <tr className="border-b border-gray-300">
              <td className="px-2 py-1.5 bg-gray-50 border border-gray-300 font-bold text-gray-700 w-1/2 text-center">مبيعات</td>
              <td className="p-0 border border-gray-300">
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  value={cashAndSales.sales || ''}
                  onFocus={(e) => e.target.select()}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) => handleInputChange(['cashAndSales', 'sales'], Number(e.target.value))}
                  className="w-full h-full px-2 py-1.5 bg-transparent outline-none text-center focus:bg-amber-50/80 focus:font-black focus:text-base sm:focus:text-lg focus:text-blue-900 transition-all duration-150"
                  dir="ltr" placeholder="0"
                />
              </td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="px-2 py-1.5 bg-gray-50 border border-gray-300 font-bold text-gray-700 w-1/2 text-center">مبيعات أخرى</td>
              <td className="p-0 border border-gray-300">
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  value={cashAndSales.otherSales || ''}
                  onFocus={(e) => e.target.select()}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) => handleInputChange(['cashAndSales', 'otherSales'], Number(e.target.value))}
                  className="w-full h-full px-2 py-1.5 bg-transparent outline-none text-center focus:bg-amber-50/80 focus:font-black focus:text-base sm:focus:text-lg focus:text-indigo-900 transition-all duration-150"
                  dir="ltr" placeholder="0"
                />
              </td>
            </tr>
            <tr className="border-b border-gray-300 bg-gray-100 font-bold">
              <td className="px-2 py-2 border border-gray-300 text-gray-900 text-center text-sm">مجموع الكاش</td>
              <td className="px-2 py-2 border border-gray-300 text-center text-sm font-black" dir="ltr">{totalCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
});

CashDataSection.displayName = 'CashDataSection';

export const ActualInventorySection = React.memo(() => {
  const data = useShiftStore(state => state.data.actualInventory);
  const cashierName = useShiftStore(state => state.data.cashierName);
  const updateData = useShiftStore(state => state.updateData);
  const calc = useCalculations();

  const errorMessage = useValidationStore(state => state.errors['actualInventory']);
  const clearError = useValidationStore(state => state.clearError);
  const hasError = Boolean(errorMessage);

  const handleInputChange = (fieldKey: string, value: number) => {
    updateData(['actualInventory', fieldKey], value);
    if (errorMessage && value > 0) {
      clearError('actualInventory');
    }
  };

  const scrollToTable = (targetId: string) => {
    if (!targetId) return;
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-indigo-500', 'ring-offset-2');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-indigo-500', 'ring-offset-2');
      }, 2000);
    }
  };

  const inputFields = [
    { key: 'actualCash', label: 'نقد (الكاش الفعلي)', targetId: 'cashData' },
    { key: 'visa', label: 'فيزا', targetId: 'cashData' },
    { key: 'rt', label: 'Rt', targetId: 'cashData' },
    { key: 'maestro', label: 'مايسترو', targetId: 'cashData' },
    { key: 'priceDifference', label: 'فرق سعر', targetId: 'cashData' },
    { key: 'advances', label: 'سلف', targetId: 'employeeAdvances' },
  ];

  const displayFields = [
    { label: 'مشتريات', value: calc.purchasesTotal, targetId: 'purchases', manualKey: 'manualPurchases' },
    { label: 'سداد ذمم تجار', value: calc.payMerchantTotal, targetId: 'payMerchantReceivables', manualKey: 'manualPayMerchant' },
    { label: 'مصاريف أخرى', value: calc.otherExpensesTotal, targetId: 'otherExpenses', manualKey: 'manualOtherExpenses' },
    { label: 'الشقة', value: calc.apartmentTotal, targetId: 'apartment', manualKey: 'manualApartment' },
    { label: 'مصاريف إدارية', value: calc.adminExpensesTotal, targetId: 'adminExpenses', manualKey: 'manualAdminExpenses' },
    { label: 'يحيى', value: calc.yahyaTotal, targetId: 'yahya', manualKey: 'manualYahya' },
    { label: 'أبو عبدالله', value: calc.abuAbdullahTotal, targetId: 'abuAbdullah', manualKey: 'manualAbuAbdullah' },
    { label: 'بهارات', value: calc.spicesTotal, targetId: 'spices', manualKey: 'manualSpices' },
    { label: 'معدات وصيانة', value: calc.equipmentTotal, targetId: 'equipment', manualKey: 'manualEquipment' },
  ];

  const isEmpty = calc.totalInventory === 0 && !Object.values(data).some(val => Boolean(val));

  return (
    <Card 
      id="actualInventory"
      data-empty={isEmpty}
      className={cn(
        "border-2 border-emerald-400 shadow-sm bg-emerald-50/10",
        hasError && "ring-3 ring-rose-500 border-rose-500 shadow-md shadow-rose-100"
      )}
    >
      <CardHeader 
        title="ملخص الجرد الفعلي" 
        headerClassName="bg-emerald-600 text-white border-b border-emerald-700"
        isError={hasError}
        errorMessage={errorMessage}
        badge={calc.totalInventory > 0 ? (
          <span className="text-xs font-black bg-white text-emerald-900 px-2 py-0.5 rounded-md border border-emerald-200">
            {calc.totalInventory.toLocaleString('en-US')}
          </span>
        ) : undefined}
      />

      {hasError && (
        <div className="bg-rose-50 px-3 py-1.5 border-b border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-1.5">
          <AlertCircle size={14} className="shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <CardContent>
        <table className="w-full text-xs sm:text-sm text-right border-collapse border border-gray-300">
          <tbody>
            {inputFields.map(field => (
              <tr key={field.key} className="border-b border-gray-300">
                <td 
                  onClick={() => scrollToTable(field.targetId)}
                  className="px-2 py-1.5 bg-gray-50 border border-gray-300 font-bold text-gray-700 w-1/2 text-center cursor-pointer hover:bg-indigo-100/60 transition-colors group"
                  title={`انقر للانتقال إلى جدول ${field.label}`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{field.label}</span>
                    <ExternalLink size={11} className="text-indigo-500 opacity-40 group-hover:opacity-100 print:hidden shrink-0" />
                  </div>
                </td>
                <td className="p-0 border border-gray-300">
                  <input
                    type="number"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    value={data[field.key as keyof typeof data] || ''}
                    onFocus={(e) => e.target.select()}
                    onWheel={(e) => e.currentTarget.blur()}
                    onChange={(e) => handleInputChange(field.key, Number(e.target.value))}
                    className="w-full h-full px-2 py-1.5 bg-transparent outline-none text-center focus:bg-amber-50/80 focus:font-black focus:text-base sm:focus:text-lg focus:text-indigo-900 transition-all duration-150"
                    dir="ltr"
                    placeholder="0"
                  />
                </td>
              </tr>
            ))}
            <tr className="border-b border-gray-300 hover:bg-indigo-50/80 transition-colors group">
              <td 
                onClick={() => scrollToTable('ewallet')}
                className="px-2 py-1.5 bg-gray-50 group-hover:bg-indigo-100/60 border border-gray-300 font-bold text-gray-700 text-center cursor-pointer"
                title="انقر للانتقال لمعاينة جدول المحفظة الإلكترونية"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>المحفظة</span>
                  <ExternalLink size={11} className="text-indigo-500 opacity-40 group-hover:opacity-100 print:hidden shrink-0" />
                </div>
              </td>
              <td className="p-2 border border-gray-300 text-center font-bold text-indigo-900 bg-indigo-50/30" dir="ltr">
                {calc.ewalletTotal > 0 ? calc.ewalletTotal.toLocaleString('en-US') : '0'}
              </td>
            </tr>
            {displayFields.map((field, idx) => {
              // Calculate table sum: totalValue - manualValue
              const manualValue = Number(data[field.manualKey as keyof typeof data]) || 0;
              const tableSum = field.value - manualValue;
              const hasMismatch = manualValue !== 0;

              return (
                <tr 
                  key={idx}
                  className={cn(
                    "border-b border-gray-300 hover:bg-indigo-50/80 transition-colors group relative",
                    hasMismatch && "bg-rose-50 hover:bg-rose-100"
                  )}
                >
                  <td 
                    onClick={() => scrollToTable(field.targetId)}
                    className={cn(
                      "px-2 py-1.5 bg-gray-50 group-hover:bg-indigo-100/60 border border-gray-300 font-bold text-gray-700 text-center cursor-pointer",
                      hasMismatch && "bg-rose-50 group-hover:bg-rose-100 text-rose-700"
                    )}
                    title={`انقر للانتقال لمعاينة بيانات جدول ${field.label}`}
                  >
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="flex items-center gap-1">
                        <span>{field.label}</span>
                        <ExternalLink size={11} className={cn("opacity-40 group-hover:opacity-100 print:hidden shrink-0", hasMismatch ? "text-rose-500" : "text-indigo-500")} />
                      </div>
                      {hasMismatch && (
                        <span className="text-[9px] text-rose-600 font-black print:hidden">
                          (يوجد فرق)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-0 border border-gray-300 relative group">
                    <input
                      type="number"
                      inputMode="decimal"
                      pattern="[0-9]*"
                      value={field.value || ''}
                      onFocus={(e) => e.target.select()}
                      onWheel={(e) => e.currentTarget.blur()}
                      onChange={(e) => {
                        const newTotal = Number(e.target.value);
                        const newManual = newTotal - tableSum;
                        handleInputChange(field.manualKey, newManual);
                      }}
                      className={cn(
                        "w-full h-full px-2 py-1.5 bg-transparent outline-none text-center font-black transition-all duration-150",
                        hasMismatch ? "text-rose-700 focus:bg-rose-100" : "text-indigo-900 focus:bg-amber-50/80",
                        "focus:text-base sm:focus:text-lg"
                      )}
                      dir="ltr"
                      placeholder="0"
                    />
                    {hasMismatch ? (
                      <div className="absolute left-1 top-1/2 -translate-y-1/2 flex flex-col items-start pointer-events-none print:hidden">
                        <span className="text-[9px] text-rose-500 font-bold leading-tight">الجدول: {tableSum}</span>
                        <span className="text-[9px] text-rose-600 font-black leading-tight">الفرق: {manualValue > 0 ? `+${manualValue}` : manualValue}</span>
                      </div>
                    ) : (
                      tableSum > 0 && (
                        <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] text-indigo-400 font-bold pointer-events-none print:hidden opacity-0 group-hover:opacity-100 transition-opacity">
                          جدول: {tableSum}
                        </span>
                      )
                    )}
                  </td>
                </tr>
              );
            })}
            <tr 
              onClick={() => scrollToTable('actualInventory')}
              className="border-b border-gray-300 font-bold bg-gray-100 hover:bg-indigo-100/40 cursor-pointer transition-colors"
              title="مجموع الجرد الفعلي الإجمالي"
            >
              <td className="px-2 py-2 border border-gray-300 text-gray-900 text-center text-sm">مجموع الجرد</td>
              <td className="px-2 py-2 border border-gray-300 text-center text-sm font-black text-indigo-900" dir="ltr">{calc.totalInventory.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr 
              onClick={() => scrollToTable('cashData')}
              className={cn(
                "border-b border-gray-300 font-bold text-red-700 bg-red-50 hover:bg-red-100/80 cursor-pointer transition-colors",
                calc.cashShortage > 0 && "bg-rose-100/80 text-rose-800"
              )}
              title="انقر للانتقال لجدول بيانات الكاش والمبيعات"
            >
              <td className="px-2 py-2 border border-gray-300 text-center">
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <span>نقص الكاش</span>
                  {calc.cashShortage > 0 && (
                    <span className={cn("text-[11px] font-extrabold", cashierName ? "text-rose-900" : "text-rose-600 animate-pulse")}>
                      {cashierName ? `(${cashierName})` : '⚠️ يرجى تحديد اسم الكاشير بالأسفل'}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-2 py-2 border border-gray-300 text-center font-black" dir="ltr">
                {calc.cashShortage > 0 ? (
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <span className="text-sm font-black text-rose-700">-{calc.cashShortage.toFixed(2)}</span>
                    {cashierName && (
                      <span className="text-xs font-bold text-rose-900 bg-rose-200/70 px-1.5 py-0.5 rounded border border-rose-300">
                        ({cashierName})
                      </span>
                    )}
                  </div>
                ) : '-'}
              </td>
            </tr>
            <tr 
              onClick={() => scrollToTable('cashData')}
              className={cn(
                "border-b border-gray-300 font-bold text-green-700 bg-green-50 hover:bg-green-100/80 cursor-pointer transition-colors",
                calc.cashSurplus > 0 && "bg-emerald-100/80 text-emerald-900"
              )}
              title="انقر للانتقال لجدول بيانات الكاش والمبيعات"
            >
              <td className="px-2 py-2 border border-gray-300 text-center">
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <span>زيادة الكاش</span>
                  {calc.cashSurplus > 0 && (
                    <span className={cn("text-[11px] font-extrabold", cashierName ? "text-emerald-900" : "text-emerald-700 animate-pulse")}>
                      {cashierName ? `(${cashierName})` : '⚠️ يرجى تحديد اسم الكاشير بالأسفل'}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-2 py-2 border border-gray-300 text-center font-black" dir="ltr">
                {calc.cashSurplus > 0 ? (
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <span className="text-sm font-black text-emerald-700">+{calc.cashSurplus.toFixed(2)}</span>
                    {cashierName && (
                      <span className="text-xs font-bold text-emerald-900 bg-emerald-200/70 px-1.5 py-0.5 rounded border border-emerald-300">
                        ({cashierName})
                      </span>
                    )}
                  </div>
                ) : '-'}
              </td>
            </tr>
            <tr className={cn(
              "font-bold transition-colors",
              (calc.cashShortage > 0 || calc.cashSurplus > 0) && !cashierName
                ? "bg-rose-100 border-2 border-rose-500 text-rose-900"
                : "bg-blue-50 text-blue-900"
            )}>
              <td className="px-2 py-2 border border-gray-300 text-center text-xs sm:text-sm">
                <span>الكاشير المسؤول / المستلم</span>
                {(calc.cashShortage > 0 || calc.cashSurplus > 0) && !cashierName && (
                  <span className="block text-[10px] text-rose-700 font-extrabold mt-0.5 print:hidden">
                    (تحديد الكاشير إجباري لتسجيل النقص/الزيادة)
                  </span>
                )}
              </td>
              <td className="p-1 border border-gray-300 text-center">
                <div className="relative w-full">
                  <select
                    value={cashierName || ''}
                    onChange={(e) => updateData(['cashierName'], e.target.value)}
                    className={cn(
                      "w-full px-2 py-1.5 bg-white border-2 rounded-lg text-xs sm:text-sm font-extrabold text-center cursor-pointer outline-none transition-all print:hidden",
                      (calc.cashShortage > 0 || calc.cashSurplus > 0) && !cashierName
                        ? "border-rose-500 text-rose-800 bg-rose-50 animate-pulse ring-2 ring-rose-400"
                        : "border-blue-300 text-blue-950 focus:border-blue-600 focus:ring-2 focus:ring-blue-200"
                    )}
                  >
                    <option value="">-- اختر اسم الكاشير والشفت --</option>
                    <option value="قصي البدور (صباحي)">قصي البدور (صباحي)</option>
                    <option value="قصي البدور (مسائي)">قصي البدور (مسائي)</option>
                    <option value="أمجد شحادات (صباحي)">أمجد شحادات (صباحي)</option>
                    <option value="أمجد شحادات (مسائي)">أمجد شحادات (مسائي)</option>
                  </select>
                  <span className="hidden print:inline font-black text-sm text-gray-900">
                    {cashierName || 'غير محدد'}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
});

ActualInventorySection.displayName = 'ActualInventorySection';

