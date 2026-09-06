import { ShiftData } from '../store/useShiftStore';
import { calculateWage } from '../components/sections2';

export const sumLineItems = (items?: Array<{ amount?: number | string }>) =>
  (items || []).reduce((acc, item) => acc + (Number(item?.amount) || 0), 0);

export interface ShiftCalculationsResult {
  totalCash: number;
  totalExpenses: number;
  purchasesTotal: number;
  addMerchantTotal: number;
  payMerchantTotal: number;
  otherExpensesTotal: number;
  apartmentTotal: number;
  adminExpensesTotal: number;
  yahyaTotal: number;
  abuAbdullahTotal: number;
  spicesTotal: number;
  equipmentTotal: number;
  ewalletTotal: number;
  advancesTotal: number;
  effectiveAdvances: number;
  expensesWithoutAdvances: number;
  totalInventory: number;
  totalCollected: number;
  expectedCash: number;
  diff: number;
  cashShortage: number;
  cashSurplus: number;
}

/**
 * دالة موحدة لحساب كافة مؤشرات الشفت المالية:
 * (totalInventory, totalCash, cashShortage, cashSurplus, diff, ...)
 * ملاحظة: addMerchantReceivables متعمد أن يكون للعرض فقط ولا يدخل في أي حساب.
 */
export function calculateShiftMetrics(data: ShiftData): ShiftCalculationsResult {
  const cashInfo = data?.cashAndSales || ({} as any);

  // 1. Total Cash (مجموع الكاش المطلوب)
  const addedReceivablesTotal = data?.addCashReceivables
    ? sumLineItems(data.addCashReceivables)
    : (Number(cashInfo.paidOldReceivables) || 0);

  const newReceivablesTotal = data?.addNewReceivables
    ? sumLineItems(data.addNewReceivables)
    : (Number(cashInfo.addedReceivables) || 0);

  const totalCash =
    (Number(cashInfo.openingCash) || 0) +
    (Number(cashInfo.sales) || 0) +
    (Number(cashInfo.otherSales) || 0) +
    newReceivablesTotal -
    addedReceivablesTotal;

  // 2. Sum of all expense lists + manual overrides
  // ملاحظة هامة: addMerchantReceivables للعرض فقط ولا تدخل في حساب المصاريف
  const purchasesTotal = sumLineItems(data?.purchases) + (Number(data?.actualInventory?.manualPurchases) || 0);
  const addMerchantTotal = sumLineItems(data?.addMerchantReceivables);
  const payMerchantTotal = sumLineItems(data?.payMerchantReceivables) + (Number(data?.actualInventory?.manualPayMerchant) || 0);
  const otherExpensesTotal = sumLineItems(data?.otherExpenses) + (Number(data?.actualInventory?.manualOtherExpenses) || 0);
  const apartmentTotal = sumLineItems(data?.apartment) + (Number(data?.actualInventory?.manualApartment) || 0);
  const adminExpensesTotal = sumLineItems(data?.adminExpenses) + (Number(data?.actualInventory?.manualAdminExpenses) || 0);
  const yahyaTotal = sumLineItems(data?.yahya) + (Number(data?.actualInventory?.manualYahya) || 0);
  const abuAbdullahTotal = sumLineItems(data?.abuAbdullah) + (Number(data?.actualInventory?.manualAbuAbdullah) || 0);
  const spicesTotal = sumLineItems(data?.spices) + (Number(data?.actualInventory?.manualSpices) || 0);
  const equipmentTotal = sumLineItems(data?.equipment) + (Number(data?.actualInventory?.manualEquipment) || 0);
  const ewalletTotal = sumLineItems(data?.ewallet);

  // 3. Advances total (مجموع السلف والمياومات من جدول الموظفين)
  const advancesTotal = (data?.employeeAdvances || []).reduce((acc, emp) => {
    const dailyWage = calculateWage(emp.startTime, emp.endTime, emp.hourlyRate);
    return acc + dailyWage + (Number(emp.amount) || 0);
  }, 0);

  // 4. مجموع المصاريف بدون السلف
  const expensesWithoutAdvances =
    purchasesTotal +
    payMerchantTotal +
    otherExpensesTotal +
    apartmentTotal +
    adminExpensesTotal +
    yahyaTotal +
    abuAbdullahTotal +
    spicesTotal +
    equipmentTotal;

  const totalExpenses = expensesWithoutAdvances + advancesTotal;

  // التفريق الدقيق بين: "صفر مُدخل فعلياً" و "لم يُدخل شيء"
  const rawAdvances = data?.actualInventory?.advances;
  const isAdvancesEntered = rawAdvances !== undefined && rawAdvances !== null && (rawAdvances as unknown) !== '' && !isNaN(Number(rawAdvances));
  const effectiveAdvances = isAdvancesEntered ? (Number(rawAdvances) || 0) : (advancesTotal || 0);

  // 5. Total Actual Inventory (مجموع الجرد الفعلي)
  const actualCounted =
    (Number(data?.actualInventory?.actualCash) || 0) +
    (Number(data?.actualInventory?.visa) || 0) +
    (Number(data?.actualInventory?.rt) || 0) +
    (Number(data?.actualInventory?.maestro) || 0) +
    (Number(data?.actualInventory?.priceDifference) || 0) +
    effectiveAdvances +
    ewalletTotal;

  const totalInventory = actualCounted + expensesWithoutAdvances;
  const totalCollected = actualCounted;

  // Expected Cash = Total Cash - Total Expenses
  const expectedCash = totalCash - totalExpenses;

  // الفارق المالي النهائي بين مجموع الجرد الفعلي ومجموع الكاش المطلوب:
  // diff = مجموع الجرد الفعلي - مجموع الكاش
  const diff = Number((totalInventory - totalCash).toFixed(2));
  const cashShortage = diff < -0.009 ? Math.abs(diff) : 0;
  const cashSurplus = diff > 0.009 ? diff : 0;

  return {
    totalCash,
    totalExpenses,
    purchasesTotal,
    addMerchantTotal,
    payMerchantTotal,
    otherExpensesTotal,
    apartmentTotal,
    adminExpensesTotal,
    yahyaTotal,
    abuAbdullahTotal,
    spicesTotal,
    equipmentTotal,
    ewalletTotal,
    advancesTotal,
    effectiveAdvances,
    expensesWithoutAdvances,
    totalInventory,
    totalCollected,
    expectedCash,
    diff,
    cashShortage,
    cashSurplus,
  };
}
