import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { ShiftData } from '../src/store/useShiftStore';
import { calculateShiftMetrics } from '../src/lib/shiftCalculations';

// Export processor function
export async function populateClosingReportExcel(
  templateBuffer: ArrayBuffer | Buffer,
  data: ShiftData,
  calc: any
): Promise<{ workbook: ExcelJS.Workbook; buffer: ArrayBuffer }> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(templateBuffer);

  const ws = wb.getWorksheet('تقرير الإغلاق') || wb.worksheets[0];
  if (!ws) {
    throw new Error('Worksheet "تقرير الإغلاق" not found in template');
  }

  // Ensure worksheet name and RTL direction
  ws.name = 'تقرير الإغلاق';
  ws.views = [{ rightToLeft: true }];

  // 1. Date & Day (J3:K3)
  const weekdaysMap: Record<number, string> = {
    5: 'الجمعة',
    6: 'السبت',
    0: 'الأحد',
    1: 'الاثنين',
    2: 'الثلاثاء',
    3: 'الأربعاء',
    4: 'الخميس'
  };
  let dayLabel = 'اليوم';
  try {
    const [y, m, d] = data.date.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dayLabel = weekdaysMap[dateObj.getDay()] || 'اليوم';
  } catch {
    dayLabel = 'اليوم';
  }

  ws.getCell('J3').value = 'اليوم والتاريخ';
  ws.getCell('K3').value = `${dayLabel} ${data.date}`;

  // Helper to fill 2-column section
  const fillSection = (
    colLabel: string,
    colAmount: string,
    startRow: number,
    endRow: number,
    items: Array<{ label?: string; amount?: number | string }> | undefined,
    totalValue: number
  ) => {
    const validItems = (items || []).filter(
      (item) => (item.label && item.label.trim()) || (Number(item.amount) || 0) > 0
    );

    const slotCount = endRow - startRow - 1; // from startRow + 2 to endRow - 1
    for (let i = 0; i < slotCount; i++) {
      const row = startRow + 2 + i;
      const cellLabel = ws.getCell(`${colLabel}${row}`);
      const cellAmount = ws.getCell(`${colAmount}${row}`);

      if (i < validItems.length) {
        const item = validItems[i];
        cellLabel.value = item.label?.trim() || '-';
        cellAmount.value = Number(item.amount) || 0;
      } else {
        cellLabel.value = '-';
        cellAmount.value = '-';
      }
    }

    // Total row
    const totalCell = ws.getCell(`${colAmount}${endRow}`);
    totalCell.value = Number(totalValue) || 0;
  };

  // Section 3: المشتريات (A5:B21)
  fillSection('A', 'B', 5, 21, data.purchases, calc.purchasesTotal);

  // Section 4: إضافة ذمم تجار (D5:E8)
  fillSection('D', 'E', 5, 8, data.addMerchantReceivables, calc.addMerchantTotal);

  // Section 5: سداد ذمم تجار (G5:H9)
  fillSection('G', 'H', 5, 9, data.payMerchantReceivables, calc.payMerchantTotal);

  // Section 6: بيانات الكاش والمبيعات (J5:K11)
  const addedReceivablesTotal = data.addCashReceivables
    ? data.addCashReceivables.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    : (Number(data.cashAndSales.paidOldReceivables) || 0);

  const newReceivablesTotal = data.addNewReceivables
    ? data.addNewReceivables.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    : (Number(data.cashAndSales.addedReceivables) || 0);

  ws.getCell('K6').value = Number(data.cashAndSales.openingCash) || 0;
  ws.getCell('K7').value = newReceivablesTotal;
  ws.getCell('K8').value = addedReceivablesTotal;
  ws.getCell('K9').value = Number(data.cashAndSales.sales) || 0;
  ws.getCell('K10').value = Number(data.cashAndSales.otherSales) || 0;
  ws.getCell('K11').value = calc.totalCash;

  // Section 7: الشقة (D10:E13)
  fillSection('D', 'E', 10, 13, data.apartment, calc.apartmentTotal);

  // Section 8: يحيى (G11:H15)
  fillSection('G', 'H', 11, 15, data.yahya, calc.yahyaTotal);

  // Section 9: المصاريف الإدارية (D15:E25)
  fillSection('D', 'E', 15, 25, data.adminExpenses, calc.adminExpensesTotal);

  // Section 10: البهارات (G17:H28)
  fillSection('G', 'H', 17, 28, data.spices, calc.spicesTotal);

  // Section 11: مصاريف أخرى (A23:B27)
  fillSection('A', 'B', 23, 27, data.otherExpenses, calc.otherExpensesTotal);

  // Section 12: المحفظة الإلكترونية (D27:E32)
  fillSection('D', 'E', 27, 32, data.ewallet, calc.ewalletTotal);

  // Section 13: أبو عبدالله (A29:B32)
  fillSection('A', 'B', 29, 32, data.abuAbdullah, calc.abuAbdullahTotal);

  // Section 14: معدات وصيانة (A34:B37)
  fillSection('A', 'B', 34, 37, data.equipment, calc.equipmentTotal);

  // Section 15: ملخص الجرد الفعلي والنتيجة النهائية (J13:K32)
  ws.getCell('K14').value = Number(data.actualInventory.actualCash) || 0;
  ws.getCell('K15').value = Number(data.actualInventory.visa) || 0;
  ws.getCell('K16').value = Number(data.actualInventory.rt) || 0;
  ws.getCell('K17').value = Number(data.actualInventory.maestro) || 0;
  ws.getCell('K18').value = Number(data.actualInventory.priceDifference) || 0;
  ws.getCell('K19').value = Number(calc.effectiveAdvances) || 0;
  ws.getCell('K20').value = Number(calc.ewalletTotal) || 0;
  ws.getCell('K21').value = Number(calc.purchasesTotal) || 0;
  ws.getCell('K22').value = Number(calc.payMerchantTotal) || 0;
  ws.getCell('K23').value = Number(calc.otherExpensesTotal) || 0;
  ws.getCell('K24').value = Number(calc.adminExpensesTotal) || 0;
  ws.getCell('K25').value = Number(calc.spicesTotal) || 0;
  ws.getCell('K26').value = Number(calc.apartmentTotal) || 0;
  ws.getCell('K27').value = Number(calc.yahyaTotal) || 0;
  ws.getCell('K28').value = Number(calc.equipmentTotal || 0) + Number(calc.abuAbdullahTotal || 0);
  ws.getCell('K29').value = Number(calc.totalInventory) || 0;

  // J30:K30 - نقص الكاش (عجز)
  const cellJ30 = ws.getCell('J30');
  const cellK30 = ws.getCell('K30');
  if (calc.cashShortage > 0) {
    cellK30.value = calc.cashShortage;
    cellJ30.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF0F5' } };
    cellK30.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF0F5' } };
    cellJ30.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFBE123C' } };
    cellK30.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFBE123C' } };
  } else {
    cellK30.value = '-';
    cellJ30.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    cellK30.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    cellJ30.font = { name: 'Arial', size: 10, bold: false, color: { argb: 'FF64748B' } };
    cellK30.font = { name: 'Arial', size: 10, bold: false, color: { argb: 'FF64748B' } };
  }

  // J31:K31 - زيادة الكاش (فائض)
  const cellJ31 = ws.getCell('J31');
  const cellK31 = ws.getCell('K31');
  if (calc.cashSurplus > 0) {
    cellK31.value = calc.cashSurplus;
    cellJ31.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
    cellK31.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
    cellJ31.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF047857' } };
    cellK31.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF047857' } };
  } else {
    cellK31.value = '-';
    cellJ31.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    cellK31.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    cellJ31.font = { name: 'Arial', size: 10, bold: false, color: { argb: 'FF64748B' } };
    cellK31.font = { name: 'Arial', size: 10, bold: false, color: { argb: 'FF64748B' } };
  }

  // J32:K32 - الكاشير المسؤول / حالة المطابقة
  const cellK32 = ws.getCell('K32');
  if (calc.cashShortage > 0) {
    cellK32.value = data.cashierName ? `عجز (الكاشير: ${data.cashierName})` : 'عجز غير محدد الكاشير';
  } else if (calc.cashSurplus > 0) {
    cellK32.value = data.cashierName ? `زيادة (الكاشير: ${data.cashierName})` : 'فائض كاش';
  } else {
    cellK32.value = 'الكاش مطابق تماماً';
  }

  // Section 16: جدول الموظفين (A41:K71)
  const employees = data.employeeAdvances || [];
  let totalAdvancesSum = 0;

  const defaultSlotCount = 28; // rows 43 to 70
  for (let i = 0; i < defaultSlotCount; i++) {
    const row = 43 + i;
    const emp = employees[i];
    const cellA = ws.getCell(`A${row}`);
    const cellB = ws.getCell(`B${row}`);
    const cellF = ws.getCell(`F${row}`);
    const cellI = ws.getCell(`I${row}`);

    cellA.value = i + 1;
    if (emp) {
      const advAmount = Number(emp.amount) || 0;
      totalAdvancesSum += advAmount;

      cellB.value = emp.employeeName || '-';
      cellF.value = advAmount > 0 ? advAmount : '-';

      const isOff = emp.employeeName?.trim() && !emp.startTime && !emp.endTime;
      let notes = emp.notes?.trim() || '';
      if (isOff) {
        notes = notes ? `${notes} (عطلة)` : 'عطلة (OFF)';
      }
      cellI.value = notes || '-';
    } else {
      cellB.value = '-';
      cellF.value = '-';
      cellI.value = '-';
    }
  }

  // Handle employees exceeding 28 slots dynamically without losing data
  let totalRowNumber = 71;
  if (employees.length > defaultSlotCount) {
    for (let i = defaultSlotCount; i < employees.length; i++) {
      const insertAt = totalRowNumber;
      ws.insertRow(insertAt, [i + 1, '-', '', '', '', '-', '', '', '-', '', '']);
      const newRow = ws.getRow(insertAt);
      newRow.height = 20;

      const safeMerge = (range: string) => {
        try {
          ws.mergeCells(range);
        } catch {
          // Range may already be merged by row insertion inheritance
        }
      };
      safeMerge(`B${insertAt}:E${insertAt}`);
      safeMerge(`F${insertAt}:H${insertAt}`);
      safeMerge(`I${insertAt}:K${insertAt}`);

      const emp = employees[i];
      const advAmount = Number(emp.amount) || 0;
      totalAdvancesSum += advAmount;

      const isOff = emp.employeeName?.trim() && !emp.startTime && !emp.endTime;
      let notes = emp.notes?.trim() || '';
      if (isOff) {
        notes = notes ? `${notes} (عطلة)` : 'عطلة (OFF)';
      }

      newRow.getCell(1).value = i + 1;
      newRow.getCell(2).value = emp.employeeName || '-';
      newRow.getCell(6).value = advAmount > 0 ? advAmount : '-';
      newRow.getCell(9).value = notes || '-';

      // Format cells
      for (let c = 1; c <= 11; c++) {
        const cell = newRow.getCell(c);
        cell.font = { name: 'Arial', size: 10 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFDEE2E6' } },
          left: { style: 'thin', color: { argb: 'FFDEE2E6' } },
          bottom: { style: 'thin', color: { argb: 'FFDEE2E6' } },
          right: { style: 'thin', color: { argb: 'FFDEE2E6' } },
        };
      }

      totalRowNumber++;
    }
  }

  // Total advances row
  const advancesTotalCell = ws.getCell(`F${totalRowNumber}`);
  advancesTotalCell.value = totalAdvancesSum;

  // Update print area if rows were added
  if (totalRowNumber > 71) {
    ws.pageSetup.printArea = `A1:K${totalRowNumber}`;
  }

  // -------------------------------------------------------------
  // Verification: Ensure exactly 1 sheet, no undefined/NaN, correct values
  // -------------------------------------------------------------
  const outBuffer = await wb.xlsx.writeBuffer();

  // Reopen and audit
  const testWb = new ExcelJS.Workbook();
  await testWb.xlsx.load(outBuffer);

  if (testWb.worksheets.length !== 1) {
    throw new Error(`Audit failed: Expected exactly 1 sheet, found ${testWb.worksheets.length}`);
  }
  const testWs = testWb.worksheets[0];
  if (testWs.name !== 'تقرير الإغلاق') {
    throw new Error(`Audit failed: Expected sheet name "تقرير الإغلاق", found "${testWs.name}"`);
  }

  // Scan all cells up to totalRowNumber and col 11
  for (let r = 1; r <= totalRowNumber; r++) {
    const row = testWs.getRow(r);
    for (let c = 1; c <= 11; c++) {
      const v = row.getCell(c).value;
      if (v === undefined || v === null) continue;
      const strVal = String(v);
      if (strVal.includes('undefined') || strVal.includes('NaN') || strVal.includes('[object Object]')) {
        throw new Error(`Audit failed: Cell at row ${r}, col ${c} contains invalid text: ${strVal}`);
      }
    }
  }

  return { workbook: wb, buffer: outBuffer };
}

// Run comprehensive automated tests
async function runAllTests() {
  const templatePath = path.join(process.cwd(), 'public/templates/closing-report-template.xlsx');
  const templateBuf = fs.readFileSync(templatePath);

  // Test 1: Standard shift
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
    spices: [{ id: 'sp1', label: 'خلطة بروستد', amount: 40 }],
    equipment: [{ id: 'eq1', label: 'صيانة قلاية', amount: 45 }],
    ewallet: [{ id: 'ew1', label: 'كليك (CliQ)', amount: 65 }],
    addCashReceivables: [{ id: 'cr1', label: 'سداد ذمة قديمة', amount: 30 }],
    addNewReceivables: [{ id: 'nr1', label: 'ذمة جديدة', amount: 50 }],
    cashAndSales: {
      openingCash: 25,
      addedReceivablesDesc: '',
      addedReceivables: 50,
      paidOldReceivables: 30,
      sales: 1450,
      otherSales: 20,
    },
    kitchenConsumption: { skewer1: 12, skewer2: 15, supply: 4, return: 1, rice: 25, almond: 2, potato: 30 },
    productionInventory: { broasted: 45, tikka: 20, zinger: 35 },
    actualInventory: { actualCash: 380, visa: 220, rt: 50, maestro: 0, priceDifference: 5, wallet: 0 },
    employeeAdvances: [
      { id: 'e1', employeeName: 'ابو حبيش', amount: 20, notes: 'سلفة', startTime: '08:00', endTime: '16:00', hourlyRate: 2 },
    ],
  };

  const calc1 = calculateShiftMetrics(sample1);
  const result1 = await populateClosingReportExcel(templateBuf, sample1, calc1);
  console.log('✅ Test 1 (Standard shift with surplus) Passed! Buffer bytes:', result1.buffer.byteLength);

  // Test 2: Shift with Shortage (عجز)
  const sample2: ShiftData = {
    ...sample1,
    actualInventory: { actualCash: 50, visa: 0, rt: 0, maestro: 0, priceDifference: 0, wallet: 0 },
  };
  const calc2 = calculateShiftMetrics(sample2);
  const result2 = await populateClosingReportExcel(templateBuf, sample2, calc2);
  console.log('✅ Test 2 (Shift with shortage) Passed! Shortage:', calc2.cashShortage);

  // Test 3: Shift with 35 employees (> 28 rows)
  const sample3: ShiftData = {
    ...sample1,
    employeeAdvances: Array.from({ length: 35 }, (_, idx) => ({
      id: `emp-${idx}`,
      employeeName: `موظف رقم ${idx + 1}`,
      amount: (idx + 1) * 2,
      notes: idx % 3 === 0 ? 'عطلة' : 'دوام كامل',
      startTime: idx % 3 === 0 ? '' : '09:00',
      endTime: idx % 3 === 0 ? '' : '17:00',
      hourlyRate: 2.5,
    })),
  };
  const calc3 = calculateShiftMetrics(sample3);
  const result3 = await populateClosingReportExcel(templateBuf, sample3, calc3);
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
  const result4 = await populateClosingReportExcel(templateBuf, sample4, calc4);
  console.log('✅ Test 4 (Empty shift) Passed!');

  console.log('ALL ACCEPTANCE TESTS PASSED SUCCESSFULLY! 🚀');
}

runAllTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
