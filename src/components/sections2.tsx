import React from 'react';
import { useShiftStore } from '../store/useShiftStore';
import { Card, CardHeader, CardContent } from './ui';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

export const KitchenConsumptionSection = React.memo(() => {
  const data = useShiftStore(state => state.data.kitchenConsumption);
  const updateData = useShiftStore(state => state.updateData);

  const fields = [
    { key: 'skewer1', label: 'سيخ 1' },
    { key: 'skewer2', label: 'سيخ 2' },
    { key: 'supply', label: 'تزويد' },
    { key: 'return', label: 'مرتجع' },
    { key: 'rice', label: 'استهلاك رز' },
    { key: 'almond', label: 'استهلاك لوز' },
    { key: 'potato', label: 'استهلاك بطاطا' },
  ];

  const isEmpty = Object.values(data).every(val => !val);

  return (
    <Card id="kitchenConsumption" data-empty={isEmpty}>
      <CardHeader title="استهلاك المطبخ" />
      <CardContent>
        <table className="w-full text-xs sm:text-sm text-right border-collapse border border-gray-300">
          <tbody>
            {fields.map((field) => {
              const val = data[field.key as keyof typeof data];
              const isFieldEmpty = !val;
              return (
                <tr key={field.key} className={cn("border-b border-gray-300 last:border-b-0", isFieldEmpty && "print:hidden export-empty-row")}>
                  <td className="px-2 py-1.5 bg-gray-50 border border-gray-300 font-bold text-gray-700 w-1/2 text-center">{field.label}</td>
                  <td className="p-0 border border-gray-300">
                    <input
                      type="number"
                      inputMode="decimal"
                      pattern="[0-9]*"
                      value={val || ''}
                      onFocus={(e) => e.target.select()}
                      onWheel={(e) => e.currentTarget.blur()}
                      onChange={(e) => updateData(['kitchenConsumption', field.key], Number(e.target.value))}
                      className="w-full h-full px-2 py-1.5 bg-transparent outline-none text-center focus:bg-amber-50/80 focus:font-bold focus:text-base sm:focus:text-lg focus:text-indigo-900 transition-all duration-150"
                      dir="ltr"
                      placeholder="0"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
});

KitchenConsumptionSection.displayName = 'KitchenConsumptionSection';

export const ProductionInventorySection = React.memo(() => {
  const data = useShiftStore(state => state.data.productionInventory);
  const updateData = useShiftStore(state => state.updateData);

  const fields = [
    { key: 'broasted', label: 'بروستد' },
    { key: 'tikka', label: 'تكا' },
    { key: 'zinger', label: 'زنجر' },
  ];

  const isEmpty = Object.values(data).every(val => !val);

  return (
    <Card id="productionInventory" data-empty={isEmpty}>
      <CardHeader title="جرد الإنتاج" />
      <CardContent>
        <table className="w-full text-xs sm:text-sm text-right border-collapse border border-gray-300">
          <tbody>
            {fields.map((field) => {
              const val = data[field.key as keyof typeof data];
              const isFieldEmpty = !val;
              return (
                <tr key={field.key} className={cn("border-b border-gray-300 last:border-b-0", isFieldEmpty && "print:hidden export-empty-row")}>
                  <td className="px-2 py-1.5 bg-gray-50 border border-gray-300 font-bold text-gray-700 w-1/2 text-center">{field.label}</td>
                  <td className="p-0 border border-gray-300">
                    <input
                      type="number"
                      inputMode="decimal"
                      pattern="[0-9]*"
                      value={val || ''}
                      onFocus={(e) => e.target.select()}
                      onWheel={(e) => e.currentTarget.blur()}
                      onChange={(e) => updateData(['productionInventory', field.key], Number(e.target.value))}
                      className="w-full h-full px-2 py-1.5 bg-transparent outline-none text-center focus:bg-amber-50/80 focus:font-bold focus:text-base sm:focus:text-lg focus:text-indigo-900 transition-all duration-150"
                      dir="ltr"
                      placeholder="0"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
});

ProductionInventorySection.displayName = 'ProductionInventorySection';

export const calculateWage = (startTime: string, endTime: string, hourlyRate: number) => {
  if (!startTime || !endTime || !hourlyRate) return 0;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let hours = (eh + em / 60) - (sh + sm / 60);
  if (hours < 0) hours += 24;
  return Number((hours * hourlyRate).toFixed(2));
};

export const EmployeeAdvancesSection = React.memo(() => {
  const data = useShiftStore(state => state.data.employeeAdvances);
  const updateData = useShiftStore(state => state.updateData);
  const addEmployee = useShiftStore(state => state.addEmployee);
  const removeEmployee = useShiftStore(state => state.removeEmployee);

  const handleCheckIn = (index: number) => {
    const currentTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    updateData(['employeeAdvances', index, 'startTime'], currentTime);
  };

  const handleCheckOut = (index: number) => {
    const currentTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    updateData(['employeeAdvances', index, 'endTime'], currentTime);
  };

  const isEmpty = !data.length || data.every(emp => !emp.employeeName.trim() && !emp.startTime && !emp.endTime && !emp.amount);
  const activeCount = data.filter(emp => emp.employeeName.trim()).length;

  return (
    <Card id="employeeAdvances" data-empty={isEmpty} className="col-span-full print:col-span-2 export-col-span-2">
      <CardHeader 
        title="سجل حضور وسلف الموظفين" 
        badge={activeCount > 0 ? (
          <span className="text-xs font-black bg-blue-100 text-blue-900 px-2 py-0.5 rounded-md border border-blue-200 print:hidden">
            {activeCount} موظف
          </span>
        ) : undefined}
        action={
          <button onClick={addEmployee} className="text-blue-600 hover:bg-blue-50 p-1 rounded transition-colors print:hidden">
            <Plus size={18} />
          </button>
        }
      />
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-right border-collapse border border-gray-300">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr>
                <th className="px-1 py-1.5 font-bold text-gray-700 border border-gray-300 w-8 text-center">م</th>
                <th className="px-2 py-1.5 font-bold text-gray-700 border border-gray-300 min-w-[120px] text-center">اسم الموظف</th>
                <th className="px-1 py-1.5 font-bold text-gray-700 border border-gray-300 w-28 text-center">الدخول</th>
                <th className="px-1 py-1.5 font-bold text-gray-700 border border-gray-300 w-28 text-center">الخروج</th>
                <th className="px-1 py-1.5 font-bold text-gray-700 border border-gray-300 w-20 text-center">أجر/ساعة</th>
                <th className="px-2 py-1.5 font-bold text-gray-700 border border-gray-300 w-24 text-center">الأجر اليومي</th>
                <th className="px-2 py-1.5 font-bold text-gray-700 border border-gray-300 w-24 text-center">قيمة السلفة</th>
                <th className="px-2 py-1.5 font-bold text-gray-700 border border-gray-300 min-w-[150px] text-center">ملاحظات / توقيع</th>
                <th className="px-1 py-1 w-8 border border-gray-300 print:hidden"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((emp, index) => {
                const dailyWage = calculateWage(emp.startTime, emp.endTime, emp.hourlyRate);
                const isOff = emp.employeeName.trim() && !emp.startTime && !emp.endTime;
                const isEmpEmpty = !emp.employeeName.trim() && !emp.startTime && !emp.endTime && !emp.amount;
                return (
                  <tr 
                    key={emp.id} 
                    className={cn(
                      "border-b border-gray-300 transition-colors",
                      isOff ? 'bg-rose-50/70 hover:bg-rose-100/70 border-rose-200' : 'hover:bg-gray-50',
                      isEmpEmpty && "print:hidden export-empty-row"
                    )}
                  >
                    <td className={`px-1 py-1.5 border border-gray-300 text-center font-medium ${
                      isOff ? 'text-rose-700 bg-rose-100/60 font-bold' : 'text-gray-500'
                    }`}>{index + 1}</td>
                    <td className="p-0 border border-gray-300">
                      <div className="flex items-center justify-between px-2 py-1.5">
                        <input
                          type="text"
                          value={emp.employeeName}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            updateData(['employeeAdvances', index, 'employeeName'], e.target.value);
                            if (index === data.length - 1 && e.target.value) {
                              addEmployee();
                            }
                          }}
                          className={`w-full bg-transparent outline-none text-center focus:bg-amber-50 focus:font-bold ${
                            isOff ? 'font-bold text-rose-900' : ''
                          }`}
                          placeholder="اسم الموظف"
                        />
                        {isOff && (
                          <span className="text-[10px] bg-rose-600 text-white font-extrabold px-2 py-0.5 rounded shadow-xs whitespace-nowrap ml-1 animate-pulse" title="عطلة (OFF) لهذا اليوم">OFF</span>
                        )}
                      </div>
                    </td>
                    <td className="p-1 border border-gray-300">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="time"
                          value={emp.startTime || ''}
                          onChange={(e) => updateData(['employeeAdvances', index, 'startTime'], e.target.value)}
                          className={`bg-transparent outline-none text-center text-xs w-16 ${
                            isOff ? 'text-rose-400 placeholder:text-rose-300' : ''
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => handleCheckIn(index)}
                          className="text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-1 py-0.5 rounded transition-colors print:hidden"
                          title="تسجيل وقت الدخول الحالي"
                        >
                          دخول
                        </button>
                      </div>
                    </td>
                    <td className="p-1 border border-gray-300">
                      <div className="flex items-center justify-center gap-1">
                        <input
                          type="time"
                          value={emp.endTime || ''}
                          onChange={(e) => updateData(['employeeAdvances', index, 'endTime'], e.target.value)}
                          className={`bg-transparent outline-none text-center text-xs w-16 ${
                            isOff ? 'text-rose-400 placeholder:text-rose-300' : ''
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => handleCheckOut(index)}
                          className="text-[10px] bg-amber-100 hover:bg-amber-200 text-amber-800 px-1 py-0.5 rounded transition-colors print:hidden"
                          title="تسجيل وقت الخروج الحالي"
                        >
                          خروج
                        </button>
                      </div>
                    </td>
                    <td className="p-0 border border-gray-300">
                      <input
                        type="number"
                        inputMode="decimal"
                        pattern="[0-9]*"
                        value={emp.hourlyRate || ''}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => updateData(['employeeAdvances', index, 'hourlyRate'], Number(e.target.value))}
                        className={`w-full h-full px-1 py-1.5 bg-transparent outline-none text-center text-xs focus:bg-amber-50/80 focus:font-black focus:text-sm focus:text-indigo-900 transition-all duration-150 ${
                          isOff ? 'text-rose-400' : ''
                        }`}
                        dir="ltr"
                        placeholder="0"
                      />
                    </td>
                    <td className={`px-2 py-1.5 border border-gray-300 text-center font-bold ${
                      isOff ? 'bg-rose-100/60 text-rose-800' : 'bg-blue-50/50 text-blue-800'
                    }`} dir="ltr">
                      {dailyWage.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-0 border border-gray-300">
                      <input
                        type="number"
                        inputMode="decimal"
                        pattern="[0-9]*"
                        value={emp.amount || ''}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => updateData(['employeeAdvances', index, 'amount'], Number(e.target.value))}
                        className="w-full h-full px-2 py-1.5 bg-transparent outline-none text-center font-bold text-red-600 focus:bg-amber-50/80 focus:font-black focus:text-base sm:focus:text-lg transition-all duration-150"
                        dir="ltr"
                        placeholder="0"
                      />
                    </td>
                    <td className="p-0 border border-gray-300">
                      <input
                        type="text"
                        value={emp.notes}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => updateData(['employeeAdvances', index, 'notes'], e.target.value)}
                        className={`w-full h-full px-2 py-1.5 bg-transparent outline-none text-center focus:bg-amber-50 focus:font-bold ${
                          isOff ? 'text-rose-900' : ''
                        }`}
                        placeholder={isOff ? "عطلة (OFF)" : "-"}
                      />
                    </td>
                    <td className="p-1 text-center border border-gray-300 print:hidden">
                      <button 
                        onClick={() => removeEmployee(emp.id)}
                        className="text-red-500 hover:bg-red-50 p-1 rounded mx-auto block transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gray-100 font-bold border-t border-gray-300">
                <td colSpan={5} className="px-3 py-2 border border-gray-300 text-center text-gray-800">إجمالي الأجور والسلف</td>
                <td className="px-2 py-2 border border-gray-300 text-center text-blue-800" dir="ltr">
                  {data.reduce((acc, emp) => acc + calculateWage(emp.startTime, emp.endTime, emp.hourlyRate), 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                </td>
                <td className="px-2 py-2 border border-gray-300 text-center text-red-700" dir="ltr">
                  {data.reduce((acc, emp) => acc + (Number(emp.amount) || 0), 0).toLocaleString()}
                </td>
                <td colSpan={1} className="border border-gray-300 hidden print:table-cell"></td>
                <td colSpan={2} className="border border-gray-300 print:hidden"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
});

EmployeeAdvancesSection.displayName = 'EmployeeAdvancesSection';
