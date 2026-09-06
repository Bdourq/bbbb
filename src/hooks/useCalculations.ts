import { useShiftStore, ShiftData, LineItem } from '../store/useShiftStore';
import { calculateWage } from '../components/sections2';

const sumLineItems = (items: LineItem[]) => items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);

export const useCalculations = () => {
  const data = useShiftStore(state => state.data);

  // 1. Total Cash
  const addedReceivablesTotal = data.addCashReceivables
    ? sumLineItems(data.addCashReceivables)
    : (Number(data.cashAndSales.paidOldReceivables) || 0);

  const newReceivablesTotal = data.addNewReceivables
    ? sumLineItems(data.addNewReceivables)
    : (Number(data.cashAndSales.addedReceivables) || 0);

  const totalCash = 
    (Number(data.cashAndSales.openingCash) || 0) +
    (Number(data.cashAndSales.sales) || 0) +
    (Number(data.cashAndSales.otherSales) || 0) +
    newReceivablesTotal -
    addedReceivablesTotal;

  // 2. Sum of all expense lists + manual overrides
  const purchasesTotal = sumLineItems(data.purchases) + (Number(data.actualInventory.manualPurchases) || 0);
  const addMerchantTotal = sumLineItems(data.addMerchantReceivables);
  const payMerchantTotal = sumLineItems(data.payMerchantReceivables) + (Number(data.actualInventory.manualPayMerchant) || 0);
  const otherExpensesTotal = sumLineItems(data.otherExpenses) + (Number(data.actualInventory.manualOtherExpenses) || 0);
  const apartmentTotal = sumLineItems(data.apartment) + (Number(data.actualInventory.manualApartment) || 0);
  const adminExpensesTotal = sumLineItems(data.adminExpenses) + (Number(data.actualInventory.manualAdminExpenses) || 0);
  const yahyaTotal = sumLineItems(data.yahya) + (Number(data.actualInventory.manualYahya) || 0);
  const abuAbdullahTotal = sumLineItems(data.abuAbdullah) + (Number(data.actualInventory.manualAbuAbdullah) || 0);
  const spicesTotal = sumLineItems(data.spices) + (Number(data.actualInventory.manualSpices) || 0);
  const equipmentTotal = sumLineItems(data.equipment) + (Number(data.actualInventory.manualEquipment) || 0);
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
    ewalletTotal;

  const totalInventory = 
    (Number(data.actualInventory.actualCash) || 0) +
    (Number(data.actualInventory.visa) || 0) +
    (Number(data.actualInventory.rt) || 0) +
    (Number(data.actualInventory.maestro) || 0) +
    (Number(data.actualInventory.priceDifference) || 0) +
    ewalletTotal +
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
