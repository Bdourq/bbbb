import React, { createContext, useContext, useState } from 'react';
import { cn } from '../lib/utils';
import { Plus, Trash2, AlertCircle, ChevronDown } from 'lucide-react';
import { useShiftStore, ShiftData, LineItem } from '../store/useShiftStore';
import { useValidationStore } from '../store/useValidationStore';

interface CardContextType {
  isOpen: boolean;
  toggle: () => void;
  collapsible: boolean;
}

const CardContext = createContext<CardContextType>({
  isOpen: true,
  toggle: () => {},
  collapsible: true,
});

export const Card = ({ 
  children, 
  className, 
  'data-empty': dataEmpty, 
  id,
  collapsible = true,
  defaultOpen = true
}: { 
  children: React.ReactNode; 
  className?: string; 
  'data-empty'?: boolean; 
  id?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = () => {
    if (collapsible) {
      setIsOpen(prev => !prev);
    }
  };

  return (
    <CardContext.Provider value={{ isOpen, toggle, collapsible }}>
      <div id={id} data-empty={dataEmpty} className={cn("bg-white border rounded-xl shadow-sm overflow-hidden card-container transition-all duration-200", className)}>
        {children}
      </div>
    </CardContext.Provider>
  );
};

export const CardHeader = ({ 
  title, 
  action, 
  isError, 
  errorMessage,
  badge,
  headerClassName
}: { 
  title: string; 
  action?: React.ReactNode; 
  isError?: boolean; 
  errorMessage?: string;
  badge?: React.ReactNode;
  headerClassName?: string;
}) => {
  const { isOpen, toggle, collapsible } = useContext(CardContext);

  return (
    <div 
      onClick={collapsible ? toggle : undefined}
      className={cn(
        "px-3 py-2 flex justify-between items-center transition-colors select-none",
        collapsible && "cursor-pointer hover:bg-gray-200/70 active:bg-gray-200",
        isError ? "bg-rose-100 border-b border-rose-300 text-rose-900" : (headerClassName || "bg-gray-100 border-b border-gray-300 print:bg-gray-200")
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {isError && <AlertCircle size={16} className="text-rose-600 shrink-0 animate-bounce" />}
        <h3 className={cn("font-bold text-sm truncate", isError ? "text-rose-900" : headerClassName ? "text-white font-black text-base" : "text-gray-800")}>{title}</h3>
        {badge}
      </div>
      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
        {action}
        {collapsible && (
          <button
            type="button"
            onClick={toggle}
            className="p-1 text-gray-500 hover:text-gray-800 hover:bg-gray-200/80 rounded transition-colors print:hidden cursor-pointer"
            aria-label={isOpen ? "طي الجدول" : "توسيع الجدول"}
            title={isOpen ? "طي الجدول" : "توسيع الجدول"}
          >
            <ChevronDown size={18} className={cn("transition-transform duration-200", isOpen && "rotate-180")} />
          </button>
        )}
      </div>
    </div>
  );
};

export const CardContent = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const { isOpen } = useContext(CardContext);

  return (
    <div className={cn(
      "p-0 transition-all duration-200 card-body-content",
      !isOpen && "hidden print:block export-block",
      className
    )}>
      {children}
    </div>
  );
};

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
  suggestions,
  hideLabel,
  className
}: { 
  listKey: keyof ShiftData; 
  title: string;
  total: number;
  suggestions?: string[];
  hideLabel?: boolean;
  className?: string;
  key?: React.Key;
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
        hasError && "ring-3 ring-rose-500 border-rose-500 shadow-md shadow-rose-100",
        className
      )}
    >
      <CardHeader 
        title={title} 
        isError={hasError}
        errorMessage={errorMessage}
        badge={total > 0 ? (
          <span className="text-xs font-black bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded-md border border-indigo-200 print:hidden">
            {total.toLocaleString('en-US')}
          </span>
        ) : undefined}
        action={
          <button onClick={() => addLineItem(listKey)} className="text-blue-600 hover:bg-blue-50 p-1 rounded cursor-pointer">
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

      <CardContent>
        {suggestions && suggestions.length > 0 && !hideLabel && (
          <datalist id={listId}>
            {suggestions.map((suggestion, i) => (
              <option key={i} value={suggestion} />
            ))}
          </datalist>
        )}
        <table className="w-full text-xs sm:text-sm text-right border-collapse border border-gray-300">
          <thead className="bg-gray-100 border-b border-gray-300">
            <tr>
              {!hideLabel ? (
                <>
                  <th className="px-2 py-1.5 font-extrabold text-gray-900 w-1/2 border border-gray-300 text-center">البيان</th>
                  <th className="px-2 py-1.5 font-extrabold text-gray-900 w-1/2 border border-gray-300 text-center">المبلغ</th>
                </>
              ) : (
                <>
                  <th className="px-1 py-1.5 font-extrabold text-gray-900 w-10 border border-gray-300 text-center">م</th>
                  <th className="px-2 py-1.5 font-extrabold text-gray-900 border border-gray-300 text-center">المبلغ</th>
                </>
              )}
              <th className="px-1 py-1 w-8 border border-gray-300 print:hidden"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={hideLabel ? 3 : 3} className="py-3 text-center text-gray-500 font-medium text-xs border border-gray-300">
                  <span>لا توجد بنود مضافة</span>
                  <button
                    type="button"
                    onClick={() => addLineItem(listKey)}
                    className="mr-2 text-blue-600 hover:underline font-bold print:hidden cursor-pointer"
                  >
                    + إضافة بند
                  </button>
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const isItemMissingLabel = !hideLabel && Number(item.amount) > 0 && !item.label.trim();
                const isItemEmpty = !item.label.trim() && !item.amount;
                return (
                  <tr key={item.id} className={cn("border-b border-gray-300 hover:bg-gray-50", isItemMissingLabel && "bg-rose-50/60", isItemEmpty && "print:hidden export-empty-row")}>
                    {!hideLabel ? (
                      <td className="p-0 border border-gray-300 relative">
                        <input 
                          type="text"
                          list={suggestions ? listId : undefined}
                          value={item.label}
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
                            updateData([listKey, index, 'label'], e.target.value);
                            if (e.target.value.trim() && errorMessage) {
                              clearError(listKey as string);
                            }
                            if (index === items.length - 1 && e.target.value) {
                              addLineItem(listKey);
                            }
                          }}
                          className={cn(
                            "w-full h-full px-2 py-1.5 bg-transparent outline-none text-center font-bold text-gray-900 focus:bg-amber-50/80 focus:font-black focus:text-base transition-all duration-150",
                            isItemMissingLabel && "border-2 border-rose-400 bg-rose-100/50 placeholder:text-rose-500 font-bold"
                          )}
                          placeholder={isItemMissingLabel ? "⚠️ البيان مطلوب!" : "البيان"}
                          dir="rtl"
                        />
                      </td>
                    ) : (
                      <td className="px-1 py-1.5 bg-gray-100 font-extrabold text-gray-800 border border-gray-300 text-center w-10">
                        {index + 1}
                      </td>
                    )}
                    <td className="p-0 border border-gray-300">
                      <input 
                        type="number"
                        inputMode="decimal"
                        pattern="[0-9]*"
                        step="any"
                        value={item.amount || ''}
                        onFocus={(e) => e.target.select()}
                        onWheel={(e) => e.currentTarget.blur()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === 'Tab') {
                            e.preventDefault();
                            if (index === items.length - 1) {
                              if (!item.label.trim() && !item.amount) return;
                              addLineItem(listKey);
                              setTimeout(() => {
                                const row = (e.target as HTMLElement).closest('tr');
                                const nextRow = row?.nextElementSibling;
                                const nextLabelInput = nextRow?.querySelector('input[type="text"], input[type="number"]') as HTMLInputElement;
                                nextLabelInput?.focus();
                              }, 10);
                            } else {
                              const row = (e.target as HTMLElement).closest('tr');
                              const nextRow = row?.nextElementSibling;
                              const nextLabelInput = nextRow?.querySelector('input[type="text"], input[type="number"]') as HTMLInputElement;
                              nextLabelInput?.focus();
                            }
                          }
                        }}
                        onChange={(e) => {
                          updateData([listKey, index, 'amount'], Number(e.target.value));
                          if (index === items.length - 1 && Number(e.target.value) > 0) {
                            addLineItem(listKey);
                          }
                        }}
                        className="w-full h-full px-2 py-1.5 bg-transparent outline-none text-center font-extrabold text-slate-950 focus:bg-amber-50/80 focus:font-black focus:text-base sm:focus:text-lg focus:text-indigo-900 transition-all duration-150"
                        placeholder="0"
                        dir="ltr"
                      />
                    </td>
                    <td className="p-1 text-center border border-gray-300 print:hidden">
                      <button 
                        onClick={() => removeLineItem(listKey, item.id)}
                        className="text-red-500 hover:bg-red-50 p-1 rounded mx-auto block cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
            <tr className="bg-gray-100 font-extrabold border-t border-gray-300">
              <td className="px-2 py-1.5 border border-gray-300 text-center text-gray-900 font-extrabold" colSpan={hideLabel ? 1 : 1}>الإجمالي</td>
              <td className="px-2 py-1.5 border border-gray-300 text-center text-slate-950 font-black text-xs sm:text-sm" dir="ltr">{total.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</td>
              <td className="border border-gray-300 print:hidden"></td>
            </tr>
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
};

