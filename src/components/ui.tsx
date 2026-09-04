import React from 'react';
import { cn } from '../lib/utils';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { useShiftStore, ShiftData, LineItem } from '../store/useShiftStore';
import { useValidationStore } from '../store/useValidationStore';

export const Card = ({ children, className, 'data-empty': dataEmpty, id }: { children: React.ReactNode; className?: string; 'data-empty'?: boolean; id?: string }) => (
  <div id={id} data-empty={dataEmpty} className={cn("bg-white border rounded-xl shadow-sm overflow-hidden card-container transition-all duration-200", className)}>
    {children}
  </div>
);

export const CardHeader = ({ title, action, isError, errorMessage }: { title: string; action?: React.ReactNode; isError?: boolean; errorMessage?: string }) => (
  <div className={cn("px-3 py-2 flex justify-between items-center transition-colors", isError ? "bg-rose-100 border-b border-rose-300 text-rose-900" : "bg-gray-100 border-b border-gray-300 print:bg-gray-200")}>
    <div className="flex items-center gap-1.5">
      {isError && <AlertCircle size={16} className="text-rose-600 shrink-0 animate-bounce" />}
      <h3 className={cn("font-bold text-sm", isError ? "text-rose-900" : "text-gray-800")}>{title}</h3>
    </div>
    {action}
  </div>
);

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    inputMode={props.type === 'number' ? 'decimal' : props.inputMode}
    onFocus={(e) => {
      props.onFocus?.(e);
      e.target.select();
    }}
    className={cn(
      "w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-150 focus:scale-[1.02] focus:bg-amber-50/70 focus:text-base md:focus:text-lg focus:font-extrabold focus:z-10",
      props.className
    )}
  />
);

export const DynamicList = ({ 
  listKey, 
  title, 
  total,
  suggestions
}: { 
  listKey: keyof ShiftData; 
  title: string;
  total: number;
  suggestions?: string[];
}) => {
  const items = useShiftStore(state => state.data[listKey] as LineItem[]);
  const updateData = useShiftStore(state => state.updateData);
  const addLineItem = useShiftStore(state => state.addLineItem);
  const removeLineItem = useShiftStore(state => state.removeLineItem);
  
  const errorMessage = useValidationStore(state => state.errors[listKey as string]);
  const clearError = useValidationStore(state => state.clearError);

  const listId = `${listKey}-suggestions`;
  const isEmpty = total === 0 && items.every(i => !i.label.trim() && !i.amount);
  const hasError = Boolean(errorMessage);

  return (
    <Card 
      id={listKey as string} 
      data-empty={isEmpty} 
      className={cn(
        hasError && "ring-3 ring-rose-500 border-rose-500 shadow-md shadow-rose-100"
      )}
    >
      <CardHeader 
        title={title} 
        isError={hasError}
        errorMessage={errorMessage}
        action={
          <button onClick={() => addLineItem(listKey)} className="text-blue-600 hover:bg-blue-50 p-1 rounded">
            <Plus size={20} />
          </button>
        } 
      />
      
      {hasError && (
        <div className="bg-rose-50 px-3 py-1.5 border-b border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-1.5">
          <AlertCircle size={14} className="shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="p-0">
        {suggestions && suggestions.length > 0 && (
          <datalist id={listId}>
            {suggestions.map((suggestion, i) => (
              <option key={i} value={suggestion} />
            ))}
          </datalist>
        )}
        <table className="w-full text-xs sm:text-sm text-right border-collapse border border-gray-300">
          <thead className="bg-gray-50 border-b border-gray-300">
            <tr>
              <th className="px-2 py-1.5 font-bold text-gray-700 w-1/2 border border-gray-300 text-center">البيان</th>
              <th className="px-2 py-1.5 font-bold text-gray-700 w-1/2 border border-gray-300 text-center">المبلغ</th>
              <th className="px-1 py-1 w-8 border border-gray-300 print:hidden"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-3 text-center text-gray-400 text-xs border border-gray-300">
                  <span>لا توجد بنود مضافة</span>
                  <button
                    type="button"
                    onClick={() => addLineItem(listKey)}
                    className="mr-2 text-blue-600 hover:underline font-medium print:hidden"
                  >
                    + إضافة بند
                  </button>
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const isItemMissingLabel = Number(item.amount) > 0 && !item.label.trim();
                return (
                  <tr key={item.id} className={cn("border-b border-gray-300 hover:bg-gray-50", isItemMissingLabel && "bg-rose-50/60")}>
                    <td className="p-0 border border-gray-300 relative">
                      <input 
                        type="text"
                        list={suggestions ? listId : undefined}
                        value={item.label}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          updateData([listKey, index, 'label'], e.target.value);
                          if (e.target.value.trim() && errorMessage) {
                            clearError(listKey as string);
                          }
                          if (index === items.length - 1 && e.target.value) {
                            addLineItem(listKey);
                          }
                        }}
                        className={cn(
                          "w-full h-full px-2 py-1.5 bg-transparent outline-none text-center focus:bg-amber-50/80 focus:font-bold focus:text-base transition-all duration-150",
                          isItemMissingLabel && "border-2 border-rose-400 bg-rose-100/50 placeholder:text-rose-500 font-bold"
                        )}
                        placeholder={isItemMissingLabel ? "⚠️ البيان مطلوب!" : "البيان"}
                        dir="rtl"
                      />
                    </td>
                    <td className="p-0 border border-gray-300">
                      <input 
                        type="number"
                        inputMode="decimal"
                        pattern="[0-9]*"
                        value={item.amount || ''}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          updateData([listKey, index, 'amount'], Number(e.target.value));
                          if (index === items.length - 1 && Number(e.target.value) > 0) {
                            addLineItem(listKey);
                          }
                        }}
                        className="w-full h-full px-2 py-1.5 bg-transparent outline-none text-center focus:bg-amber-50/80 focus:font-black focus:text-base sm:focus:text-lg focus:text-indigo-900 transition-all duration-150"
                        placeholder="0"
                        dir="ltr"
                      />
                    </td>
                    <td className="p-1 text-center border border-gray-300 print:hidden">
                      <button 
                        onClick={() => removeLineItem(listKey, item.id)}
                        className="text-red-500 hover:bg-red-50 p-1 rounded mx-auto block"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
            <tr className="bg-gray-100 font-bold border-t border-gray-300">
              <td className="px-2 py-1.5 border border-gray-300 text-center text-gray-800">الإجمالي</td>
              <td className="px-2 py-1.5 border border-gray-300 text-center text-gray-900" dir="ltr">{total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
              <td className="border border-gray-300 print:hidden"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
};
