import React from 'react';
import { cn } from '../lib/utils';
import { Plus, Trash2 } from 'lucide-react';
import { useShiftStore, ShiftData, LineItem } from '../store/useShiftStore';

export const Card = ({ children, className, 'data-empty': dataEmpty }: { children: React.ReactNode; className?: string; 'data-empty'?: boolean }) => (
  <div data-empty={dataEmpty} className={cn("bg-white border rounded-xl shadow-sm overflow-hidden card-container", className)}>
    {children}
  </div>
);

export const CardHeader = ({ title, action }: { title: string; action?: React.ReactNode }) => (
  <div className="bg-gray-100 border-b border-gray-300 px-3 py-2 flex justify-between items-center print:bg-gray-200">
    <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
    {action}
  </div>
);

export const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={cn(
      "w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all",
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

  const listId = `${listKey}-suggestions`;
  const isEmpty = total === 0 && items.every(i => !i.label.trim() && !i.amount);

  return (
    <Card data-empty={isEmpty}>
      <CardHeader 
        title={title} 
        action={
          <button onClick={() => addLineItem(listKey)} className="text-blue-600 hover:bg-blue-50 p-1 rounded">
            <Plus size={20} />
          </button>
        } 
      />
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
              items.map((item, index) => (
              <tr key={item.id} className="border-b border-gray-300 hover:bg-gray-50">
                <td className="p-0 border border-gray-300">
                  <input 
                    type="text"
                    list={suggestions ? listId : undefined}
                    value={item.label}
                    onChange={(e) => {
                      updateData([listKey, index, 'label'], e.target.value);
                      if (index === items.length - 1 && e.target.value) {
                        addLineItem(listKey);
                      }
                    }}
                    className="w-full h-full px-2 py-1.5 bg-transparent outline-none text-center focus:bg-white"
                    placeholder="البيان"
                    dir="rtl"
                  />
                </td>
                <td className="p-0 border border-gray-300">
                  <input 
                    type="number"
                    value={item.amount || ''}
                    onChange={(e) => {
                      updateData([listKey, index, 'amount'], Number(e.target.value));
                      if (index === items.length - 1 && Number(e.target.value) > 0) {
                        addLineItem(listKey);
                      }
                    }}
                    className="w-full h-full px-2 py-1.5 bg-transparent outline-none text-center focus:bg-white"
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
            ))
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
