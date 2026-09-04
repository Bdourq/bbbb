import React from 'react';
import { useShiftStore } from '../store/useShiftStore';
import { useCalculations } from '../hooks/useCalculations';
import { useValidationStore } from '../store/useValidationStore';
import { Card, CardHeader } from './ui';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export const CashDataSection = () => {
  const cashAndSales = useShiftStore(state => state.data.cashAndSales);
  const addCashReceivables = useShiftStore(state => state.data.addCashReceivables) || [];
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

  return (
    <Card 
      id="cashData" 
      className={cn(
        hasError && "ring-3 ring-rose-500 border-rose-500 shadow-md shadow-rose-100"
      )}
    >
      <CardHeader 
        title="بيانات الكاش والمبيعات" 
        isError={hasError}
        errorMessage={errorMessage}
      />
      
      {hasError && (
        <div className="bg-rose-50 px-3 py-1.5 border-b border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-1.5">
          <AlertCircle size={14} className="shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="p-0">
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
                  onChange={(e) => handleInputChange(['cashAndSales', 'openingCash'], Number(e.target.value))}
                  className="w-full h-full px-2 py-1.5 bg-transparent outline-none text-center focus:bg-amber-50/80 focus:font-black focus:text-base sm:focus:text-lg focus:text-indigo-900 transition-all duration-150"
                  dir="ltr" placeholder="0"
                />
              </td>
            </tr>
            {addCashReceivables.map((item, index) => (
              <tr key={item.id} className="border-b border-gray-300 relative group">
                <td className="p-0 bg-gray-50 border border-gray-300 w-1/2">
                  <div className="flex flex-col sm:flex-row h-full relative">
                    <div className="relative flex items-center justify-center min-w-[80px] bg-gray-50 px-2 py-1.5 border-b sm:border-b-0 sm:border-r-0 border-gray-300">
                      {index === 0 && (
                        <button 
                          onClick={() => addLineItem('addCashReceivables')}
                          className="absolute top-1 right-1 text-emerald-600 hover:bg-emerald-100 rounded print:hidden"
                          title="إضافة ذمة جديدة"
                        >
                          <Plus size={14} />
                        </button>
                      )}
                      {index > 0 && (
                        <button 
                          onClick={() => removeLineItem('addCashReceivables', item.id)}
                          className="absolute top-1 right-1 text-red-600 hover:bg-red-100 rounded print:hidden"
                          title="حذف"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <span className="font-bold text-gray-700 whitespace-nowrap text-xs">اضافة ذمم</span>
                    </div>
                    <input 
                      type="text" 
                      value={item.label || ''} 
                      onFocus={(e) => e.target.select()}
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
            ))}
            <tr className="border-b border-gray-300">
              <td className="px-2 py-1.5 bg-gray-50 border border-gray-300 font-bold text-gray-700 w-1/2 text-center">تسديد ذمم قديمة</td>
              <td className="p-0 border border-gray-300">
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  value={cashAndSales.paidOldReceivables || ''}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleInputChange(['cashAndSales', 'paidOldReceivables'], Number(e.target.value))}
                  className="w-full h-full px-2 py-1.5 bg-transparent outline-none text-center focus:bg-amber-50/80 focus:font-black focus:text-base sm:focus:text-lg focus:text-indigo-900 transition-all duration-150"
                  dir="ltr" placeholder="0"
                />
              </td>
            </tr>
            <tr className="border-b border-gray-300">
              <td className="px-2 py-1.5 bg-gray-50 border border-gray-300 font-bold text-gray-700 w-1/2 text-center">مبيعات</td>
              <td className="p-0 border border-gray-300">
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*"
                  value={cashAndSales.sales || ''}
                  onFocus={(e) => e.target.select()}
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
      </div>
    </Card>
  );
};

export const ActualInventorySection = () => {
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

  const inputFields = [
    { key: 'actualCash', label: 'نقد (الكاش الفعلي)' },
    { key: 'visa', label: 'فيزا' },
    { key: 'rt', label: 'Rt' },
    { key: 'maestro', label: 'مايسترو' },
    { key: 'priceDifference', label: 'فرق سعر' },
    { key: 'advances', label: 'سلف' },
    { key: 'wallet', label: 'المحفظة' },
  ];

  const displayFields = [
    { label: 'مشتريات', value: calc.purchasesTotal },
    { label: 'سداد ذمم تجار', value: calc.payMerchantTotal },
    { label: 'مصاريف أخرى', value: calc.otherExpensesTotal },
    { label: 'الشقة', value: calc.apartmentTotal },
    { label: 'مصاريف إدارية', value: calc.adminExpensesTotal },
    { label: 'يحيى', value: calc.yahyaTotal },
    { label: 'أبو عبدالله', value: calc.abuAbdullahTotal },
    { label: 'بهارات', value: calc.spicesTotal },
    { label: 'معدات وصيانة', value: calc.equipmentTotal },
  ];

  return (
    <Card 
      id="actualInventory"
      className={cn(
        hasError && "ring-3 ring-rose-500 border-rose-500 shadow-md shadow-rose-100"
      )}
    >
      <CardHeader 
        title="ملخص الجرد الفعلي" 
        isError={hasError}
        errorMessage={errorMessage}
      />

      {hasError && (
        <div className="bg-rose-50 px-3 py-1.5 border-b border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-1.5">
          <AlertCircle size={14} className="shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="p-0">
        <table className="w-full text-xs sm:text-sm text-right border-collapse border border-gray-300">
          <tbody>
            {inputFields.map(field => (
              <tr key={field.key} className="border-b border-gray-300">
                <td className="px-2 py-1.5 bg-gray-50 border border-gray-300 font-bold text-gray-700 w-1/2 text-center">{field.label}</td>
                <td className="p-0 border border-gray-300">
                  <input
                    type="number"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    value={data[field.key as keyof typeof data] || ''}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleInputChange(field.key, Number(e.target.value))}
                    className="w-full h-full px-2 py-1.5 bg-transparent outline-none text-center focus:bg-amber-50/80 focus:font-black focus:text-base sm:focus:text-lg focus:text-indigo-900 transition-all duration-150"
                    dir="ltr"
                    placeholder="0"
                  />
                </td>
              </tr>
            ))}
            {displayFields.map((field, idx) => (
              <tr key={idx} className="border-b border-gray-300">
                <td className="px-2 py-1.5 bg-gray-50 border border-gray-300 font-bold text-gray-700 text-center">{field.label}</td>
                <td className="px-2 py-1.5 border border-gray-300 text-center bg-gray-50/50" dir="ltr">{field.value.toLocaleString()}</td>
              </tr>
            ))}
            <tr className="border-b border-gray-300 font-bold bg-gray-100">
              <td className="px-2 py-2 border border-gray-300 text-gray-900 text-center text-sm">مجموع الجرد</td>
              <td className="px-2 py-2 border border-gray-300 text-center text-sm font-black" dir="ltr">{calc.totalInventory.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr className="border-b border-gray-300 font-bold text-red-700 bg-red-50">
              <td className="px-2 py-2 border border-gray-300 text-center">نقص الكاش</td>
              <td className="px-2 py-2 border border-gray-300 text-center font-black" dir="ltr">{calc.cashShortage > 0 ? `-${calc.cashShortage.toFixed(2)}` : '-'}</td>
            </tr>
            <tr className="border-b border-gray-300 font-bold text-green-700 bg-green-50">
              <td className="px-2 py-2 border border-gray-300 text-center">زيادة الكاش</td>
              <td className="px-2 py-2 border border-gray-300 text-center font-black" dir="ltr">{calc.cashSurplus > 0 ? calc.cashSurplus.toFixed(2) : '-'}</td>
            </tr>
            <tr className="font-bold text-blue-800 bg-blue-50">
              <td className="px-2 py-2 border border-gray-300 text-center">الكاشير المستلم</td>
              <td className="px-2 py-2 border border-gray-300 text-center">{cashierName || '-'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
};

