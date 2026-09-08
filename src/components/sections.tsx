import React, { useState } from 'react';
import { useShiftStore } from '../store/useShiftStore';
import { useCalculations } from '../hooks/useCalculations';
import { useValidationStore } from '../store/useValidationStore';
import { Card, CardHeader, CardContent } from './ui';
import { Plus, Trash2, AlertCircle, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';

export const CashDataSection = React.memo(() => {
  const cashAndSales = useShiftStore(state => state.data.cashAndSales);
  const rawAddCashReceivables = useShiftStore(state => state.data.addCashReceivables);
  const rawAddNewReceivables = useShiftStore(state => state.data.addNewReceivables);
  const updateData = useShiftStore(state => state.updateData);
  const addLineItem = useShiftStore(state => state.addLineItem);
  const removeLineItem = useShiftStore(state => state.removeLineItem);
  const { totalCash } = useCalculations();
  
  const errorMessage = useValidationStore(state => state.errors['cashData']);
  const clearError = useValidationStore(state => state.clearError);
  const hasError = Boolean(errorMessage);

  // Guarantee at least 1 input row so they are always visible to the user
  const addNewReceivables = (rawAddNewReceivables && rawAddNewReceivables.length > 0)
    ? rawAddNewReceivables
    : [{ id: 'nr-default-1', label: '', amount: 0 }];

  const addCashReceivables = (rawAddCashReceivables && rawAddCashReceivables.length > 0)
    ? rawAddCashReceivables
    : [{ id: 'ncr-default-1', label: '', amount: 0 }];

  const handleInputChange = (path: (string | number)[], value: any) => {
    updateData(path, value);
    if (errorMessage && (Number(value) > 0 || (path[1] === 'sales' && Number(value) > 0))) {
      clearError('cashData');
    }
  };

  const handleNewReceivableUpdate = (index: number, field: 'label' | 'amount', value: any) => {
    if (!rawAddNewReceivables || rawAddNewReceivables.length === 0) {
      updateData(['addNewReceivables'], [{ id: 'nr-default-1', label: '', amount: 0, [field]: value }]);
    } else {
      updateData(['addNewReceivables', index, field], value);
    }
  };

  const handleCashReceivableUpdate = (index: number, field: 'label' | 'amount', value: any) => {
    if (!rawAddCashReceivables || rawAddCashReceivables.length === 0) {
      updateData(['addCashReceivables'], [{ id: 'ncr-default-1', label: '', amount: 0, [field]: value }]);
    } else {
      updateData(['addCashReceivables', index, field], value);
    }
  };

  const handleAddNewItem = () => {
    if (!rawAddNewReceivables || rawAddNewReceivables.length === 0) {
      updateData(['addNewReceivables'], [
        { id: 'nr-default-1', label: '', amount: 0 },
        { id: Math.random().toString(36).substring(2, 9), label: '', amount: 0 }
      ]);
    } else {
      addLineItem('addNewReceivables');
    }
  };

  const handleAddCashItem = () => {
    if (!rawAddCashReceivables || rawAddCashReceivables.length === 0) {
      updateData(['addCashReceivables'], [
        { id: 'ncr-default-1', label: '', amount: 0 },
        { id: Math.random().toString(36).substring(2, 9), label: '', amount: 0 }
      ]);
    } else {
      addLineItem('addCashReceivables');
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
        "border-2 border-[#1e1b4b] shadow-sm bg-white",
        hasError && "ring-3 ring-rose-500 border-rose-500 shadow-md shadow-rose-100"
      )}
    >
      <CardHeader 
        title="بيانات الكاش والمبيعات" 
        headerClassName="bg-[#1e1b4b] text-white border-b border-[#0f172a]"
        isError={hasError}
        errorMessage={errorMessage}
        badge={totalCash > 0 ? (
          <span className="text-xs font-black bg-white text-[#1e1b4b] px-2 py-0.5 rounded-md border border-indigo-200">
            {totalCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.أ
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
        <table className="w-full text-xs sm:text-sm md:text-base text-right border-collapse border border-gray-300 font-tajawal">
          <tbody>
            <tr className="border-b border-gray-300">
              <td className="px-3 py-2 bg-gray-100 border border-gray-300 font-extrabold text-gray-900 w-1/2 text-center text-sm sm:text-base">النقد الافتتاحي</td>
              <td className="p-0 border border-gray-300">
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  value={cashAndSales.openingCash || ''}
                  onFocus={(e) => e.target.select()}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) => handleInputChange(['cashAndSales', 'openingCash'], Number(e.target.value))}
                  className="w-full h-full px-3 py-2 bg-transparent outline-none text-center font-black text-slate-950 text-sm sm:text-base md:text-lg focus:bg-amber-50/80 focus:text-indigo-900 transition-all duration-150"
                  dir="ltr" placeholder="0"
                />
              </td>
            </tr>

            {/* 1. خانة إضافة ذمم جديدة (أولاً فوق تسديد ذمم قديمة) */}
            {addNewReceivables.map((item, index, arr) => {
              const isItemEmpty = (!item.label || !item.label.trim()) && (!item.amount || Number(item.amount) === 0);
              return (
                <tr key={item.id} className={cn("border-b border-gray-300 relative group", isItemEmpty && "print:hidden export-empty-row")}>
                  <td className="p-0 bg-gray-50 border border-gray-300 w-1/2">
                    <div className="flex flex-col sm:flex-row h-full relative">
                      <div className="relative flex items-center justify-center min-w-[95px] bg-gray-50 px-2 py-1.5 border-b sm:border-b-0 sm:border-r-0 border-gray-300">
                        {index === 0 && (
                          <button 
                            onClick={handleAddNewItem}
                            className="absolute top-1 right-1 text-emerald-600 hover:bg-emerald-100 rounded print:hidden cursor-pointer p-0.5"
                            title="إضافة بند جديد"
                          >
                            <Plus size={14} />
                          </button>
                        )}
                        {index > 0 && (
                          <button 
                            onClick={() => removeLineItem('addNewReceivables', item.id)}
                            className="absolute top-1 right-1 text-red-600 hover:bg-red-100 rounded print:hidden cursor-pointer p-0.5"
                            title="حذف"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        <span className="font-extrabold text-gray-800 whitespace-nowrap text-xs sm:text-sm">إضافة ذمم جديدة</span>
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
                          handleNewReceivableUpdate(index, 'label', e.target.value);
                          if (index === arr.length - 1 && e.target.value) {
                            handleAddNewItem();
                          }
                        }} 
                        className="w-full px-2.5 py-1.5 bg-white outline-none border-t sm:border-t-0 sm:border-r border-gray-300 text-xs sm:text-sm text-center font-bold focus:bg-amber-50" 
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
                            handleAddNewItem();
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
                        handleNewReceivableUpdate(index, 'amount', Number(e.target.value));
                        if (index === arr.length - 1 && Number(e.target.value) > 0) {
                          handleAddNewItem();
                        }
                      }}
                      className="w-full h-full px-3 py-2 bg-transparent outline-none text-center font-black text-slate-950 text-sm sm:text-base md:text-lg focus:bg-amber-50/80 focus:text-indigo-900 transition-all duration-150"
                      dir="ltr" placeholder="0"
                    />
                  </td>
                </tr>
              );
            })}

            {/* 2. خانة تسديد ذمم قديمة (أسفل إضافة ذمم جديدة) */}
            {addCashReceivables.map((item, index, arr) => {
              const isItemEmpty = (!item.label || !item.label.trim()) && (!item.amount || Number(item.amount) === 0);
              return (
                <tr key={item.id} className={cn("border-b border-gray-300 relative group", isItemEmpty && "print:hidden export-empty-row")}>
                  <td className="p-0 bg-gray-50 border border-gray-300 w-1/2">
                    <div className="flex flex-col sm:flex-row h-full relative">
                      <div className="relative flex items-center justify-center min-w-[95px] bg-gray-50 px-2 py-1.5 border-b sm:border-b-0 sm:border-r-0 border-gray-300">
                        {index === 0 && (
                          <button 
                            onClick={handleAddCashItem}
                            className="absolute top-1 right-1 text-emerald-600 hover:bg-emerald-100 rounded print:hidden cursor-pointer p-0.5"
                            title="إضافة بند جديد"
                          >
                            <Plus size={14} />
                          </button>
                        )}
                        {index > 0 && (
                          <button 
                            onClick={() => removeLineItem('addCashReceivables', item.id)}
                            className="absolute top-1 right-1 text-red-600 hover:bg-red-100 rounded print:hidden cursor-pointer p-0.5"
                            title="حذف"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                        <span className="font-extrabold text-gray-800 whitespace-nowrap text-xs sm:text-sm">تسديد ذمم قديمة</span>
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
                          handleCashReceivableUpdate(index, 'label', e.target.value);
                          if (index === arr.length - 1 && e.target.value) {
                            handleAddCashItem();
                          }
                        }} 
                        className="w-full px-2.5 py-1.5 bg-white outline-none border-t sm:border-t-0 sm:border-r border-gray-300 text-xs sm:text-sm text-center font-bold focus:bg-amber-50" 
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
                          if (index === arr.length - 1) {
                            if (!item.label && !item.amount) return;
                            handleAddCashItem();
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
                        handleCashReceivableUpdate(index, 'amount', Number(e.target.value));
                        if (index === arr.length - 1 && Number(e.target.value) > 0) {
                          handleAddCashItem();
                        }
                      }}
                      className="w-full h-full px-3 py-2 bg-transparent outline-none text-center font-black text-slate-950 text-sm sm:text-base md:text-lg focus:bg-amber-50/80 focus:text-indigo-900 transition-all duration-150"
                      dir="ltr" placeholder="0"
                    />
                  </td>
                </tr>
              );
            })}
            <tr className="border-b border-gray-300">
              <td className="px-3 py-2 bg-gray-50 border border-gray-300 font-bold text-gray-800 w-1/2 text-center text-sm sm:text-base">مبيعات</td>
              <td className="p-0 border border-gray-300">
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  value={cashAndSales.sales || ''}
                  onFocus={(e) => e.target.select()}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) => handleInputChange(['cashAndSales', 'sales'], Number(e.target.value))}
                  className="w-full h-full px-3 py-2 bg-transparent outline-none text-center font-black text-slate-950 text-sm sm:text-base md:text-lg focus:bg-amber-50/80 focus:text-blue-900 transition-all duration-150"
                  dir="ltr" placeholder="0"
                />
              </td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="px-3 py-2 bg-gray-50 border border-gray-300 font-bold text-gray-800 w-1/2 text-center text-sm sm:text-base">مبيعات أخرى</td>
              <td className="p-0 border border-gray-300">
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  value={cashAndSales.otherSales || ''}
                  onFocus={(e) => e.target.select()}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) => handleInputChange(['cashAndSales', 'otherSales'], Number(e.target.value))}
                  className="w-full h-full px-3 py-2 bg-transparent outline-none text-center font-black text-slate-950 text-sm sm:text-base md:text-lg focus:bg-amber-50/80 focus:text-indigo-900 transition-all duration-150"
                  dir="ltr" placeholder="0"
                />
              </td>
            </tr>
            <tr className="border-b border-gray-300 bg-gray-100 font-bold">
              <td className="px-3 py-2.5 border border-gray-300 text-gray-950 text-center text-sm sm:text-base font-black">مجموع الكاش</td>
              <td className="px-3 py-2.5 border border-gray-300 text-center text-sm sm:text-base font-black text-[#1e1b4b]" dir="ltr">
                {totalCash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.أ
              </td>
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

  const totalDiffAmount = calc.cashShortage > 0.009 
    ? Number(calc.cashShortage.toFixed(2)) 
    : calc.cashSurplus > 0.009 
    ? Number(calc.cashSurplus.toFixed(2)) 
    : 0;
  const totalDiffType = calc.cashShortage > 0.009 ? 'shortage' : calc.cashSurplus > 0.009 ? 'surplus' : 'exact';

  // Determine current mode based on existing data
  const isSplitActive = (morningDiff.amount > 0 && eveningDiff.amount > 0) || (shiftDifferences.morning?.notes === 'تقسيم' || shiftDifferences.evening?.notes === 'تقسيم');
  const [assignMode, setAssignMode] = useState<'single' | 'split'>(isSplitActive ? 'split' : 'single');

  const errorMessage = useValidationStore(state => state.errors['actualInventory']);
  const clearError = useValidationStore(state => state.clearError);
  const hasError = Boolean(errorMessage);

  const handleInputChange = (fieldKey: string, value: any) => {
    updateData(['actualInventory', fieldKey], value);
    if (errorMessage && value > 0) {
      clearError('actualInventory');
    }
  };

  // الإسناد لكاشير واحد بكامل المبلغ مع تحديد الشفت
  const handleAssignSingle = (selectedName: string, shiftLabel: 'صباحي' | 'مسائي' | 'كامل اليوم' = 'مسائي') => {
    if (!selectedName) return;
    const isBdour = selectedName.includes('قصي') || selectedName.includes('البدور');
    const otherName = isBdour ? 'أمجد شحادات' : 'قصي البدور';

    if (shiftLabel === 'صباحي') {
      updateData(['shiftDifferences', 'morning'], {
        cashierName: selectedName,
        type: totalDiffType,
        amount: totalDiffAmount,
        notes: 'صباحي'
      });
      updateData(['shiftDifferences', 'evening'], {
        cashierName: otherName,
        type: 'exact',
        amount: 0,
        notes: 'مسائي'
      });
      updateData(['cashierName'], `${selectedName} (صباحي)`);
    } else if (shiftLabel === 'مسائي') {
      updateData(['shiftDifferences', 'morning'], {
        cashierName: otherName,
        type: 'exact',
        amount: 0,
        notes: 'صباحي'
      });
      updateData(['shiftDifferences', 'evening'], {
        cashierName: selectedName,
        type: totalDiffType,
        amount: totalDiffAmount,
        notes: 'مسائي'
      });
      updateData(['cashierName'], `${selectedName} (مسائي)`);
    } else {
      updateData(['shiftDifferences', 'morning'], {
        cashierName: otherName,
        type: 'exact',
        amount: 0,
        notes: 'صباحي'
      });
      updateData(['shiftDifferences', 'evening'], {
        cashierName: selectedName,
        type: totalDiffType,
        amount: totalDiffAmount,
        notes: 'كامل اليوم'
      });
      updateData(['cashierName'], selectedName);
    }
  };

  // الإسناد والتقسيم بالتساوي 50% / 50%
  const handleSplitFiftyFifty = () => {
    const half = Number((totalDiffAmount / 2).toFixed(2));
    const remainder = Number((totalDiffAmount - half).toFixed(2));
    const c1 = morningDiff.cashierName || 'قصي البدور';
    const c2 = eveningDiff.cashierName || cashierName?.replace(/\s*\(.*?\)/, '') || 'أمجد شحادات';

    updateData(['shiftDifferences', 'morning'], {
      cashierName: c1,
      type: totalDiffType,
      amount: half,
      notes: 'صباحي'
    });
    updateData(['shiftDifferences', 'evening'], {
      cashierName: c2,
      type: totalDiffType,
      amount: remainder,
      notes: 'مسائي'
    });
    updateData(['cashierName'], `${c1} (${half} د.أ صباحي) + ${c2} (${remainder} د.أ مسائي)`);
  };

  // تبديل الكاشيرية بين الشفت الصباحي والمسائي بضغطة واحدة
  const handleSwapCashiers = () => {
    const c1 = morningDiff.cashierName || 'قصي البدور';
    const c2 = eveningDiff.cashierName || 'أمجد شحادات';
    updateData(['shiftDifferences', 'morning', 'cashierName'], c2);
    updateData(['shiftDifferences', 'evening', 'cashierName'], c1);
  };

  // وضع باقي المبلغ على كاشير الشفت المسائي
  const handleAssignRemainderToEvening = () => {
    const mAmount = morningDiff.amount || 0;
    const remainder = Math.max(0, Number((totalDiffAmount - mAmount).toFixed(2)));
    const c2 = eveningDiff.cashierName || 'الشحادات';

    updateData(['shiftDifferences', 'evening'], {
      cashierName: c2,
      type: totalDiffType,
      amount: remainder,
      notes: 'مسائي'
    });
  };

  // وضع باقي المبلغ على كاشير الشفت الصباحي
  const handleAssignRemainderToMorning = () => {
    const eAmount = eveningDiff.amount || 0;
    const remainder = Math.max(0, Number((totalDiffAmount - eAmount).toFixed(2)));
    const c1 = morningDiff.cashierName || 'البدور';

    updateData(['shiftDifferences', 'morning'], {
      cashierName: c1,
      type: totalDiffType,
      amount: remainder,
      notes: 'صباحي'
    });
  };

  const handleUpdateMorning = (field: string, val: any) => {
    updateData(['shiftDifferences', 'morning', field], val);
  };

  const handleUpdateEvening = (field: string, val: any) => {
    updateData(['shiftDifferences', 'evening', field], val);
    if (field === 'cashierName' && val && assignMode === 'single') {
      updateData(['cashierName'], val);
    }
  };

  const syncFromHandover = () => {
    if (!shiftHandover) return;
    const diff = shiftHandover.difference || 0;
    const type = diff < -0.009 ? 'shortage' : diff > 0.009 ? 'surplus' : 'exact';
    const morningAmt = Number(Math.abs(diff).toFixed(2));
    
    updateData(['shiftDifferences', 'morning'], {
      cashierName: shiftHandover.morningCashier || 'البدور',
      type,
      amount: morningAmt,
      notes: 'صباحي'
    });
    if (shiftHandover.eveningCashier) {
      updateData(['shiftDifferences', 'evening', 'cashierName'], shiftHandover.eveningCashier);
      // إذا كان الإجمالي أكبر من الصباحي، احسب الباقي للمسائي
      const remainingForEvening = Math.max(0, Number((totalDiffAmount - morningAmt).toFixed(2)));
      if (remainingForEvening > 0) {
        updateData(['shiftDifferences', 'evening', 'amount'], remainingForEvening);
        updateData(['shiftDifferences', 'evening', 'type'], totalDiffType);
        updateData(['shiftDifferences', 'evening', 'notes'], 'مسائي');
      }
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
  ];

  const displayFields = [
    { label: 'سلف الموظفين', value: calc.advancesTotal, targetId: 'employeeAdvances', manualKey: 'manualAdvances' },
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
        "border-2 border-[#1e1b4b] shadow-sm bg-white",
        hasError && "ring-3 ring-rose-500 border-rose-500 shadow-md shadow-rose-100"
      )}
    >
      <CardHeader 
        title="ملخص الجرد الفعلي" 
        headerClassName="bg-[#1e1b4b] text-white border-b border-[#0f172a]"
        isError={hasError}
        errorMessage={errorMessage}
        badge={calc.totalInventory > 0 ? (
          <span className="text-xs font-black bg-white text-[#1e1b4b] px-2 py-0.5 rounded-md border border-indigo-200">
            {calc.totalInventory.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.أ
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
        <table className="w-full text-sm sm:text-base text-right border-collapse border border-gray-300 font-tajawal">
          <tbody>
            {inputFields.map(field => (
              <tr key={field.key} className="border-b border-gray-300">
                <td 
                  onClick={() => scrollToTable(field.targetId)}
                  className="px-3 py-2 bg-gray-50 border border-gray-300 font-extrabold text-gray-800 w-1/2 text-center cursor-pointer hover:bg-indigo-100/60 transition-colors group text-sm sm:text-base"
                  title={`انقر للانتقال إلى جدول ${field.label}`}
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{field.label}</span>
                    <ExternalLink size={12} className="text-indigo-500 opacity-40 group-hover:opacity-100 print:hidden shrink-0" />
                  </div>
                </td>
                <td className="p-0 border border-gray-300">
                  <input
                    type="number"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    value={data[field.key as keyof typeof data] !== undefined && data[field.key as keyof typeof data] !== null ? data[field.key as keyof typeof data] : ''}
                    onFocus={(e) => e.target.select()}
                    onWheel={(e) => e.currentTarget.blur()}
                    onChange={(e) => {
                      const rawVal = e.target.value;
                      if (rawVal === '') {
                        handleInputChange(field.key, field.key === 'advances' ? null : 0);
                      } else {
                        handleInputChange(field.key, Number(rawVal));
                      }
                    }}
                    className="w-full h-full px-3 py-2 bg-transparent outline-none text-center font-black text-slate-950 text-sm sm:text-base md:text-lg focus:bg-amber-50/80 focus:text-indigo-900 transition-all duration-150"
                    dir="ltr"
                    placeholder={field.key === 'advances' && calc.advancesTotal > 0 ? String(calc.advancesTotal) : "0"}
                  />
                </td>
              </tr>
            ))}
            <tr className="border-b border-gray-300 hover:bg-indigo-50/80 transition-colors group">
              <td 
                onClick={() => scrollToTable('ewallet')}
                className="px-3 py-2 bg-gray-50 group-hover:bg-indigo-100/60 border border-gray-300 font-extrabold text-gray-800 text-center cursor-pointer text-sm sm:text-base"
                title="انقر للانتقال لمعاينة جدول المحفظة الإلكترونية"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>المحفظة</span>
                  <ExternalLink size={12} className="text-indigo-500 opacity-40 group-hover:opacity-100 print:hidden shrink-0" />
                </div>
              </td>
              <td className="px-3 py-2 border border-gray-300 text-center font-black text-indigo-900 bg-indigo-50/30 text-sm sm:text-base md:text-lg" dir="ltr">
                {calc.ewalletTotal > 0 ? calc.ewalletTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} د.أ
              </td>
            </tr>
            {displayFields.map((field, idx) => {
              const tableSum = field.value;

              return (
                <tr 
                  key={idx}
                  className="border-b border-gray-300 hover:bg-indigo-50/80 transition-colors group relative"
                >
                  <td 
                    onClick={() => scrollToTable(field.targetId)}
                    className="px-3 py-2 bg-gray-50 group-hover:bg-indigo-100/60 border border-gray-300 font-extrabold text-gray-800 text-center cursor-pointer text-sm sm:text-base"
                    title={`انقر للانتقال لمعاينة بيانات جدول ${field.label}`}
                  >
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="flex items-center gap-1">
                        <span>{field.label}</span>
                        <ExternalLink size={12} className="opacity-40 group-hover:opacity-100 print:hidden shrink-0 text-indigo-500" />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 border border-gray-300 text-center font-black text-indigo-900 bg-indigo-50/30 text-sm sm:text-base md:text-lg" dir="ltr">
                    {tableSum > 0 ? tableSum.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '0'}
                  </td>
                </tr>
              );
            })}
            <tr 
              onClick={() => scrollToTable('actualInventory')}
              className="border-b border-gray-300 font-bold bg-gray-100 hover:bg-indigo-100/40 cursor-pointer transition-colors"
              title="مجموع الجرد الفعلي الإجمالي"
            >
              <td className="px-3 py-2.5 border border-gray-300 text-gray-950 text-center text-sm sm:text-base font-black">مجموع الجرد</td>
              <td className="px-3 py-2.5 border border-gray-300 text-center text-sm sm:text-base font-black text-[#1e1b4b]" dir="ltr">
                {calc.totalInventory.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.أ
              </td>
            </tr>
            <tr 
              onClick={() => scrollToTable('cashData')}
              className={cn(
                "border-b border-gray-300 font-bold transition-colors cursor-pointer",
                calc.cashShortage > 0 
                  ? "bg-[#fff1f2] text-[#be123c] border-[#be123c]/40 hover:bg-rose-100" 
                  : "bg-gray-50 text-slate-500 hover:bg-gray-100"
              )}
              title="انقر للانتقال لجدول بيانات الكاش والمبيعات"
            >
              <td className="px-3 py-2.5 border border-gray-300 text-center">
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <span className={cn("text-sm sm:text-base", calc.cashShortage > 0 ? "text-[#be123c] font-black" : "text-slate-600 font-bold")}>نقص الكاش (عجز)</span>
                  {calc.cashShortage > 0 && (
                    <span className={cn("text-xs font-black", cashierName ? "text-[#be123c]" : "text-rose-600 animate-pulse")}>
                      {cashierName ? `(${cashierName})` : '⚠️ يرجى تحديد اسم الكاشير بالأسفل'}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-3 py-2.5 border border-gray-300 text-center font-black" dir="ltr">
                {calc.cashShortage > 0 ? (
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <span className="text-sm sm:text-base md:text-lg font-black text-[#be123c]">
                      -{calc.cashShortage.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.أ
                    </span>
                    {cashierName && (
                      <span className="text-xs font-bold text-[#be123c] bg-rose-100 px-1.5 py-0.5 rounded border border-rose-300">
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
                "border-b border-gray-300 font-bold transition-colors cursor-pointer",
                calc.cashSurplus > 0 
                  ? "bg-[#ecfdf5] text-[#047857] border-[#047857]/40 hover:bg-emerald-100" 
                  : "bg-gray-50 text-slate-500 hover:bg-gray-100"
              )}
              title="انقر للانتقال لجدول بيانات الكاش والمبيعات"
            >
              <td className="px-3 py-2.5 border border-gray-300 text-center">
                <div className="flex flex-col items-center justify-center gap-0.5">
                  <span className={cn("text-sm sm:text-base", calc.cashSurplus > 0 ? "text-[#047857] font-black" : "text-slate-600 font-bold")}>زيادة الكاش (فائض)</span>
                  {calc.cashSurplus > 0 && (
                    <span className={cn("text-xs font-black", cashierName ? "text-[#047857]" : "text-emerald-700 animate-pulse")}>
                      {cashierName ? `(${cashierName})` : '⚠️ يرجى تحديد اسم الكاشير بالأسفل'}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-3 py-2.5 border border-gray-300 text-center font-black" dir="ltr">
                {calc.cashSurplus > 0 ? (
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    <span className="text-sm sm:text-base md:text-lg font-black text-[#047857]">
                      +{calc.cashSurplus.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.أ
                    </span>
                    {cashierName && (
                      <span className="text-xs font-bold text-[#047857] bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                        ({cashierName})
                      </span>
                    )}
                  </div>
                ) : '-'}
              </td>
            </tr>
            {/* توثيق فوارق الكاش للشفتين أو الكاشير المسؤول بحال وجود نقص أو زيادة */}
            {totalDiffAmount > 0.009 ? (
              <>
                {morningDiff.amount > 0 && eveningDiff.amount > 0 ? (
                  <>
                    {/* صف كاشير الشفت الصباحي */}
                    <tr className="bg-amber-50/80 border-b border-gray-300 font-bold text-xs sm:text-sm">
                      <td className="px-2 py-2 border border-gray-300 text-center">
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <span className="text-amber-950 font-black">☀️ كاشير الشفت الصباحي ({morningDiff.cashierName || 'غير محدد'})</span>
                          <span className="text-[10px] text-amber-800">
                            {morningDiff.notes || 'شفت صباحي'}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-2 border border-gray-300 text-center font-black" dir="ltr">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs sm:text-sm font-black inline-block",
                          morningDiff.type === 'shortage' ? "text-rose-700 bg-rose-100 border border-rose-300" : "text-emerald-700 bg-emerald-100 border border-emerald-300"
                        )}>
                          {morningDiff.type === 'shortage' ? '-' : '+'}{morningDiff.amount.toFixed(2)} د.أ ({morningDiff.type === 'shortage' ? 'عجز صباحي' : 'زيادة صباحية'})
                        </span>
                      </td>
                    </tr>

                    {/* صف كاشير الشفت المسائي */}
                    <tr className="bg-indigo-50/80 border-b border-gray-300 font-bold text-xs sm:text-sm">
                      <td className="px-2 py-2 border border-gray-300 text-center">
                        <div className="flex flex-col items-center justify-center gap-0.5">
                          <span className="text-indigo-950 font-black">🌙 كاشير الشفت المسائي ({eveningDiff.cashierName || cashierName || 'غير محدد'})</span>
                          <span className="text-[10px] text-indigo-800">
                            {eveningDiff.notes || 'شفت مسائي'}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-2 border border-gray-300 text-center font-black" dir="ltr">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs sm:text-sm font-black inline-block",
                          eveningDiff.type === 'shortage' ? "text-rose-700 bg-rose-100 border border-rose-300" : "text-emerald-700 bg-emerald-100 border border-emerald-300"
                        )}>
                          {eveningDiff.type === 'shortage' ? '-' : '+'}{eveningDiff.amount.toFixed(2)} د.أ ({eveningDiff.type === 'shortage' ? 'عجز مسائي' : 'زيادة مسائية'})
                        </span>
                      </td>
                    </tr>
                  </>
                ) : (
                  /* صف الكاشير المسؤول عن كامل المبلغ */
                  <tr className="bg-rose-50/70 border-b border-gray-300 font-bold text-xs sm:text-sm">
                    <td className="px-2 py-2 border border-gray-300 text-center">
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="text-rose-950 font-black">
                          👤 الكاشير المسؤول: {eveningDiff.cashierName || morningDiff.cashierName || cashierName || 'غير محدد'}
                        </span>
                        <span className="text-[10px] text-rose-800">
                          ({morningDiff.amount > 0 ? 'الشفت الصباحي' : eveningDiff.notes === 'صباحي' ? 'الشفت الصباحي' : eveningDiff.notes === 'كامل اليوم' ? 'كامل اليوم' : 'الشفت المسائي'})
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2 border border-gray-300 text-center font-black" dir="ltr">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs sm:text-sm font-black inline-block",
                        totalDiffType === 'shortage' ? "text-rose-700 bg-rose-100 border border-rose-300" : "text-emerald-700 bg-emerald-100 border border-emerald-300"
                      )}>
                        {totalDiffType === 'shortage' ? '-' : '+'}{totalDiffAmount.toFixed(2)} د.أ ({totalDiffType === 'shortage' ? 'عجز كامل' : 'زيادة كاملة'})
                      </span>
                    </td>
                  </tr>
                )}
              </>
            ) : (
              <tr className="bg-[#ecfdf5] text-[#047857] font-semibold border-b border-gray-300">
                <td colSpan={2} className="px-3 py-2 text-center text-xs">
                  <span className="inline-flex items-center justify-center gap-1.5 font-black text-[#047857]">
                    <span className="text-sm">✓</span>
                    <span>الكاش مطابق تماماً (0.00 د.أ) — لا يوجد نقص أو زيادة</span>
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* تنبيه مطابقة الكاش */}
        {totalDiffAmount <= 0.009 && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-xs text-[#047857] font-bold print:hidden">
            ✓ الكاش مطابق تماماً (0.00 د.أ) — لا يوجد نقص أو زيادة
          </div>
        )}
      </CardContent>
    </Card>
  );
});

ActualInventorySection.displayName = 'ActualInventorySection';

