import { useShiftStore, ShiftData, LineItem } from '../store/useShiftStore';
import { calculateWage } from '../components/sections2';

const sumLineItems = (items: LineItem[]) => items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);

export const useCalculations = () => {
  const data = useShiftStore(state => state.data);

  // 1. Total Cash
  const addedReceivablesTotal = data.addCashReceivables
    ? sumLineItems(data.addCashReceivables)
    : (Number(data.cashAndSales.addedReceivables) || 0);

  const totalCash = 
    (Number(data.cashAndSales.openingCash) || 0) +
    addedReceivablesTotal +
    (Number(data.cashAndSales.paidOldReceivables) || 0) +
    (Number(data.cashAndSales.sales) || 0) +
    (Number(data.cashAndSales.otherSales) || 0);

  // 2. Sum of all expense lists
  const purchasesTotal = sumLineItems(data.purchases);
  const addMerchantTotal = sumLineItems(data.addMerchantReceivables);
  const payMerchantTotal = sumLineItems(data.payMerchantReceivables);
  const otherExpensesTotal = sumLineItems(data.otherExpenses);
  const apartmentTotal = sumLineItems(data.apartment);
  const adminExpensesTotal = sumLineItems(data.adminExpenses);
  const yahyaTotal = sumLineItems(data.yahya);
  const abuAbdullahTotal = sumLineItems(data.abuAbdullah);
  const spicesTotal = sumLineItems(data.spices);
  const equipmentTotal = sumLineItems(data.equipment);
  const ewalletTotal = sumLineItems(data.ewallet);

  // 3. Advances total (Advances + Daily Wages)
  const advancesTotal = data.employeeAdvances.reduce((acc, emp) => {
    const dailyWage = calculateWage(emp.startTime, emp.endTime, emp.hourlyRate);
    return acc + dailyWage + (Number(emp.amount) || 0);
  }, 0);

  // 4. Total Expenses (المصاريف وسداد الذمم والسلف)
  const totalExpenses = 
    purchasesTotal +
    payMerchantTotal +
    otherExpensesTotal +
    apartmentTotal +
    adminExpensesTotal +
    yahyaTotal +
    abuAbdullahTotal +
    spicesTotal +
    equipmentTotal +
    advancesTotal;

  // 5. Total Actual Inventory (مجموع الجرد الفعلي: نقد + فيزا + Rt + مايسترو + فرق سعر + سلف + محفظة + كافة المصاريف وقوائم الجرد)
  // في الكشف الورقي: مجموع الجرد الفعلي = (نقد فعلي + فيزا + Rt + مايسترو + فرق سعر + سلف + المحفظة) + مجموع المصاريف
  const actualCounted = 
    (Number(data.actualInventory.actualCash) || 0) +
    (Number(data.actualInventory.visa) || 0) +
    (Number(data.actualInventory.rt) || 0) +
    (Number(data.actualInventory.maestro) || 0) +
    (Number(data.actualInventory.priceDifference) || 0) +
    (Number(data.actualInventory.advances) || advancesTotal || 0) +
    (Number(data.actualInventory.wallet) || 0);

  const totalInventory = 
    (Number(data.actualInventory.actualCash) || 0) +
    (Number(data.actualInventory.visa) || 0) +
    (Number(data.actualInventory.rt) || 0) +
    (Number(data.actualInventory.maestro) || 0) +
    (Number(data.actualInventory.priceDifference) || 0) +
    (Number(data.actualInventory.wallet) || 0) +
    totalExpenses;

  // Total Collected (المعدود كاش وفيزا وغيره)
  const totalCollected = actualCounted;

  // الفرق المالي النهائي بين مجموع الجرد الفعلي ومجموع الكاش المطلوب:
  // diff = مجموع الجرد الفعلي - مجموع الكاش
  const diff = Number((totalInventory - totalCash).toFixed(2));
  const cashShortage = diff < -0.009 ? Math.abs(diff) : 0;
  const cashSurplus = diff > 0.009 ? diff : 0;

  // Expected Cash = Total Cash - Total Expenses
  const expectedCash = totalCash - totalExpenses;

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
    totalInventory,
    totalCollected,
    expectedCash,
    cashShortage,
    cashSurplus,
  };
};
