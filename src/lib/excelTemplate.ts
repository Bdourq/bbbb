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
        top: 0.3,
        bottom: 0.3,
        header: 0.2,
        footer: 0.2,
      },
      printArea: 'A1:K69',
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

  for (let r = 1; r <= 69; r++) {
    ws.getRow(r).height = 19;
  }
  ws.getRow(1).height = 34;
  ws.getRow(2).height = 8;
  ws.getRow(3).height = 22;
  ws.getRow(4).height = 8;
  ws.getRow(38).height = 10;
  ws.getRow(39).height = 26;
  ws.getRow(40).height = 20;
  ws.getRow(69).height = 22;

  // Title A1:K1 - Red brand FFC8102E
  ws.mergeCells('A1:K1');
  formatCell('A1', {
    value: 'مطعم يحيى البيك - تقرير إغلاق الكاش اليومي الشامل',
    font: { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8102E' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  });

  // Date J3:K3 - Subheader light red FFFBEAEA
  formatCell('J3', {
    value: 'اليوم والتاريخ',
    font: { bold: true, size: 10 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEAEA' } },
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
    // Title row - Red FFC8102E
    ws.mergeCells(`${colLabel}${startRow}:${colAmount}${startRow}`);
    formatCell(`${colLabel}${startRow}`, {
      value: title,
      font: { bold: true, size: 10.5, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8102E' } },
      alignment: { horizontal: 'center' },
    });
    formatCell(`${colAmount}${startRow}`, {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8102E' } },
    });

    // Subheader - Light red FFFBEAEA
    formatCell(`${colLabel}${startRow + 1}`, {
      value: 'البيان',
      font: { bold: true, size: 10 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEAEA' } },
      alignment: { horizontal: 'center' },
    });
    formatCell(`${colAmount}${startRow + 1}`, {
      value: 'المبلغ',
      font: { bold: true, size: 10 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEAEA' } },
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

    // Total row - Semantic light green FFE2EFDA
    formatCell(`${colLabel}${endRow}`, {
      value: `إجمالي ${title}`,
      font: { bold: true, size: 10.5 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } },
      alignment: { horizontal: 'right', indent: 1 },
    });
    formatCell(`${colAmount}${endRow}`, {
      value: 0,
      font: { bold: true, size: 10.5 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } },
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
  buildSection('A', 'B', 29, 32, 'أبو عبدالله');
  buildSection('A', 'B', 34, 37, 'معدات وصيانة');

  // Cash and Sales (J5:K11) - Red FFC8102E
  ws.mergeCells('J5:K5');
  formatCell('J5', {
    value: 'بيانات الكاش والمبيعات',
    font: { bold: true, size: 10.5, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8102E' } },
    alignment: { horizontal: 'center' },
  });
  formatCell('K5', {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8102E' } },
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
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } },
    alignment: { horizontal: 'right', indent: 1 },
  });
  formatCell('K11', {
    value: 0,
    font: { bold: true, size: 10.5 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } },
    alignment: { horizontal: 'center' },
    numFmt: '#,##0.00',
  });

  // Summary Inventory (J13:K31) - Title in Red FFC8102E
  ws.mergeCells('J13:K13');
  formatCell('J13', {
    value: 'ملخص الجرد الفعلي والنتيجة النهائية',
    font: { bold: true, size: 10.5, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8102E' } },
    alignment: { horizontal: 'center' },
  });
  formatCell('K13', {
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8102E' } },
  });

  // Ewallet is completely removed!
  const invRows = [
    { row: 14, label: 'نقد الكاش الفعلي' },
    { row: 15, label: 'فيزا' },
    { row: 16, label: 'RT' },
    { row: 17, label: 'مايسترو' },
    { row: 18, label: 'فرق السعر' },
    { row: 19, label: 'السلف' },
    { row: 20, label: 'مشتريات' },
    { row: 21, label: 'سداد ذمم تجار' },
    { row: 22, label: 'المصاريف الأخرى' },
    { row: 23, label: 'المصاريف الإدارية' },
    { row: 24, label: 'البهارات' },
    { row: 25, label: 'الشقة' },
    { row: 26, label: 'يحيى' },
    { row: 27, label: 'معدات وصيانة وأبو عبدالله' },
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

  formatCell('J28', {
    value: 'مجموع الجرد',
    font: { bold: true, size: 10.5 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } },
    alignment: { horizontal: 'right', indent: 1 },
  });
  formatCell('K28', {
    value: 0,
    font: { bold: true, size: 10.5 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } },
    alignment: { horizontal: 'center' },
    numFmt: '#,##0.00',
  });

  formatCell('J29', {
    value: 'نقص الكاش (عجز)',
    font: { bold: true, size: 10 },
    alignment: { horizontal: 'right', indent: 1 },
  });
  formatCell('K29', {
    value: '-',
    font: { bold: true, size: 10 },
    alignment: { horizontal: 'center' },
    numFmt: '#,##0.00',
  });

  formatCell('J30', {
    value: 'زيادة الكاش (فائض)',
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
    value: 'الكاشير المسؤول / الحالة',
    font: { bold: true, size: 10 },
    alignment: { horizontal: 'right', indent: 1 },
  });
  formatCell('K31', {
    value: 'مطابق تماماً',
    font: { bold: true, size: 10 },
    alignment: { horizontal: 'center' },
  });

  // Employee Advances (A39:K69)
  // Row 39: Title in Red FFC8102E
  ws.mergeCells('A39:K39');
  formatCell('A39', {
    value: 'سجل سلف الموظفين اليومية',
    font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8102E' } },
    alignment: { horizontal: 'center' },
  });

  // Row 40: Subheaders in Light Red FFFBEAEA (م | اسم الموظف | قيمة السلفة | ملاحظات/توقيع)
  formatCell('A40', {
    value: 'م',
    font: { bold: true, size: 10 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEAEA' } },
    alignment: { horizontal: 'center' },
  });

  ws.mergeCells('B40:D40');
  formatCell('B40', {
    value: 'اسم الموظف',
    font: { bold: true, size: 10 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEAEA' } },
    alignment: { horizontal: 'center' },
  });
  ['C40', 'D40'].forEach((c) => {
    formatCell(c, { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEAEA' } } });
  });

  ws.mergeCells('E40:G40');
  formatCell('E40', {
    value: 'الملاحظات',
    font: { bold: true, size: 10 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEAEA' } },
    alignment: { horizontal: 'center' },
  });
  ['F40', 'G40'].forEach((c) => {
    formatCell(c, { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEAEA' } } });
  });

  ws.mergeCells('H40:I40');
  formatCell('H40', {
    value: 'دخول',
    font: { bold: true, size: 10 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEAEA' } },
    alignment: { horizontal: 'center' },
  });
  formatCell('I40', { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEAEA' } } });

  formatCell('J40', {
    value: 'خروج',
    font: { bold: true, size: 10 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEAEA' } },
    alignment: { horizontal: 'center' },
  });

  formatCell('K40', {
    value: 'السلفة',
    font: { bold: true, size: 10 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEAEA' } },
    alignment: { horizontal: 'center' },
  });

  // 28 Employee slots (Rows 41 to 68)
  for (let r = 41; r <= 68; r++) {
    const empIdx = r - 40;
    formatCell(`A${r}`, {
      value: empIdx,
      alignment: { horizontal: 'center' },
    });

    ws.mergeCells(`B${r}:D${r}`);
    formatCell(`B${r}`, {
      value: '-',
      alignment: { horizontal: 'right', indent: 1 },
    });

    ws.mergeCells(`E${r}:G${r}`);
    formatCell(`E${r}`, {
      value: '-',
      alignment: { horizontal: 'right', indent: 1 },
    });

    ws.mergeCells(`H${r}:I${r}`);
    formatCell(`H${r}`, {
      value: '-',
      alignment: { horizontal: 'center' },
    });

    formatCell(`J${r}`, {
      value: '-',
      alignment: { horizontal: 'center' },
    });

    formatCell(`K${r}`, {
      value: '-',
      alignment: { horizontal: 'center' },
      numFmt: '#,##0.00',
    });
  }

  // Row 69: Total
  ws.mergeCells('A69:J69');
  formatCell('A69', {
    value: 'إجمالي السلف',
    font: { bold: true, size: 10.5 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } },
    alignment: { horizontal: 'center' },
  });
  ['B69', 'C69', 'D69', 'E69', 'F69', 'G69', 'H69', 'I69', 'J69'].forEach((c) => {
    formatCell(c, { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } } });
  });

  formatCell('K69', {
    value: 0,
    font: { bold: true, size: 10.5, color: { argb: 'FFC8102E' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } },
    alignment: { horizontal: 'center' },
    numFmt: '#,##0.00',
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

  // Section 12: أبو عبدالله (A29:B32)
  fillSection('A', 'B', 29, 32, data.abuAbdullah, calc.abuAbdullahTotal);

  // Section 13: معدات وصيانة (A34:B37)
  fillSection('A', 'B', 34, 37, data.equipment, calc.equipmentTotal);

  // Section 14: استهلاك المطبخ (D27:E35) - يظهر فقط إن احتوى بيانات فعلية
  const kitchenItems = [
    { label: 'سيخ 1', amount: data.kitchenConsumption?.skewer1 },
    { label: 'سيخ 2', amount: data.kitchenConsumption?.skewer2 },
    { label: 'تزويد', amount: data.kitchenConsumption?.supply },
    { label: 'مرتجع', amount: data.kitchenConsumption?.return },
    { label: 'استهلاك رز', amount: data.kitchenConsumption?.rice },
    { label: 'استهلاك لوز', amount: data.kitchenConsumption?.almond },
    { label: 'استهلاك بطاطا', amount: data.kitchenConsumption?.potato },
  ];
  const hasKitchenData = kitchenItems.some((item) => Number(item.amount) > 0);

  if (hasKitchenData) {
    // Title row (D27:E27) - Red FFC8102E
    try { ws.mergeCells('D27:E27'); } catch { /* ignore if merged */ }
    const tCellD = ws.getCell('D27');
    tCellD.value = 'استهلاك المطبخ';
    tCellD.font = { name: 'Arial', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    tCellD.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8102E' } };
    tCellD.alignment = { horizontal: 'center', vertical: 'middle' };
    tCellD.border = THIN_BORDER;

    const tCellE = ws.getCell('E27');
    tCellE.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8102E' } };
    tCellE.border = THIN_BORDER;

    // Subheader row (D28:E28) - Light red FFFBEAEA
    const hCellD = ws.getCell('D28');
    hCellD.value = 'البيان';
    hCellD.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    hCellD.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEAEA' } };
    hCellD.alignment = { horizontal: 'center', vertical: 'middle' };
    hCellD.border = THIN_BORDER;

    const hCellE = ws.getCell('E28');
    hCellE.value = 'الكمية';
    hCellE.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    hCellE.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEAEA' } };
    hCellE.alignment = { horizontal: 'center', vertical: 'middle' };
    hCellE.border = THIN_BORDER;

    // Data rows (D29:E35) - Regular numbers, no currency format, no total row
    kitchenItems.forEach((item, idx) => {
      const r = 29 + idx;
      const cLabel = ws.getCell(`D${r}`);
      cLabel.value = item.label;
      cLabel.font = { name: 'Arial', size: 10 };
      cLabel.alignment = { horizontal: 'right', indent: 1, vertical: 'middle' };
      cLabel.border = THIN_BORDER;

      const cAmount = ws.getCell(`E${r}`);
      const val = Number(item.amount) || 0;
      cAmount.value = val > 0 ? val : '-';
      cAmount.font = { name: 'Arial', size: 10 };
      cAmount.alignment = { horizontal: 'center', vertical: 'middle' };
      cAmount.border = THIN_BORDER;
      if (val > 0) cAmount.numFmt = '#,##0.##';
    });
  } else {
    // Clear section if no kitchen data
    for (let r = 27; r <= 35; r++) {
      const cD = ws.getCell(`D${r}`);
      const cE = ws.getCell(`E${r}`);
      cD.value = undefined;
      cE.value = undefined;
      cD.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      cE.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      cD.border = undefined;
      cE.border = undefined;
    }
  }

  // Section 15: جرد الإنتاج (G30:H34) - يظهر فقط إن احتوى بيانات فعلية
  const productionItems = [
    { label: 'بروستد', amount: data.productionInventory?.broasted },
    { label: 'تكا', amount: data.productionInventory?.tikka },
    { label: 'زنجر', amount: data.productionInventory?.zinger },
  ];
  const hasProductionData = productionItems.some((item) => Number(item.amount) > 0);

  if (hasProductionData) {
    // Title row (G30:H30) - Red FFC8102E
    try { ws.mergeCells('G30:H30'); } catch { /* ignore if merged */ }
    const tCellG = ws.getCell('G30');
    tCellG.value = 'جرد الإنتاج';
    tCellG.font = { name: 'Arial', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    tCellG.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8102E' } };
    tCellG.alignment = { horizontal: 'center', vertical: 'middle' };
    tCellG.border = THIN_BORDER;

    const tCellH = ws.getCell('H30');
    tCellH.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8102E' } };
    tCellH.border = THIN_BORDER;

    // Subheader row (G31:H31) - Light red FFFBEAEA
    const hCellG = ws.getCell('G31');
    hCellG.value = 'الصنف';
    hCellG.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    hCellG.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEAEA' } };
    hCellG.alignment = { horizontal: 'center', vertical: 'middle' };
    hCellG.border = THIN_BORDER;

    const hCellH = ws.getCell('H31');
    hCellH.value = 'الكمية';
    hCellH.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    hCellH.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEAEA' } };
    hCellH.alignment = { horizontal: 'center', vertical: 'middle' };
    hCellH.border = THIN_BORDER;

    // Data rows (G32:H34) - Regular numbers, no currency format, no total row
    productionItems.forEach((item, idx) => {
      const r = 32 + idx;
      const cLabel = ws.getCell(`G${r}`);
      cLabel.value = item.label;
      cLabel.font = { name: 'Arial', size: 10 };
      cLabel.alignment = { horizontal: 'right', indent: 1, vertical: 'middle' };
      cLabel.border = THIN_BORDER;

      const cAmount = ws.getCell(`H${r}`);
      const val = Number(item.amount) || 0;
      cAmount.value = val > 0 ? val : '-';
      cAmount.font = { name: 'Arial', size: 10 };
      cAmount.alignment = { horizontal: 'center', vertical: 'middle' };
      cAmount.border = THIN_BORDER;
      if (val > 0) cAmount.numFmt = '#,##0.##';
    });
  } else {
    // Clear section if no production data
    for (let r = 30; r <= 34; r++) {
      const cG = ws.getCell(`G${r}`);
      const cH = ws.getCell(`H${r}`);
      cG.value = undefined;
      cH.value = undefined;
      cG.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      cH.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
      cG.border = undefined;
      cH.border = undefined;
    }
  }

  // Section 16: ملخص الجرد الفعلي والنتيجة النهائية (J13:K31)
  // Notice: Ewallet is completely excluded!
  ws.getCell('K14').value = Number(data.actualInventory.actualCash) || 0;
  ws.getCell('K15').value = Number(data.actualInventory.visa) || 0;
  ws.getCell('K16').value = Number(data.actualInventory.rt) || 0;
  ws.getCell('K17').value = Number(data.actualInventory.maestro) || 0;
  ws.getCell('K18').value = Number(data.actualInventory.priceDifference) || 0;
  ws.getCell('K19').value = Number(calc.effectiveAdvances) || 0;
  ws.getCell('K20').value = Number(calc.purchasesTotal) || 0;
  ws.getCell('K21').value = Number(calc.payMerchantTotal) || 0;
  ws.getCell('K22').value = Number(calc.otherExpensesTotal) || 0;
  ws.getCell('K23').value = Number(calc.adminExpensesTotal) || 0;
  ws.getCell('K24').value = Number(calc.spicesTotal) || 0;
  ws.getCell('K25').value = Number(calc.apartmentTotal) || 0;
  ws.getCell('K26').value = Number(calc.yahyaTotal) || 0;
  ws.getCell('K27').value = Number(calc.equipmentTotal || 0) + Number(calc.abuAbdullahTotal || 0);
  ws.getCell('K28').value = Number(calc.totalInventory) || 0;

  // J29:K29 - نقص الكاش (عجز)
  const cellJ29 = ws.getCell('J29');
  const cellK29 = ws.getCell('K29');
  if (calc.cashShortage > 0) {
    cellK29.value = calc.cashShortage;
    cellJ29.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } };
    cellK29.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4D6' } };
    cellJ29.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFC8102E' } };
    cellK29.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFC8102E' } };
  } else {
    cellK29.value = '-';
    cellJ29.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    cellK29.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    cellJ29.font = { name: 'Arial', size: 10, bold: false, color: { argb: 'FF64748B' } };
    cellK29.font = { name: 'Arial', size: 10, bold: false, color: { argb: 'FF64748B' } };
  }

  // J30:K30 - زيادة الكاش (فائض)
  const cellJ30 = ws.getCell('J30');
  const cellK30 = ws.getCell('K30');
  if (calc.cashSurplus > 0) {
    cellK30.value = calc.cashSurplus;
    cellJ30.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
    cellK30.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2EFDA' } };
    cellJ30.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF047857' } };
    cellK30.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF047857' } };
  } else {
    cellK30.value = '-';
    cellJ30.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    cellK30.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    cellJ30.font = { name: 'Arial', size: 10, bold: false, color: { argb: 'FF64748B' } };
    cellK30.font = { name: 'Arial', size: 10, bold: false, color: { argb: 'FF64748B' } };
  }

  // J31:K31 - الكاشير المسؤول / حالة المطابقة
  const cellK31 = ws.getCell('K31');
  if (calc.cashShortage > 0) {
    cellK31.value = data.cashierName ? `عجز (الكاشير: ${data.cashierName})` : 'عجز غير محدد الكاشير';
  } else if (calc.cashSurplus > 0) {
    cellK31.value = data.cashierName ? `زيادة (الكاشير: ${data.cashierName})` : 'فائض كاش';
  } else {
    cellK31.value = 'الكاش مطابق تماماً';
  }

  // Section 17: جدول الموظفين (A39:K69)
  // الأعمدة: م (A) | اسم الموظف (B:D) | الملاحظات (E:G) | دخول (H:I) | خروج (J) | السلفة (K)
  const employees = (data.employeeAdvances || []).filter(
    (emp) => emp.employeeName?.trim() || Number(emp.amount) > 0 || emp.startTime || emp.endTime
  );
  let totalAdvancesSum = 0;

  const defaultSlotCount = 28;
  for (let i = 0; i < defaultSlotCount; i++) {
    const row = 41 + i;
    const emp = employees[i];
    const cellA = ws.getCell(`A${row}`);
    const cellB = ws.getCell(`B${row}`);
    const cellE = ws.getCell(`E${row}`);
    const cellH = ws.getCell(`H${row}`);
    const cellJ = ws.getCell(`J${row}`);
    const cellK = ws.getCell(`K${row}`);

    cellA.value = i + 1;
    if (emp) {
      const advAmount = Number(emp.amount) || 0;
      totalAdvancesSum += advAmount;

      cellB.value = emp.employeeName || '-';
      cellE.value = emp.notes?.trim() || '-';
      cellH.value = emp.startTime || '-';
      cellJ.value = emp.endTime || '-';
      cellK.value = advAmount > 0 ? advAmount : (emp.employeeName ? 0 : '-');
    } else {
      cellB.value = '-';
      cellE.value = '-';
      cellH.value = '-';
      cellJ.value = '-';
      cellK.value = '-';
    }
  }

  // Dynamically append rows if employees exceed 28 slots without losing data
  let totalRowNumber = 69;
  if (employees.length > defaultSlotCount) {
    for (let i = defaultSlotCount; i < employees.length; i++) {
      const insertAt = totalRowNumber;
      ws.insertRow(insertAt, [i + 1, '-', '', '', '-', '', '', '-', '', '-', '-']);
      const newRow = ws.getRow(insertAt);
      newRow.height = 19;

      const safeMerge = (range: string) => {
        try {
          ws.mergeCells(range);
        } catch {
          // Range may be pre-merged by row insertion
        }
      };
      safeMerge(`B${insertAt}:D${insertAt}`);
      safeMerge(`E${insertAt}:G${insertAt}`);
      safeMerge(`H${insertAt}:I${insertAt}`);

      const emp = employees[i];
      const advAmount = Number(emp.amount) || 0;
      totalAdvancesSum += advAmount;

      newRow.getCell(1).value = i + 1;
      newRow.getCell(2).value = emp.employeeName || '-';
      newRow.getCell(5).value = emp.notes?.trim() || '-';
      newRow.getCell(8).value = emp.startTime || '-';
      newRow.getCell(10).value = emp.endTime || '-';
      newRow.getCell(11).value = advAmount > 0 ? advAmount : (emp.employeeName ? 0 : '-');

      for (let c = 1; c <= 11; c++) {
        const cell = newRow.getCell(c);
        cell.font = { name: 'Arial', size: 10 };
        cell.border = THIN_BORDER;
      }

      totalRowNumber++;
    }
  }

  // Total advances row (placed in column K)
  const advancesTotalCell = ws.getCell(`K${totalRowNumber}`);
  advancesTotalCell.value = totalAdvancesSum;

  ws.pageSetup.printArea = `A1:K${totalRowNumber}`;
  ws.pageSetup.fitToWidth = 1;
  ws.pageSetup.fitToHeight = 1;

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
