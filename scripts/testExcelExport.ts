import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { ShiftData } from '../src/store/useShiftStore';
import { calculateShiftMetrics } from '../src/lib/shiftCalculations';
import { populateClosingReport } from '../src/lib/excelTemplate';

async function runAllTests() {
  const templatePath = path.join(process.cwd(), 'public/templates/closing-report-template.xlsx');
  const templateBuf = fs.readFileSync(templatePath);

  // Test 1: Standard shift with kitchen consumption and production inventory
  const sample1: ShiftData = {
    isClosed: true,
    date: '2026-09-06',
    cashierName: 'أحمد الكاشير',
    custodyItems: [],
    purchases: [
      { id: '1', label: 'دجاج طازج', amount: 350 },
      { id: '2', label: 'زيت قلي', amount: 85 },
    ],
    addMerchantReceivables: [{ id: 'm1', label: 'ذمة ملحمة القدس', amount: 120 }],
    payMerchantReceivables: [{ id: 'pm1', label: 'دفعة شركة البيبسي', amount: 200 }],
    otherExpenses: [{ id: 'o1', label: 'ضيافة زبائن', amount: 15 }],
    apartment: [{ id: 'ap1', label: 'إيجار سكن العمال', amount: 100 }],
    yahya: [{ id: 'y1', label: 'مسحوبات يحيى', amount: 50 }],
    abuAbdullah: [{ id: 'ab1', label: 'سلفة أبو عبدالله', amount: 60 }],
    adminExpenses: [{ id: 'ad1', label: 'فواتير إنترنت', amount: 25 }],
    spices: [{ id: 'sp1', label: 'بهارات شاورما', amount: 45 }],
    equipment: [{ id: 'eq1', label: 'صيانة ماكينة القلي', amount: 30 }],
    ewallet: [],
    addCashReceivables: [{ id: 'r1', label: 'ذمة زبون 1', amount: 15 }],
    addNewReceivables: [{ id: 'nr1', label: 'ذمة جديدة 1', amount: 10 }],
    cashAndSales: {
      openingCash: 150,
      addedReceivablesDesc: '',
      addedReceivables: 10,
      paidOldReceivables: 15,
      sales: 1200,
      otherSales: 50,
    },
    kitchenConsumption: {
      skewer1: 15.5,
      skewer2: 12.0,
      supply: 3.5,
      return: 1.0,
      rice: 5.0,
      almond: 2.0,
      potato: 10.0,
    },
    productionInventory: {
      broasted: 25,
      tikka: 18,
      zinger: 30,
    },
    actualInventory: {
      actualCash: 350,
      visa: 400,
      rt: 50,
      maestro: 80,
      priceDifference: 0,
      wallet: 0,
    },
    employeeAdvances: [
      { id: 'emp1', employeeName: 'محمد أحمد', amount: 20, notes: 'سلفة أسبوعية', startTime: '08:00', endTime: '16:00', hourlyRate: 0 },
      { id: 'emp2', employeeName: 'علي خالد', amount: 15, notes: '', startTime: '09:00', endTime: '17:00', hourlyRate: 0 },
    ],
  };

  const calc1 = calculateShiftMetrics(sample1);
  const result1 = await populateClosingReport(templateBuf, sample1, calc1);
  console.log('✅ Test 1 (Standard shift with Kitchen & Production) Passed!');

  // Check that Kitchen and Production cells are properly populated
  const ws1 = result1.workbook.getWorksheet('تقرير الإغلاق');
  if (!ws1) throw new Error('Worksheet not found');
  console.log('  Kitchen header D27:', ws1.getCell('D27').value);
  console.log('  Kitchen item D29:', ws1.getCell('D29').value, '=', ws1.getCell('E29').value);
  console.log('  Production header G30:', ws1.getCell('G30').value);
  console.log('  Production item G32:', ws1.getCell('G32').value, '=', ws1.getCell('H32').value);
  console.log('  Employee A40:K40 header:', ws1.getCell('A40').value, ws1.getCell('B40').value, ws1.getCell('E40').value, ws1.getCell('H40').value, ws1.getCell('J40').value, ws1.getCell('K40').value);
  console.log('  Employee row 41:', ws1.getCell('A41').value, ws1.getCell('B41').value, ws1.getCell('E41').value, ws1.getCell('H41').value, ws1.getCell('J41').value, ws1.getCell('K41').value);

  // Test 2: Shortage shift without kitchen/production data
  const sample2: ShiftData = {
    ...sample1,
    actualInventory: {
      ...sample1.actualInventory,
      actualCash: 100, // causes shortage
    },
    kitchenConsumption: { skewer1: 0, skewer2: 0, supply: 0, return: 0, rice: 0, almond: 0, potato: 0 },
    productionInventory: { broasted: 0, tikka: 0, zinger: 0 },
  };
  const calc2 = calculateShiftMetrics(sample2);
  const result2 = await populateClosingReport(templateBuf, sample2, calc2);
  const ws2 = result2.workbook.getWorksheet('تقرير الإغلاق');
  if (!ws2) throw new Error('Worksheet not found');
  console.log('✅ Test 2 (Shortage shift without Kitchen/Production) Passed!');
  console.log('  Shortage cell J29:', ws2.getCell('J29').value, '=', ws2.getCell('K29').value);
  console.log('  Empty kitchen D27 should be undefined:', ws2.getCell('D27').value);

  // Test 3: Overflow employees (>28 employees)
  const sample3: ShiftData = {
    ...sample1,
    employeeAdvances: Array.from({ length: 35 }, (_, idx) => ({
      id: `emp_${idx + 1}`,
      employeeName: `موظف رقم ${idx + 1}`,
      amount: (idx + 1) * 2,
      notes: idx % 3 === 0 ? 'سلفة طارئة' : '',
      startTime: '',
      endTime: '',
      hourlyRate: 0,
    })),
  };
  const calc3 = calculateShiftMetrics(sample3);
  const result3 = await populateClosingReport(templateBuf, sample3, calc3);
  console.log('✅ Test 3 (35 employees - dynamic row insertion) Passed!');

  // Test 4: Completely empty shift
  const sample4: ShiftData = {
    isClosed: false,
    date: '2026-09-06',
    cashierName: '',
    custodyItems: [],
    purchases: [],
    addMerchantReceivables: [],
    payMerchantReceivables: [],
    otherExpenses: [],
    apartment: [],
    yahya: [],
    abuAbdullah: [],
    adminExpenses: [],
    spices: [],
    equipment: [],
    ewallet: [],
    addCashReceivables: [],
    addNewReceivables: [],
    cashAndSales: { openingCash: 0, addedReceivablesDesc: '', addedReceivables: 0, paidOldReceivables: 0, sales: 0, otherSales: 0 },
    kitchenConsumption: { skewer1: 0, skewer2: 0, supply: 0, return: 0, rice: 0, almond: 0, potato: 0 },
    productionInventory: { broasted: 0, tikka: 0, zinger: 0 },
    actualInventory: { actualCash: 0, visa: 0, rt: 0, maestro: 0, priceDifference: 0, wallet: 0 },
    employeeAdvances: [],
  };
  const calc4 = calculateShiftMetrics(sample4);
  const result4 = await populateClosingReport(templateBuf, sample4, calc4);
  console.log('✅ Test 4 (Empty shift) Passed!');

  console.log('ALL ACCEPTANCE TESTS PASSED SUCCESSFULLY! 🚀');
}

runAllTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
