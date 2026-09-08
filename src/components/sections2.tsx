import React, { useRef, useEffect, useCallback } from 'react';
import { useShiftStore } from '../store/useShiftStore';
import { Card, CardHeader, CardContent } from './ui';
import { Plus, Trash2, RotateCcw, XCircle } from 'lucide-react';
import { cn, toEnglishNumbers } from '../lib/utils';

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
        <table className="w-full text-sm sm:text-base text-right border-collapse border border-gray-300 font-tajawal">
          <tbody>
            {fields.map((field) => {
              const val = data[field.key as keyof typeof data];
              const isFieldEmpty = !val;
              return (
                <tr key={field.key} className={cn("border-b border-gray-300 last:border-b-0", isFieldEmpty && "print:hidden export-empty-row")}>
                  <td className="px-3 py-2 bg-gray-100 border border-gray-300 font-extrabold text-gray-900 w-1/2 text-center text-sm sm:text-base">{field.label}</td>
                  <td className="p-0 border border-gray-300">
                    <input
                      type="number"
                      inputMode="decimal"
                      pattern="[0-9]*"
                      value={val || ''}
                      onFocus={(e) => e.target.select()}
                      onWheel={(e) => e.currentTarget.blur()}
                      onChange={(e) => updateData(['kitchenConsumption', field.key], Number(e.target.value))}
                      className="w-full h-full px-3 py-2 bg-transparent outline-none text-center font-black text-slate-950 text-sm sm:text-base md:text-lg focus:bg-amber-50/80 focus:text-indigo-900 transition-all duration-150"
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
        <table className="w-full text-sm sm:text-base text-right border-collapse border border-gray-300 font-tajawal">
          <tbody>
            {fields.map((field) => {
              const val = data[field.key as keyof typeof data];
              const isFieldEmpty = !val;
              return (
                <tr key={field.key} className={cn("border-b border-gray-300 last:border-b-0", isFieldEmpty && "print:hidden export-empty-row")}>
                  <td className="px-3 py-2 bg-gray-100 border border-gray-300 font-extrabold text-gray-900 w-1/2 text-center text-sm sm:text-base">{field.label}</td>
                  <td className="p-0 border border-gray-300">
                    <input
                      type="number"
                      inputMode="decimal"
                      pattern="[0-9]*"
                      value={val || ''}
                      onFocus={(e) => e.target.select()}
                      onWheel={(e) => e.currentTarget.blur()}
                      onChange={(e) => updateData(['productionInventory', field.key], Number(e.target.value))}
                      className="w-full h-full px-3 py-2 bg-transparent outline-none text-center font-black text-slate-950 text-sm sm:text-base md:text-lg focus:bg-amber-50/80 focus:text-indigo-900 transition-all duration-150"
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
  const sNorm = toEnglishNumbers(startTime);
  const eNorm = toEnglishNumbers(endTime);
  const [sh, sm] = sNorm.split(':').map(Number);
  const [eh, em] = eNorm.split(':').map(Number);
  let hours = (eh + em / 60) - (sh + sm / 60);
  if (hours < 0) hours += 24;
  return Number((hours * Number(hourlyRate)).toFixed(2));
};

export const formatTimeForDisplay = (timeStr?: string) => {
  if (!timeStr || !timeStr.trim()) return '-';
  const normalized = toEnglishNumbers(timeStr);
  const parts = normalized.trim().split(':');
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10);
    const m = parts[1].slice(0, 2);
    if (!isNaN(h)) {
      const isPM = h >= 12;
      const period = isPM ? 'مساءً' : 'صباحاً';
      const h12 = h % 12 === 0 ? 12 : h % 12;
      const hStr = h12 < 10 ? `0${h12}` : `${h12}`;
      return `${hStr}:${m} ${period}`;
    }
  }
  return normalized;
};

interface EmployeeRowProps {
  emp: any;
  index: number;
  totalLength: number;
  onUpdate: (index: number, field: string, value: any) => void;
  onCheckIn: (index: number) => void;
  onClearCheckIn: (index: number) => void;
  onCheckOut: (index: number) => void;
  onClearCheckOut: (index: number) => void;
  onRemove: (idOrIndex: string | number) => void;
  onAddEmployee: () => void;
}

const EmployeeRow = React.memo(({
  emp,
  index,
  totalLength,
  onUpdate,
  onCheckIn,
  onClearCheckIn,
  onCheckOut,
  onClearCheckOut,
  onRemove,
  onAddEmployee
}: EmployeeRowProps) => {
  const isOff = emp.employeeName.trim() && !emp.startTime && !emp.endTime;
  const hasBoth = emp.employeeName.trim() && emp.startTime && emp.endTime;
  const hasInOnly = emp.employeeName.trim() && emp.startTime && !emp.endTime && !isOff;
  const isEmpEmpty = !emp.employeeName.trim() && !emp.startTime && !emp.endTime && (!emp.amount || Number(emp.amount) === 0) && (!emp.hourlyRate || Number(emp.hourlyRate) === 0);
  const computedWage = calculateWage(emp.startTime, emp.endTime, emp.hourlyRate);

  return (
    <tr 
      key={emp.id} 
      className={cn(
        "border-b border-gray-300 transition-colors",
        isOff ? 'bg-rose-50/70 hover:bg-rose-100/70 border-rose-200' :
        hasBoth ? 'bg-emerald-50/50 hover:bg-emerald-100/60 border-emerald-200' :
        hasInOnly ? 'bg-sky-50/50 hover:bg-sky-100/60 border-sky-200' : 'hover:bg-gray-50',
        isEmpEmpty && "print:hidden export-empty-row"
      )}
    >
      <td className={`px-1.5 py-2 border border-gray-300 text-center font-bold text-sm sm:text-base ${
        isOff ? 'text-rose-700 bg-rose-100/60 font-black' :
        hasBoth ? 'text-emerald-800 bg-emerald-100/60 font-black' :
        hasInOnly ? 'text-sky-800 bg-sky-100/60 font-black' : 'text-gray-700'
      }`}>{index + 1}</td>
      <td className="p-0 border border-gray-300">
        <div className="flex items-center justify-between px-3 py-2">
          <input
            type="text"
            value={emp.employeeName}
            onFocus={(e) => e.target.select()}
            onChange={(e) => {
              onUpdate(index, 'employeeName', e.target.value);
              if (index === totalLength - 1 && e.target.value) {
                onAddEmployee();
              }
            }}
            className={`w-full bg-transparent outline-none text-center text-sm sm:text-base font-bold focus:bg-amber-50 ${
              isOff ? 'font-black text-rose-900' :
              hasBoth ? 'font-black text-emerald-950' :
              hasInOnly ? 'font-black text-sky-950' : 'text-slate-900'
            }`}
            placeholder="اسم الموظف"
          />
          {emp.employeeName.includes('مياوم') && (
            <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-1.5 py-0.5 rounded whitespace-nowrap ml-1 shrink-0 print:hidden" title="عامل مياومة">مياومة</span>
          )}
          {isOff && (
            <span className="text-[10px] bg-rose-600 text-white font-extrabold px-2 py-0.5 rounded shadow-xs whitespace-nowrap ml-1 animate-pulse shrink-0" title="عطلة (OFF) لهذا اليوم">OFF</span>
          )}
          {hasBoth && (
            <span className="text-[10px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap ml-1 shrink-0" title="تم تسجيل الدخول والخروج (مكتمل)">مكتمل</span>
          )}
          {hasInOnly && (
            <span className="text-[10px] bg-sky-600 text-white font-extrabold px-1.5 py-0.5 rounded shadow-xs whitespace-nowrap ml-1 animate-pulse shrink-0" title="تم تسجيل الدخول فقط (نشط / مستمر)">حاضر</span>
          )}
        </div>
      </td>
      <td className="p-1.5 border border-gray-300 text-center">
        <span className="export-time-text hidden font-black text-center text-black" dir="rtl">
          {formatTimeForDisplay(emp.startTime)}
        </span>
        <div className="export-time-input flex items-center justify-center gap-1 px-1">
          <input
            type="time"
            value={emp.startTime || ''}
            onChange={(e) => onUpdate(index, 'startTime', e.target.value)}
            className={`bg-transparent outline-none text-center text-sm sm:text-base font-bold w-20 sm:w-24 ${
              isOff ? 'text-rose-400 placeholder:text-rose-300' : ''
            }`}
          />
          {emp.startTime ? (
            <button
              type="button"
              onClick={() => onClearCheckIn(index)}
              className="p-1 rounded-md text-gray-400 hover:text-rose-700 hover:bg-rose-50 transition-colors print:hidden shrink-0 cursor-pointer"
              title="إلغاء / مسح وقت الدخول"
              aria-label="إلغاء وقت الدخول"
            >
              <RotateCcw size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onCheckIn(index)}
              className="text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded transition-colors print:hidden shrink-0 cursor-pointer"
              title="تسجيل وقت الدخول الحالي الآن"
            >
              دخول
            </button>
          )}
        </div>
      </td>
      <td className="p-1.5 border border-gray-300 text-center">
        <span className="export-time-text hidden font-black text-center text-black" dir="rtl">
          {formatTimeForDisplay(emp.endTime)}
        </span>
        <div className="export-time-input flex items-center justify-center gap-1 px-1">
          <input
            type="time"
            value={emp.endTime || ''}
            onChange={(e) => onUpdate(index, 'endTime', e.target.value)}
            className={`bg-transparent outline-none text-center text-sm sm:text-base font-bold w-20 sm:w-24 ${
              isOff ? 'text-rose-400 placeholder:text-rose-300' : ''
            }`}
          />
          {emp.endTime ? (
            <button
              type="button"
              onClick={() => onClearCheckOut(index)}
              className="p-1 rounded-md text-gray-400 hover:text-rose-700 hover:bg-rose-50 transition-colors print:hidden shrink-0 cursor-pointer"
              title="إلغاء / مسح وقت الخروج"
              aria-label="إلغاء وقت الخروج"
            >
              <RotateCcw size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onCheckOut(index)}
              className="text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded transition-colors print:hidden shrink-0 cursor-pointer"
              title="تسجيل وقت الخروج الحالي الآن"
            >
              خروج
            </button>
          )}
        </div>
      </td>
      <td className="p-0 border border-gray-300">
        <input
          type="number"
          inputMode="decimal"
          pattern="[0-9]*"
          value={emp.hourlyRate || ''}
          onFocus={(e) => e.target.select()}
          onChange={(e) => onUpdate(index, 'hourlyRate', Number(e.target.value))}
          className={`w-full h-full px-2 py-2 bg-transparent outline-none text-center text-sm sm:text-base font-black focus:bg-amber-50/80 focus:text-indigo-900 transition-all duration-150 ${
            isOff ? 'text-rose-400' : 'text-slate-900'
          }`}
          dir="ltr"
          placeholder="0"
          title="أجر الساعة الواحدة بالدينار"
        />
      </td>
      <td className="p-2 border border-gray-300 text-center bg-blue-50/40">
        <div className="flex flex-col items-center justify-center">
          <span className={`text-sm sm:text-base font-black ${computedWage > 0 ? 'text-blue-900' : 'text-gray-400'}`} dir="ltr">
            {computedWage > 0 ? `${computedWage.toFixed(2)} د.أ` : '-'}
          </span>
          {emp.hourlyRate > 0 && emp.startTime && !emp.endTime && (
            <span className="text-[10px] text-amber-700 font-bold print:hidden">بانتظار الخروج</span>
          )}
        </div>
      </td>
      <td className="p-0 border border-gray-300">
        <input
          type="number"
          inputMode="decimal"
          pattern="[0-9]*"
          value={emp.amount || ''}
          onFocus={(e) => e.target.select()}
          onChange={(e) => onUpdate(index, 'amount', Number(e.target.value))}
          className="w-full h-full px-2 py-2 bg-transparent outline-none text-center font-black text-rose-700 text-sm sm:text-base md:text-lg focus:bg-amber-50/80 transition-all duration-150"
          dir="ltr"
          placeholder="0"
          title="قيمة السلفة المسحوبة"
        />
      </td>
      <td className="p-0 border border-gray-300">
        <input
          type="text"
          value={emp.notes}
          onFocus={(e) => e.target.select()}
          onChange={(e) => onUpdate(index, 'notes', e.target.value)}
          className={`w-full h-full px-3 py-2 bg-transparent outline-none text-center text-sm sm:text-base font-bold focus:bg-amber-50 ${
            isOff ? 'text-rose-900' : 'text-slate-900'
          }`}
          placeholder={isOff ? "عطلة (OFF)" : "-"}
        />
      </td>
      <td className="p-1 text-center border border-gray-300 print:hidden w-10">
        <button 
          type="button"
          onClick={() => onRemove(emp.id || index)}
          className="text-red-400 hover:text-red-700 hover:bg-red-50 active:bg-red-100 p-1.5 rounded-md mx-auto flex items-center justify-center transition-all cursor-pointer group"
          title="حذف صف الموظف بالكامل"
          aria-label="حذف صف الموظف"
        >
          <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
        </button>
      </td>
    </tr>
  );
}, (prev, next) => prev.emp === next.emp && prev.index === next.index);

EmployeeRow.displayName = 'EmployeeRow';

export const EmployeeAdvancesSection = React.memo(() => {
  const data = useShiftStore(state => state.data.employeeAdvances);
  const updateData = useShiftStore(state => state.updateData);
  const addEmployee = useShiftStore(state => state.addEmployee);
  const removeEmployee = useShiftStore(state => state.removeEmployee);

  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const handleUpdate = useCallback((index: number, field: string, value: any) => {
    updateData(['employeeAdvances', index, field], value);
  }, [updateData]);

  const handleCheckIn = useCallback((index: number) => {
    const currentTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    updateData(['employeeAdvances', index, 'startTime'], currentTime);
  }, [updateData]);

  const handleClearCheckIn = useCallback((index: number) => {
    updateData(['employeeAdvances', index, 'startTime'], '');
  }, [updateData]);

  const handleCheckOut = useCallback((index: number) => {
    const currentTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    updateData(['employeeAdvances', index, 'endTime'], currentTime);
  }, [updateData]);

  const handleClearCheckOut = useCallback((index: number) => {
    updateData(['employeeAdvances', index, 'endTime'], '');
  }, [updateData]);

  const isEmpty = !data.length || data.every(emp => !emp.employeeName.trim() && !emp.startTime && !emp.endTime && !emp.amount && !emp.hourlyRate);
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
          <table className="w-full text-sm sm:text-base text-right border-collapse border border-gray-300 font-tajawal">
            <thead className="bg-gray-100 border-b border-gray-300">
              <tr>
                <th className="px-1.5 py-2 font-black text-gray-950 border border-gray-300 w-9 text-center text-sm sm:text-base">م</th>
                <th className="px-3 py-2 font-black text-gray-950 border border-gray-300 min-w-[130px] text-center text-sm sm:text-base">اسم الموظف</th>
                <th className="px-3 py-2 font-black text-gray-950 border border-gray-300 min-w-[140px] w-36 text-center text-sm sm:text-base">الدخول</th>
                <th className="px-3 py-2 font-black text-gray-950 border border-gray-300 min-w-[140px] w-36 text-center text-sm sm:text-base">الخروج</th>
                <th className="px-2 py-2 font-black text-gray-950 border border-gray-300 w-24 text-center text-sm sm:text-base">أجر/ساعة</th>
                <th className="px-2 py-2 font-black text-gray-950 border border-gray-300 w-28 text-center text-sm sm:text-base">أجر المياومة</th>
                <th className="px-2 py-2 font-black text-gray-950 border border-gray-300 w-28 text-center text-sm sm:text-base">قيمة السلفة</th>
                <th className="px-3 py-2 font-black text-gray-950 border border-gray-300 min-w-[130px] text-center text-sm sm:text-base">ملاحظات / توقيع</th>
                <th className="px-1 py-1 w-8 border border-gray-300 print:hidden"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((emp, index) => (
                <EmployeeRow
                  key={emp.id}
                  emp={emp}
                  index={index}
                  totalLength={data.length}
                  onUpdate={handleUpdate}
                  onCheckIn={handleCheckIn}
                  onClearCheckIn={handleClearCheckIn}
                  onCheckOut={handleCheckOut}
                  onClearCheckOut={handleClearCheckOut}
                  onRemove={removeEmployee}
                  onAddEmployee={addEmployee}
                />
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-6 text-center text-gray-500 font-bold text-xs bg-gray-50">
                    لا يوجد موظفين في الجدول حالياً.
                    <button 
                      type="button" 
                      onClick={addEmployee}
                      className="mr-2 text-blue-600 hover:underline inline-flex items-center gap-1 font-extrabold cursor-pointer"
                    >
                      <Plus size={14} /> اضغط هنا لإضافة موظف
                    </button>
                  </td>
                </tr>
              )}
              {(() => {
                const totalAdvancesOnly = data.reduce((acc, emp) => acc + (Number(emp.amount) || 0), 0);
                const totalWagesOnly = data.reduce((acc, emp) => acc + calculateWage(emp.startTime, emp.endTime, emp.hourlyRate), 0);
                const grandTotal = totalAdvancesOnly + totalWagesOnly;

                return (
                  <tr className="bg-gray-100 font-bold border-t border-gray-300">
                    <td colSpan={5} className="px-3 py-2.5 border border-gray-300 text-center text-[#0f172a] font-black text-sm sm:text-base">
                      الإجمالي (سلف + مياومات)
                    </td>
                    <td className="px-2 py-2.5 border border-gray-300 text-center text-blue-900 font-black text-sm sm:text-base" dir="ltr" title="إجمالي مياومات الساعات">
                      {totalWagesOnly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.أ
                    </td>
                    <td className="px-2 py-2.5 border border-gray-300 text-center text-[#be123c] font-black text-sm sm:text-base" dir="ltr" title="إجمالي السلف المسحوبة">
                      {totalAdvancesOnly.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.أ
                    </td>
                    <td colSpan={1} className="px-2 py-2.5 border border-gray-300 text-center text-emerald-950 font-black text-xs sm:text-sm bg-emerald-50" dir="ltr">
                      المجموع: {grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} د.أ
                    </td>
                    <td colSpan={1} className="border border-gray-300 print:hidden"></td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
        <div className="mt-2.5 flex justify-between items-center print:hidden">
          <button
            type="button"
            onClick={addEmployee}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus size={15} />
            <span>إضافة صف موظف جديد</span>
          </button>
          <span className="text-[11px] text-gray-500 font-medium">
            يتم حساب أجر المياومة تلقائياً (عدد الساعات × أجر/ساعة) وإضافته لتقرير السلف والجرد الفعلي.
          </span>
        </div>
      </CardContent>
    </Card>
  );
});

EmployeeAdvancesSection.displayName = 'EmployeeAdvancesSection';
