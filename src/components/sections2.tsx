import React from 'react';
import { useShiftStore } from '../store/useShiftStore';
import { Card, CardHeader } from './ui';
import { Plus, Trash2 } from 'lucide-react';

export const KitchenConsumptionSection = () => {
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

  return (
    <Card>
      <CardHeader title="استهلاك المطبخ" />
      <div className="p-0">
        <table className="w-full text-xs sm:text-sm text-right border-collapse border border-gray-300">
          <tbody>
            {fields.map((field, idx) => (
              <tr key={field.key} className="border-b border-gray-300 last:border-b-0">
                <td className="px-2 py-1.5 bg-gray-50 border border-gray-300 font-bold text-gray-700 w-1/2 text-center">{field.label}</td>
                <td className="p-0 border border-gray-300">
                  <input
                    type="number"
                    value={data[field.key as keyof typeof data] || ''}
                    onChange={(e) => updateData(['kitchenConsumption', field.key], Number(e.target.value))}
                    className="w-full h-full px-2 py-1.5 bg-transparent outline-none text-center"
                    dir="ltr"
                    placeholder="0"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export const ProductionInventorySection = () => {
  const data = useShiftStore(state => state.data.productionInventory);
  const updateData = useShiftStore(state => state.updateData);

  const fields = [
    { key: 'broasted', label: 'بروستد' },
    { key: 'tikka', label: 'تكا' },
    { key: 'zinger', label: 'زنجر' },
  ];

  return (
    <Card>
      <CardHeader title="جرد الإنتاج" />
      <div className="p-0">
        <table className="w-full text-xs sm:text-sm text-right border-collapse border border-gray-300">
          <tbody>
            {fields.map((field, idx) => (
              <tr key={field.key} className="border-b border-gray-300 last:border-b-0">
                <td className="px-2 py-1.5 bg-gray-50 border border-gray-300 font-bold text-gray-700 w-1/2 text-center">{field.label}</td>
                <td className="p-0 border border-gray-300">
                  <input
                    type="number"
                    value={data[field.key as keyof typeof data] || ''}
                    onChange={(e) => updateData(['productionInventory', field.key], Number(e.target.value))}
                    className="w-full h-full px-2 py-1.5 bg-transparent outline-none text-center"
                    dir="ltr"
                    placeholder="0"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export const calculateWage = (startTime: string, endTime: string, hourlyRate: number) => {
  if (!startTime || !endTime || !hourlyRate) return 0;
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let hours = (eh + em / 60) - (sh + sm / 60);
  if (hours < 0) hours += 24;
  return Number((hours * hourlyRate).toFixed(2));
};

export const EmployeeAdvancesSection = () => {
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

  return (
    <Card className="col-span-full">
      <CardHeader 
        title="سجل حضور وسلف الموظفين" 
        action={
          <button onClick={addEmployee} className="text-blue-600 hover:bg-blue-50 p-1 rounded transition-colors print:hidden">
            <Plus size={18} />
          </button>
        }
      />
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
              return (
                <tr key={emp.id} className="border-b border-gray-300 hover:bg-gray-50 transition-colors">
                  <td className="px-1 py-1.5 border border-gray-300 text-center text-gray-500 font-medium">{index + 1}</td>
                  <td className="p-0 border border-gray-300">
                    <div className="flex items-center justify-between px-2 py-1.5">
                      <input
                        type="text"
                        value={emp.employeeName}
                        onChange={(e) => {
                          updateData(['employeeAdvances', index, 'employeeName'], e.target.value);
                          if (index === data.length - 1 && e.target.value) {
                            addEmployee();
                          }
                        }}
                        className="w-full bg-transparent outline-none text-center"
                        placeholder="اسم الموظف"
                      />
                      {isOff && (
                        <span className="text-[10px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded whitespace-nowrap ml-1" title="لم يأتي إلى العمل">OFF</span>
                      )}
                    </div>
                  </td>
                  <td className="p-1 border border-gray-300">
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="time"
                        value={emp.startTime || ''}
                        onChange={(e) => updateData(['employeeAdvances', index, 'startTime'], e.target.value)}
                        className="bg-transparent outline-none text-center text-xs w-16"
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
                        className="bg-transparent outline-none text-center text-xs w-16"
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
                      value={emp.hourlyRate || ''}
                      onChange={(e) => updateData(['employeeAdvances', index, 'hourlyRate'], Number(e.target.value))}
                      className="w-full h-full px-1 py-1.5 bg-transparent outline-none text-center text-xs"
                      dir="ltr"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-2 py-1.5 border border-gray-300 text-center font-bold bg-blue-50/50 text-blue-800" dir="ltr">
                    {dailyWage.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                  </td>
                  <td className="p-0 border border-gray-300">
                    <input
                      type="number"
                      value={emp.amount || ''}
                      onChange={(e) => updateData(['employeeAdvances', index, 'amount'], Number(e.target.value))}
                      className="w-full h-full px-2 py-1.5 bg-transparent outline-none text-center font-bold text-red-600"
                      dir="ltr"
                      placeholder="0"
                    />
                  </td>
                  <td className="p-0 border border-gray-300">
                    <input
                      type="text"
                      value={emp.notes}
                      onChange={(e) => updateData(['employeeAdvances', index, 'notes'], e.target.value)}
                      className="w-full h-full px-2 py-1.5 bg-transparent outline-none text-center"
                      placeholder="-"
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
    </Card>
  );
};
