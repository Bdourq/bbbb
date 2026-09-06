import ExcelJS from 'exceljs';
import path from 'path';

async function generateTemplate() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'مطعم يحيى البيك';
  wb.created = new Date('2026-08-28T00:00:00Z');

  // Single sheet: "تقرير الإغلاق", RTL
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

  // Set explicit column widths:
  // A = 24, B = 12, C = 3, D = 24, E = 12, F = 3, G = 24, H = 12, I = 3, J = 26, K = 14
  const colWidths = [24, 12, 3, 24, 12, 3, 24, 12, 3, 26, 14];
  colWidths.forEach((w, idx) => {
    ws.getColumn(idx + 1).width = w;
  });

  const THIN_BORDER: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFDEE2E6' } },
    left: { style: 'thin', color: { argb: 'FFDEE2E6' } },
    bottom: { style: 'thin', color: { argb: 'FFDEE2E6' } },
    right: { style: 'thin', color: { argb: 'FFDEE2E6' } },
  };

  const BORDER_TOP_DOUBLE: Partial<ExcelJS.Borders> = {
    top: { style: 'double', color: { argb: 'FF0F172A' } },
    left: { style: 'thin', color: { argb: 'FFDEE2E6' } },
    bottom: { style: 'thin', color: { argb: 'FFDEE2E6' } },
    right: { style: 'thin', color: { argb: 'FFDEE2E6' } },
  };

  // Helper to format cell
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

  // Row heights
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

  // 1. A1:K1 - Title
  ws.mergeCells('A1:K1');
  formatCell('A1', {
    value: 'مطعم يحيى البيك - تقرير إغلاق الكاش اليومي الشامل',
    font: { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  });

  // 2. J3:K3 - Date and Day
  formatCell('J3', {
    value: 'اليوم والتاريخ',
    font: { bold: true, size: 10 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } },
    alignment: { horizontal: 'center' },
  });
  formatCell('K3', {
    value: 'الجمعة 2026-08-28',
    font: { bold: true, size: 10 },
    alignment: { horizontal: 'center' },
  });

  // Helper for 2-column section blocks
  const buildSection = (
    colLabel: string, // e.g. 'A'
    colAmount: string, // e.g. 'B'
    startRow: number,
    endRow: number,
    title: string,
    itemLabel = 'البيان',
    amountLabel = 'المبلغ'
  ) => {
    // Title row (startRow)
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

    // Column Headers row (startRow + 1)
    formatCell(`${colLabel}${startRow + 1}`, {
      value: itemLabel,
      font: { bold: true, size: 10 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } },
      alignment: { horizontal: 'center' },
    });
    formatCell(`${colAmount}${startRow + 1}`, {
      value: amountLabel,
      font: { bold: true, size: 10 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } },
      alignment: { horizontal: 'center' },
    });

    // Data rows
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

    // Total row (endRow)
    formatCell(`${colLabel}${endRow}`, {
      value: `إجمالي ${title}`,
      font: { bold: true, size: 10 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } },
      alignment: { horizontal: 'center' },
    });
    formatCell(`${colAmount}${endRow}`, {
      value: 0,
      font: { bold: true, size: 10 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } },
      alignment: { horizontal: 'center' },
      numFmt: '#,##0.00',
    });
  };

  // 3. A5:B21 - المشتريات
  buildSection('A', 'B', 5, 21, 'المشتريات');

  // 4. D5:E8 - إضافة ذمم تجار
  buildSection('D', 'E', 5, 8, 'إضافة ذمم تجار');

  // 5. G5:H9 - سداد ذمم تجار
  buildSection('G', 'H', 5, 9, 'سداد ذمم تجار');

  // 6. J5:K11 - بيانات الكاش والمبيعات
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

  const cashSalesItems = [
    { row: 6, label: 'النقد الافتتاحي', val: 0 },
    { row: 7, label: 'إضافة ذمم', val: 0 },
    { row: 8, label: 'تسديد ذمم قديمة', val: 0 },
    { row: 9, label: 'مبيعات', val: 0 },
    { row: 10, label: 'مبيعات أخرى', val: 0 },
  ];
  cashSalesItems.forEach((item) => {
    formatCell(`J${item.row}`, {
      value: item.label,
      alignment: { horizontal: 'right', indent: 1 },
    });
    formatCell(`K${item.row}`, {
      value: item.val,
      alignment: { horizontal: 'center' },
      numFmt: '#,##0.00',
    });
  });

  // Total cash row J11:K11
  formatCell('J11', {
    value: 'مجموع الكاش',
    font: { bold: true, size: 10 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } },
    alignment: { horizontal: 'center' },
  });
  formatCell('K11', {
    value: 0,
    font: { bold: true, size: 10 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } },
    alignment: { horizontal: 'center' },
    numFmt: '#,##0.00',
  });

  // 7. D10:E13 - الشقة
  buildSection('D', 'E', 10, 13, 'الشقة');

  // 8. G11:H15 - يحيى
  buildSection('G', 'H', 11, 15, 'يحيى');

  // 9. D15:E25 - المصاريف الإدارية
  buildSection('D', 'E', 15, 25, 'المصاريف الإدارية');

  // 10. G17:H28 - البهارات
  buildSection('G', 'H', 17, 28, 'البهارات');

  // 11. A23:B27 - مصاريف أخرى
  buildSection('A', 'B', 23, 27, 'مصاريف أخرى');

  // 12. D27:E32 - المحفظة الإلكترونية
  buildSection('D', 'E', 27, 32, 'المحفظة الإلكترونية');

  // 13. A29:B32 - أبو عبدالله
  buildSection('A', 'B', 29, 32, 'أبو عبدالله');

  // 14. A34:B37 - معدات وصيانة
  buildSection('A', 'B', 34, 37, 'معدات وصيانة');

  // 15. J13:K32 - ملخص الجرد الفعلي والنتيجة النهائية
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

  const actualInventoryItems = [
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

  actualInventoryItems.forEach((item) => {
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

  // J29:K29 - مجموع الجرد
  formatCell('J29', {
    value: 'مجموع الجرد',
    font: { bold: true, size: 10.5 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } },
    alignment: { horizontal: 'center' },
  });
  formatCell('K29', {
    value: 0,
    font: { bold: true, size: 10.5 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } },
    alignment: { horizontal: 'center' },
    numFmt: '#,##0.00',
  });

  // J30:K30 - نقص الكاش (عجز)
  formatCell('J30', {
    value: 'نقص الكاش (عجز)',
    font: { bold: true, size: 10, color: { argb: 'FFBE123C' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF0F5' } },
    alignment: { horizontal: 'center' },
  });
  formatCell('K30', {
    value: '-',
    font: { bold: true, size: 10, color: { argb: 'FFBE123C' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF0F5' } },
    alignment: { horizontal: 'center' },
    numFmt: '#,##0.00',
  });

  // J31:K31 - زيادة الكاش (فائض)
  formatCell('J31', {
    value: 'زيادة الكاش (فائض)',
    font: { bold: true, size: 10, color: { argb: 'FF047857' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } },
    alignment: { horizontal: 'center' },
  });
  formatCell('K31', {
    value: '-',
    font: { bold: true, size: 10, color: { argb: 'FF047857' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } },
    alignment: { horizontal: 'center' },
    numFmt: '#,##0.00',
  });

  // J32:K32 - الكاشير المسؤول / الحالة
  formatCell('J32', {
    value: 'الكاشير المسؤول',
    font: { bold: true, size: 9.5 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } },
    alignment: { horizontal: 'center' },
  });
  formatCell('K32', {
    value: '-',
    font: { bold: true, size: 9.5 },
    alignment: { horizontal: 'center' },
  });

  // 16. A41:K71 - جدول الموظفين (سجل سلف الموظفين اليومية)
  // Row 41: Title banner
  ws.mergeCells('A41:K41');
  formatCell('A41', {
    value: 'سجل سلف الموظفين اليومية',
    font: { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A5F' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  });

  // Row 42: Headers
  // A: رقم الموظف
  // B..E merged: اسم الموظف
  // F..H merged: قيمة السلفة
  // I..K merged: التوقيع أو الملاحظات
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

  // Rows 43 to 70: Employee Rows
  for (let r = 43; r <= 70; r++) {
    const empIndex = r - 42;
    formatCell(`A${r}`, {
      value: empIndex,
      alignment: { horizontal: 'center' },
    });

    ws.mergeCells(`B${r}:E${r}`);
    formatCell(`B${r}`, {
      value: '-',
      alignment: { horizontal: 'right', indent: 1 },
    });
    [`C${r}`, `D${r}`, `E${r}`].forEach((c) => formatCell(c, {}));

    ws.mergeCells(`F${r}:H${r}`);
    formatCell(`F${r}`, {
      value: '-',
      alignment: { horizontal: 'center' },
      numFmt: '#,##0.00',
    });
    [`G${r}`, `H${r}`].forEach((c) => formatCell(c, {}));

    ws.mergeCells(`I${r}:K${r}`);
    formatCell(`I${r}`, {
      value: '-',
      alignment: { horizontal: 'center' },
    });
    [`J${r}`, `K${r}`].forEach((c) => formatCell(c, {}));
  }

  // Row 71: Employee Total
  ws.mergeCells('A71:E71');
  formatCell('A71', {
    value: 'إجمالي السلف',
    font: { bold: true, size: 10.5 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } },
    alignment: { horizontal: 'center' },
  });
  ['B71', 'C71', 'D71', 'E71'].forEach((c) => {
    formatCell(c, { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } } });
  });

  ws.mergeCells('F71:H71');
  formatCell('F71', {
    value: 0,
    font: { bold: true, size: 10.5, color: { argb: 'FF1E3A5F' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } },
    alignment: { horizontal: 'center' },
    numFmt: '#,##0.00',
  });
  ['G71', 'H71'].forEach((c) => {
    formatCell(c, { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } } });
  });

  ws.mergeCells('I71:K71');
  formatCell('I71', {
    value: 'دينار أردني',
    font: { bold: true, size: 10 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } },
    alignment: { horizontal: 'center' },
  });
  ['J71', 'K71'].forEach((c) => {
    formatCell(c, { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } } });
  });

  const targetPath = path.join(process.cwd(), 'public/templates/closing-report-template.xlsx');
  await wb.xlsx.writeFile(targetPath);
  console.log('Template generated successfully at:', targetPath);
}

generateTemplate().catch((err) => {
  console.error('Error generating template:', err);
  process.exit(1);
});
