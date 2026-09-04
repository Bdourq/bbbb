import { create } from 'zustand';
import { ShiftData } from './useShiftStore';

export interface ValidationErrorState {
  errors: Record<string, string>;
  isValidationTriggered: boolean;
  activeErrorKey: string | null;
  triggerValidation: (data: ShiftData, totalCollected: number, totalExpenses: number) => { isValid: boolean; errors: Record<string, string>; errorList: string[] };
  clearError: (key: string) => void;
  clearAllErrors: () => void;
  scrollToError: (elementId: string) => void;
}

export const useValidationStore = create<ValidationErrorState>((set, get) => ({
  errors: {},
  isValidationTriggered: false,
  activeErrorKey: null,

  triggerValidation: (data: ShiftData, totalCollected: number, totalExpenses: number) => {
    const errors: Record<string, string> = {};
    const errorList: string[] = [];

    // 2. Cash and Sales
    if ((Number(data.cashAndSales.openingCash) || 0) === 0 && (Number(data.cashAndSales.sales) || 0) === 0) {
      errors['cashData'] = 'يرجى إدخال النقد الافتتاحي ومبيعات اليوم في قسم حركات الكاش';
      errorList.push('بيانات النقد الافتتاحي والمبيعات فارغة');
    }

    // 3. Actual Inventory
    if ((Number(data.actualInventory.actualCash) || 0) === 0 && totalCollected === 0) {
      errors['actualInventory'] = 'يرجى إدخال الكاش الفعلي المعدود باليد في قسم الجرد الفعلي';
      errorList.push('الجرد الفعلي (الكاش المعدود) غير مدخل');
    }

    // 4. Dynamic lists with missing labels
    const listsToCheck: Array<{ key: keyof ShiftData; title: string }> = [
      { key: 'purchases', title: 'مشتريات' },
      { key: 'otherExpenses', title: 'مصاريف أخرى' },
      { key: 'abuAbdullah', title: 'أبو عبدالله' },
      { key: 'equipment', title: 'معدات وصيانة' },
      { key: 'addMerchantReceivables', title: 'إضافة ذمم تجار' },
      { key: 'apartment', title: 'الشقة' },
      { key: 'adminExpenses', title: 'مصاريف إدارية' },
      { key: 'ewallet', title: 'المحفظة الإلكترونية' },
      { key: 'payMerchantReceivables', title: 'سداد ذمم تجار' },
      { key: 'yahya', title: 'يحيى' },
      { key: 'spices', title: 'بهارات' },
      { key: 'addCashReceivables', title: 'إضافة ذمم كاش' },
    ];

    for (const listInfo of listsToCheck) {
      const items = (data[listInfo.key] as any[]) || [];
      const hasEmptyLabel = items.some(item => (Number(item.amount) || 0) > 0 && !item.label?.trim());
      if (hasEmptyLabel) {
        errors[listInfo.key as string] = `يوجد مبالغ في جدول (${listInfo.title}) بدون كتابة البيان التوضيحي`;
        errorList.push(`جدول (${listInfo.title}): مبالغ مسجلة بدون بيان`);
      }
    }

    // 5. Custody items check (تذكير بالعهدة المعلقة سحب أو إيداع عند الإغلاق)
    const custodyItems = (data.custodyItems as any[]) || [];
    const totalCustodyOut = custodyItems
      .filter(item => item.type === 'out')
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const totalCustodyIn = custodyItems
      .filter(item => item.type === 'in')
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const netPendingCustody = totalCustodyOut - totalCustodyIn;

    if (custodyItems.length > 0 && Math.abs(netPendingCustody) > 0.01) {
      errors['custodySection'] = `تنبيه عهدة: يوجد رصيد عهدة معلق بقيمة (${Math.abs(netPendingCustody).toFixed(2)}) د.أ يجب تسويته أو إغلاقه قبل إنهاء الشفت`;
      errorList.push(`جدول العهدة: رصيد معلق (${Math.abs(netPendingCustody).toFixed(2)} د.أ) بحاجة لتسوية`);
    }

    const isValid = Object.keys(errors).length === 0;

    set({
      errors,
      isValidationTriggered: true,
      activeErrorKey: Object.keys(errors)[0] || null
    });

    return { isValid, errors, errorList };
  },

  clearError: (key: string) => {
    set((state) => {
      const updated = { ...state.errors };
      delete updated[key];
      return {
        errors: updated,
        activeErrorKey: Object.keys(updated)[0] || null
      };
    });
  },

  clearAllErrors: () => {
    set({
      errors: {},
      isValidationTriggered: false,
      activeErrorKey: null
    });
  },

  scrollToError: (elementId: string) => {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('highlight-pulse');
      setTimeout(() => {
        el.classList.remove('highlight-pulse');
      }, 3000);
    }
  }
}));
