import ExcelJS from 'exceljs';
import { ShiftData } from '../store/useShiftStore';
import { getDayLabel } from './exportUtils';

export const TEMPLATE_PATH = '/templates/closing-report-template.xlsx';

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFDEE2E6' } },
  left: { style: 'thin', color: { argb: 'FFDEE2E6' } },
  bottom: { style: 'thin', color: { argb: 'FFDEE2E6' } },
  right: { style: 'thin', color: { argb: 'FFDEE2E6' } },
};

/**
 * Creates the base template programmatically if the file cannot be fetched.
 */
export async function createBaseClosingReportWorkbook(): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Eng. Qusai Albdour';
  wb.lastModifiedBy = 'Eng. Qusai Albdour';
  wb.company = 'مطعم يحيى البيك - إعداد وتطوير: Eng. Qusai Albdour';
  wb.created = new Date();

  const ws = wb.addWorksheet('تقرير الإغلاق', {
    views: [{ rightToLeft: true }],
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'portrait',
      fitToWidth: 1,
      fitToHeight: 1,
      showGridLines: false,
      margins: {
        left: 0.3,
        right: 0.3,
        top: 0.4,
        bottom: 0.4,
        header: 0.2,
        footer: 0.2,
      },
      printArea: 'A1:K71',
    },
  });

  const colWidths = [24, 12, 3, 24, 12, 3, 24, 12, 3, 26, 14];
  colWidths.forEach((w, idx) => {
    ws.getColumn(idx + 1).width = w;
  });

  const formatCell = (
    cellRef: string,
    opts: {
      value?: any;
      font?: Partial<ExcelJS.Font>;
      fill?: ExcelJS.Fill;
      alignment?: Partial<ExcelJS.Alignment>;
      border?: Partial<ExcelJS.Borders>;
      numFmt?: string;
    }
  ) => {
    const cell = ws.getCell(cellRef);
    if (opts.value !== undefined) cell.value = opts.value;
    cell.font = {
      name: 'Arial',
      size: 10,
      color: { argb: 'FF0F172A' },
      ...opts.font,
    };
    if (opts.fill) cell.fill = opts.fill;
    cell.alignment = {
      vertical: 'middle',
      ...opts.alignment,
    };
    cell.border = opts.border || THIN_BORDER;
    if (opts.numFmt) cell.numFmt = opts.numFmt;
    return cell;
  };

  for (let r = 1; r <= 71; r++) {
    ws.getRow(r).height = 20;
  }
  ws.getRow(1).height = 36;
  ws.getRow(2).height = 10;
  ws.getRow(3).height = 22;
  ws.getRow(4).height = 10;
  ws.getRow(41).height = 28;
  ws.getRow(42).height = 22;
  ws.getRow(71).height = 24;

  // Title A1:K1
  ws.mergeCells('A1:K1');
  formatCell('A1', {
    value: 'مطعم يحيى البيك - تقرير إغلاق الكاش اليومي الشامل',
    font: { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  });

  // Date J3:K3
  formatCell('J3', {
    value: 'اليوم والتاريخ',
    font: { bold: true, size: 10 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } },
    alignment: { horizontal: 'center' },
  });
  formatCell('K3', {
    value: '-',
    font: { bold: true, size: 10 },
    alignment: { horizontal: 'center' },
  });

  const buildSection = (
    colLabel: string,
    colAmount: string,
    startRow: number,
    endRow: number,
    title: string
  ) => {
    ws.mergeCells(`${colLabel}${startRow}:${colAmount}${startRow}`);
    formatCell(`${colLabel}${startRow}`, {
      value: title,
      font: { bold: true, size: 10.5, color: { argb: 'FF1E3A5F' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } },
      alignment: { horizontal: 'center' },
    });
    formatCell(`${colAmount}${startRow}`, {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } },
    });

    formatCell(`${colLabel}${startRow + 1}`, {
      value: 'البيان',
      font: { bold: true, size: 10 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } },
      alignment: { horizontal: 'center' },
    });
    formatCell(`${colAmount}${startRow + 1}`, {
      value: 'المبلغ',
      font: { bold: true, size: 10 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } },
      alignment: { horizontal: 'center' },
    });

    for (let r = startRow + 2; r < endRow; r++) {
      formatCell(`${colLabel}${r}`, {
        value: '-',
        alignment: { horizontal: 'right', indent: 1 },
      });
      formatCell(`${colAmount}${r}`, {
        value: '-',
        alignment: { horizontal: 'center' },
        numFmt: '#,##0.00',
      });
    }

    formatCell(`${colLabel}${endRow}`, {
      value: `إجمالي ${title}`,
      font: { bold: true, size: 10.5 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } },
      alignment: { horizontal: 'right', indent: 1 },
    });
    formatCell(`${colAmount}${endRow}`, {
      value: 0,
      font: { bold: true, size: 10.5 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } },
      alignment: { horizontal: 'center' },
      numFmt: '#,##0.00',
    });
  };

  buildSection('A', 'B', 5, 21, 'المشتريات');
  buildSection('D', 'E', 5, 8, 'إضافة ذمم تجار');
  buildSection('G', 'H', 5, 9, 'سداد ذمم تجار');
  buildSection('D', 'E', 10, 13, 'الشقة');
  buildSection('G', 'H', 11, 15, 'يحيى');
  buildSection('D', 'E', 15, 25, 'المصاريف الإدارية');
  buildSection('G', 'H', 17, 28, 'البهارات');
  buildSection('A', 'B', 23, 27, 'مصاريف أخرى');
  buildSection('D', 'E', 27, 32, 'المحفظة الإلكترونية');
  buildSection('A', 'B', 29, 32, 'أبو عبدالله');
  buildSection('A', 'B', 34, 37, 'معدات وصيانة');

  // Cash and Sales (J5:K11)
  ws.mergeCells('J5:K5');
  formatCell('J5', {
    value: 'بيانات الكاش والمبيعات',
    font: { bold: true, size: 10.5, color: { argb: 'FF1E3A5F' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } },
    alignment: { horizontal: 'center' },
  });
  formatCell('K5', {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } },
  });

  const cashRows = [
    { row: 6, label: 'النقد الافتتاحي' },
    { row: 7, label: 'إضافة ذمم' },
    { row: 8, label: 'تسديد ذمم قديمة' },
    { row: 9, label: 'مبيعات' },
    { row: 10, label: 'مبيعات أخرى' },
  ];
  cashRows.forEach((item) => {
    formatCell(`J${item.row}`, {
      value: item.label,
      alignment: { horizontal: 'right', indent: 1 },
    });
    formatCell(`K${item.row}`, {
      value: 0,
      alignment: { horizontal: 'center' },
      numFmt: '#,##0.00',
    });
  });

  formatCell('J11', {
    value: 'مجموع الكاش',
    font: { bold: true, size: 10.5 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } },
    alignment: { horizontal: 'right', indent: 1 },
  });
  formatCell('K11', {
    value: 0,
    font: { bold: true, size: 10.5 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } },
    alignment: { horizontal: 'center' },
    numFmt: '#,##0.00',
  });

  // Summary Inventory (J13:K32)
  ws.mergeCells('J13:K13');
  formatCell('J13', {
    value: 'ملخص الجرد الفعلي والنتيجة النهائية',
    font: { bold: true, size: 10.5, color: { argb: 'FF1E3A5F' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } },
    alignment: { horizontal: 'center' },
  });
  formatCell('K13', {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } },
  });

  const invRows = [
    { row: 14, label: 'نقد الكاش الفعلي' },
    { row: 15, label: 'فيزا' },
    { row: 16, label: 'RT' },
    { row: 17, label: 'مايسترو' },
    { row: 18, label: 'فرق السعر' },
    { row: 19, label: 'السلف' },
    { row: 20, label: 'المحفظة' },
    { row: 21, label: 'مشتريات' },
    { row: 22, label: 'سداد ذمم تجار' },
    { row: 23, label: 'المصاريف الأخرى' },
    { row: 24, label: 'المصاريف الإدارية' },
    { row: 25, label: 'البهارات' },
    { row: 26, label: 'الشقة' },
    { row: 27, label: 'يحيى' },
    { row: 28, label: 'معدات وصيانة وأبو عبدالله' },
  ];
  invRows.forEach((item) => {
    formatCell(`J${item.row}`, {
      value: item.label,
      alignment: { horizontal: 'right', indent: 1 },
    });
    formatCell(`K${item.row}`, {
      value: 0,
      alignment: { horizontal: 'center' },
      numFmt: '#,##0.00',
    });
  });

  formatCell('J29', {
    value: 'مجموع الجرد',
    font: { bold: true, size: 10.5 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } },
    alignment: { horizontal: 'right', indent: 1 },
  });
  formatCell('K29', {
    value: 0,
    font: { bold: true, size: 10.5 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } },
    alignment: { horizontal: 'center' },
    numFmt: '#,##0.00',
  });

  formatCell('J30', {
    value: 'نقص الكاش (عجز)',
    font: { bold: true, size: 10 },
    alignment: { horizontal: 'right', indent: 1 },
  });
  formatCell('K30', {
    value: '-',
    font: { bold: true, size: 10 },
    alignment: { horizontal: 'center' },
    numFmt: '#,##0.00',
  });

  formatCell('J31', {
    value: 'زيادة الكاش (فائض)',
    font: { bold: true, size: 10 },
    alignment: { horizontal: 'right', indent: 1 },
  });
  formatCell('K31', {
    value: '-',
    font: { bold: true, size: 10 },
    alignment: { horizontal: 'center' },
    numFmt: '#,##0.00',
  });

  formatCell('J32', {
    value: 'الكاشير المسؤول / الحالة',
    font: { bold: true, size: 10 },
    alignment: { horizontal: 'right', indent: 1 },
  });
  formatCell('K32', {
    value: 'مطابق تماماً',
    font: { bold: true, size: 10 },
    alignment: { horizontal: 'center' },
  });

  // Employee Advances (A41:K71)
  ws.mergeCells('A41:K41');
  formatCell('A41', {
    value: 'سجل سلف الموظفين اليومية',
    font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } },
    alignment: { horizontal: 'center' },
  });

  formatCell('A42', {
    value: 'رقم الموظف',
    font: { bold: true, size: 10 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } },
    alignment: { horizontal: 'center' },
  });

  ws.mergeCells('B42:E42');
  formatCell('B42', {
    value: 'اسم الموظف',
    font: { bold: true, size: 10 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } },
    alignment: { horizontal: 'center' },
  });
  ['C42', 'D42', 'E42'].forEach((c) => {
    formatCell(c, { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } } });
  });

  ws.mergeCells('F42:H42');
  formatCell('F42', {
    value: 'قيمة السلفة',
    font: { bold: true, size: 10 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } },
    alignment: { horizontal: 'center' },
  });
  ['G42', 'H42'].forEach((c) => {
    formatCell(c, { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } } });
  });

  ws.mergeCells('I42:K42');
  formatCell('I42', {
    value: 'التوقيع أو الملاحظات',
    font: { bold: true, size: 10 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } },
    alignment: { horizontal: 'center' },
  });
  ['J42', 'K42'].forEach((c) => {
    formatCell(c, { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } } });
  });

  for (let r = 43; r <= 70; r++) {
    const empIdx = r - 42;
    formatCell(`A${r}`, {
      value: empIdx,
      alignment: { horizontal: 'center' },
    });

    ws.mergeCells(`B${r}:E${r}`);
    formatCell(`B${r}`, {
      value: '-',
      alignment: { horizontal: 'right', indent: 1 },
    });

    ws.mergeCells(`F${r}:H${r}`);
    formatCell(`F${r}`, {
      value: '-',
      alignment: { horizontal: 'center' },
      numFmt: '#,##0.00',
    });

    ws.mergeCells(`I${r}:K${r}`);
    formatCell(`I${r}`, {
      value: '-',
      alignment: { horizontal: 'right', indent: 1 },
    });
  }

  ws.mergeCells('A71:E71');
  formatCell('A71', {
    value: 'إجمالي السلف',
    font: { bold: true, size: 10.5 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } },
    alignment: { horizontal: 'right', indent: 1 },
  });

  ws.mergeCells('F71:H71');
  formatCell('F71', {
    value: 0,
    font: { bold: true, size: 10.5 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } },
    alignment: { horizontal: 'center' },
    numFmt: '#,##0.00',
  });

  ws.mergeCells('I71:K71');
  formatCell('I71', {
    value: 'دينار أردني',
    font: { bold: true, size: 10 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } },
    alignment: { horizontal: 'center' },
  });

  return wb;
}

/**
 * Loads the Excel template from public/templates/closing-report-template.xlsx
 * or falls back gracefully to generating the exact buffer.
 */
export async function loadClosingReportTemplateBuffer(): Promise<ArrayBuffer> {
  if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
    try {
      const response = await fetch(TEMPLATE_PATH);
      if (response.ok) {
        return await response.arrayBuffer();
      }
    } catch (e) {
      console.warn('Could not fetch template file, using programmatic fallback', e);
    }
  }

  // Programmatic fallback
  const wb = await createBaseClosingReportWorkbook();
  const buffer = await wb.xlsx.writeBuffer();
  return buffer;
}

/**
 * Populates the loaded Excel template with ShiftData and calculated metrics.
 */
export async function populateClosingReport(
  templateBuffer: ArrayBuffer,
  data: ShiftData,
  calc: any
): Promise<{ workbook: ExcelJS.Workbook; buffer: ArrayBuffer }> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(templateBuffer);
  wb.creator = 'Eng. Qusai Albdour';
  wb.lastModifiedBy = 'Eng. Qusai Albdour';
  wb.company = 'مطعم يحيى البيك - إعداد وتطوير: Eng. Qusai Albdour';

  const ws = wb.getWorksheet('تقرير الإغلاق') || wb.worksheets[0];
  if (!ws) {
    throw new Error('Worksheet "تقرير الإغلاق" not found in template');
  }

  // Guarantee single worksheet, correct name, and RTL direction
  ws.name = 'تقرير الإغلاق';
  ws.views = [{ rightToLeft: true }];
  if (ws.headerFooter) {
    ws.headerFooter.oddFooter = "&Rمطعم يحيى البيك - تقرير إغلاق الكاش &Cإعداد وتطوير: Eng. Qusai Albdour &Lصفحة &P من &N";
  }

  // 1. Date & Day (J3:K3)
  const dayLabel = getDayLabel(data.date);
  ws.getCell('J3').value = 'اليوم والتاريخ';
  ws.getCell('K3').value = `${dayLabel} ${data.date}`;

  // Helper to fill a 2-column section
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

    const slotCount = endRow - startRow - 1;
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
  ws.getCell('K11').value = Number(calc.totalCash) || 0;

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

  const defaultSlotCount = 28;
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

  // Dynamically append rows if employees exceed 28 slots without losing data
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
          // Range may be pre-merged by row insertion
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

      for (let c = 1; c <= 11; c++) {
        const cell = newRow.getCell(c);
        cell.font = { name: 'Arial', size: 10 };
        cell.border = THIN_BORDER;
      }

      totalRowNumber++;
    }
  }

  // Total advances row
  const advancesTotalCell = ws.getCell(`F${totalRowNumber}`);
  advancesTotalCell.value = totalAdvancesSum;

  if (totalRowNumber > 71) {
    ws.pageSetup.printArea = `A1:K${totalRowNumber}`;
  }

  // Post-audit & verification
  const outBuffer = await wb.xlsx.writeBuffer();

  const auditWb = new ExcelJS.Workbook();
  await auditWb.xlsx.load(outBuffer);

  if (auditWb.worksheets.length !== 1) {
    throw new Error(`Audit error: Workbook contains ${auditWb.worksheets.length} sheets, expected exactly 1.`);
  }

  const auditWs = auditWb.worksheets[0];
  if (auditWs.name !== 'تقرير الإغلاق') {
    throw new Error(`Audit error: Worksheet name is "${auditWs.name}", expected "تقرير الإغلاق".`);
  }

  // Audit for invalid cell values
  for (let r = 1; r <= totalRowNumber; r++) {
    const row = auditWs.getRow(r);
    for (let c = 1; c <= 11; c++) {
      const v = row.getCell(c).value;
      if (v === undefined || v === null) continue;
      const strVal = String(v);
      if (strVal.includes('undefined') || strVal.includes('NaN') || strVal.includes('[object Object]')) {
        throw new Error(`Audit error: Cell (${r}, ${c}) contains invalid value: "${strVal}"`);
      }
    }
  }

  return { workbook: wb, buffer: outBuffer };
}
