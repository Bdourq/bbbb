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

  // 4. Total Inventory (Expenses + Advances)
  const totalInventory = 
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

  // 5. Total Collected
  const totalCollected = 
    (Number(data.actualInventory.actualCash) || 0) +
    (Number(data.actualInventory.visa) || 0) +
    (Number(data.actualInventory.rt) || 0) +
    (Number(data.actualInventory.maestro) || 0) +
    (Number(data.actualInventory.priceDifference) || 0) +
    (Number(data.actualInventory.wallet) || 0);

  // Expected Cash = Total Cash - Total Expenses
  const expectedCash = totalCash - totalInventory;

  // Shortage / Surplus
  const diff = totalCollected - expectedCash;
  const cashShortage = diff < 0 ? diff : 0;
  const cashSurplus = diff > 0 ? diff : 0;

  return {
    totalCash,
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
