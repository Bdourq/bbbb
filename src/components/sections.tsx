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
              <td className="px-2 py-1.5 bg-gray-100 border border-gray-300 font-extrabold text-gray-900 w-1/2 text-center">النقد الافتتاحي</td>
              <td className="p-0 border border-gray-300">
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  value={cashAndSales.openingCash || ''}
                  onFocus={(e) => e.target.select()}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) => handleInputChange(['cashAndSales', 'openingCash'], Number(e.target.value))}
                  className="w-full h-full px-2 py-1.5 bg-transparent outline-none text-center font-extrabold text-slate-950 focus:bg-amber-50/80 focus:font-black focus:text-base sm:focus:text-lg focus:text-indigo-900 transition-all duration-150"
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
  const shiftDifferences = useShiftStore(state => state.data.shiftDifferences) || {
    morning: { cashierName: '', type: 'exact', amount: 0, notes: '' },
    evening: { cashierName: '', type: 'exact', amount: 0, notes: '' }
  };
  const shiftHandover = useShiftStore(state => state.data.shiftHandover);
  const updateData = useShiftStore(state => state.updateData);
  const calc = useCalculations();

  const morningDiff = shiftDifferences.morning || { cashierName: '', type: 'exact', amount: 0, notes: '' };
  const eveningDiff = shiftDifferences.evening || { cashierName: '', type: 'exact', amount: 0, notes: '' };

  const errorMessage = useValidationStore(state => state.errors['actualInventory']);
  const clearError = useValidationStore(state => state.clearError);
  const hasError = Boolean(errorMessage);

  const handleInputChange = (fieldKey: string, value: number) => {
    updateData(['actualInventory', fieldKey], value);
    if (errorMessage && value > 0) {
      clearError('actualInventory');
    }
  };

  const handleUpdateMorning = (field: string, val: any) => {
    updateData(['shiftDifferences', 'morning', field], val);
  };

  const handleUpdateEvening = (field: string, val: any) => {
    updateData(['shiftDifferences', 'evening', field], val);
    if (field === 'cashierName' && val) {
      updateData(['cashierName'], val);
    }
  };

  const applyFullToMorning = () => {
    const isShortage = calc.cashShortage > 0;
    const amount = isShortage ? calc.cashShortage : calc.cashSurplus;
    const type = isShortage ? 'shortage' : calc.cashSurplus > 0 ? 'surplus' : 'exact';
    updateData(['shiftDifferences', 'morning'], {
      cashierName: morningDiff.cashierName || 'قصي البدور',
      type,
      amount: Number(amount.toFixed(2)),
      notes: ''
    });
    updateData(['shiftDifferences', 'evening'], {
      cashierName: eveningDiff.cashierName || cashierName || 'أمجد شحادات',
      type: 'exact',
      amount: 0,
      notes: ''
    });
  };

  const applyFullToEvening = () => {
    const isShortage = calc.cashShortage > 0;
    const amount = isShortage ? calc.cashShortage : calc.cashSurplus;
    const type = isShortage ? 'shortage' : calc.cashSurplus > 0 ? 'surplus' : 'exact';
    updateData(['shiftDifferences', 'morning'], {
      cashierName: morningDiff.cashierName || 'قصي البدور',
      type: 'exact',
      amount: 0,
      notes: ''
    });
    updateData(['shiftDifferences', 'evening'], {
      cashierName: eveningDiff.cashierName || cashierName || 'أمجد شحادات',
      type,
      amount: Number(amount.toFixed(2)),
      notes: ''
    });
    if (!cashierName) {
      updateData(['cashierName'], eveningDiff.cashierName || 'أمجد شحادات');
    }
  };

  const syncFromHandover = () => {
    if (!shiftHandover) return;
    const diff = shiftHandover.difference || 0;
    const type = diff < -0.009 ? 'shortage' : diff > 0.009 ? 'surplus' : 'exact';
    updateData(['shiftDifferences', 'morning'], {
      cashierName: shiftHandover.morningCashier || 'قصي البدور',
      type,
      amount: Number(Math.abs(diff).toFixed(2)),
      notes: 'مسحوب من تسليم الشفت'
    });
    if (shiftHandover.eveningCashier) {
      updateData(['shiftDifferences', 'evening', 'cashierName'], shiftHandover.eveningCashier);
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
            {/* توثيق فوارق الشفت الصباحي والمسائي بحال وجود نقص أو زيادة */}
            {(calc.cashShortage > 0 || calc.cashSurplus > 0 || morningDiff.amount > 0 || eveningDiff.amount > 0) ? (
              <>
                {/* صف تفاصيل الشفت الصباحي */}
                <tr className="bg-amber-50/80 border-b border-gray-300 font-bold text-xs sm:text-sm">
                  <td className="px-2 py-2 border border-gray-300 text-center">
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <span className="text-amber-950 font-black">☀️ الشفت الصباحي</span>
                      <span className="text-[11px] text-amber-800">
                        ({morningDiff.cashierName || 'كاشير صباحي'})
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-2 border border-gray-300 text-center font-black" dir="ltr">
                    {morningDiff.amount > 0 ? (
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs sm:text-sm font-black inline-block",
                        morningDiff.type === 'shortage' ? "text-rose-700 bg-rose-100 border border-rose-300" : "text-emerald-700 bg-emerald-100 border border-emerald-300"
                      )}>
                        {morningDiff.type === 'shortage' ? '-' : '+'}{morningDiff.amount.toFixed(2)} د.أ ({morningDiff.type === 'shortage' ? 'عجز' : 'زيادة'})
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-bold text-xs">مطابق (0.00)</span>
                    )}
                  </td>
                </tr>

                {/* صف تفاصيل الشفت المسائي */}
                <tr className="bg-indigo-50/80 border-b border-gray-300 font-bold text-xs sm:text-sm">
                  <td className="px-2 py-2 border border-gray-300 text-center">
                    <div className="flex flex-col items-center justify-center gap-0.5">
                      <span className="text-indigo-950 font-black">🌙 الشفت المسائي</span>
                      <span className="text-[11px] text-indigo-800">
                        ({eveningDiff.cashierName || cashierName || 'كاشير مسائي'})
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-2 border border-gray-300 text-center font-black" dir="ltr">
                    {eveningDiff.amount > 0 ? (
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs sm:text-sm font-black inline-block",
                        eveningDiff.type === 'shortage' ? "text-rose-700 bg-rose-100 border border-rose-300" : "text-emerald-700 bg-emerald-100 border border-emerald-300"
                      )}>
                        {eveningDiff.type === 'shortage' ? '-' : '+'}{eveningDiff.amount.toFixed(2)} د.أ ({eveningDiff.type === 'shortage' ? 'عجز' : 'زيادة'})
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-bold text-xs">مطابق (0.00)</span>
                    )}
                  </td>
                </tr>
              </>
            ) : (
              <tr className="bg-emerald-50/60 text-emerald-900 font-semibold border-b border-gray-300">
                <td colSpan={2} className="px-3 py-2 text-center text-xs">
                  <span className="inline-flex items-center justify-center gap-1.5 font-bold text-emerald-800">
                    <span className="text-sm">✨</span>
                    <span>الكاش مطابق تماماً (لا يوجد نقص أو زيادة) — لا يتطلب تحديد الكاشير والشفت</span>
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* لوحة التحكم بتسجيل وتوزيع فوارق الشفتين الصباحي والمسائي */}
        {(calc.cashShortage > 0 || calc.cashSurplus > 0 || morningDiff.amount > 0 || eveningDiff.amount > 0) && (
          <div className="mt-4 p-3.5 bg-gradient-to-br from-slate-50 to-indigo-50/40 border-2 border-indigo-200 rounded-xl space-y-3 print:hidden">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-indigo-100 pb-2">
              <span className="text-xs sm:text-sm font-black text-indigo-950 flex items-center gap-1.5">
                <span>📝</span>
                <span>تحديد وتوزيع عجز / زيادة الشفتين (الصباحي والمسائي):</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={applyFullToMorning}
                  className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
                  title="تسجيل كامل الفرق المالي على الشفت الصباحي"
                >
                  ⚡ كامل الفرق على الصباحي
                </button>
                <button
                  type="button"
                  onClick={applyFullToEvening}
                  className="px-2.5 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border border-indigo-300 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
                  title="تسجيل كامل الفرق المالي على الشفت المسائي"
                >
                  ⚡ كامل الفرق على المسائي
                </button>
                {shiftHandover && (
                  <button
                    type="button"
                    onClick={syncFromHandover}
                    className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
                    title="مزامنة تلقائية من بيانات تسليم الشفت الصباحي"
                  >
                    🔄 جلب من تسليم الشفت
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* قسم الشفت الصباحي */}
              <div className="p-3 bg-white border border-amber-200 rounded-xl space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-900 flex items-center gap-1">
                    <span>☀️</span>
                    <span>الشفت الصباحي</span>
                  </span>
                  {morningDiff.amount > 0 && (
                    <span className={cn(
                      "text-[11px] font-black px-1.5 py-0.5 rounded",
                      morningDiff.type === 'shortage' ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                    )}>
                      {morningDiff.type === 'shortage' ? 'عجز' : 'زيادة'}: {morningDiff.amount} د.أ
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700 block">اسم الكاشير الصباحي:</label>
                  <select
                    value={morningDiff.cashierName || ''}
                    onChange={(e) => handleUpdateMorning('cashierName', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-amber-50/40 border border-amber-300 rounded-lg text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="">-- اختر كاشير الصباحي --</option>
                    <option value="قصي البدور">قصي البدور</option>
                    <option value="أمجد شحادات">أمجد شحادات</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block">الحالة:</label>
                    <select
                      value={morningDiff.type || 'exact'}
                      onChange={(e) => handleUpdateMorning('type', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="exact">مطابق (لا يوجد)</option>
                      <option value="shortage">عجز (نقص)</option>
                      <option value="surplus">زيادة</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block">المبلغ (د.أ):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={morningDiff.amount || ''}
                      onChange={(e) => handleUpdateMorning('amount', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-gray-900 text-center outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* قسم الشفت المسائي */}
              <div className="p-3 bg-white border border-indigo-200 rounded-xl space-y-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-900 flex items-center gap-1">
                    <span>🌙</span>
                    <span>الشفت المسائي</span>
                  </span>
                  {eveningDiff.amount > 0 && (
                    <span className={cn(
                      "text-[11px] font-black px-1.5 py-0.5 rounded",
                      eveningDiff.type === 'shortage' ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                    )}>
                      {eveningDiff.type === 'shortage' ? 'عجز' : 'زيادة'}: {eveningDiff.amount} د.أ
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-700 block">اسم الكاشير المسائي:</label>
                  <select
                    value={eveningDiff.cashierName || cashierName || ''}
                    onChange={(e) => handleUpdateEvening('cashierName', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-indigo-50/40 border border-indigo-300 rounded-lg text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="">-- اختر كاشير المسائي --</option>
                    <option value="أمجد شحادات">أمجد شحادات</option>
                    <option value="قصي البدور">قصي البدور</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block">الحالة:</label>
                    <select
                      value={eveningDiff.type || 'exact'}
                      onChange={(e) => handleUpdateEvening('type', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      <option value="exact">مطابق (لا يوجد)</option>
                      <option value="shortage">عجز (نقص)</option>
                      <option value="surplus">زيادة</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block">المبلغ (د.أ):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={eveningDiff.amount || ''}
                      onChange={(e) => handleUpdateEvening('amount', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs font-bold text-gray-900 text-center outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-gray-600 font-semibold text-center">
              💡 يمكنك تسجيل عجز أو زيادة لأي من الشفتين أو كليهما، وسيتم ترحيل الفوارق بدقة إلى تقرير الكاشيرية لكل شفت على حدة.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ActualInventorySection.displayName = 'ActualInventorySection';

