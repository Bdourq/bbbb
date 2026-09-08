import ExcelJS from 'exceljs';
import path from 'path';

export async function generateTemplate() {
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
        top: 0.3,
        bottom: 0.3,
        header: 0.2,
        footer: 0.2,
      },
      printArea: 'A1:K69',
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

  // 1. A1:K1 - Title (Red brand color FFC8102E)
  ws.mergeCells('A1:K1');
  formatCell('A1', {
    value: 'مطعم يحيى البيك - تقرير إغلاق الكاش اليومي الشامل',
    font: { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8102E' } },
    alignment: { horizontal: 'center', vertical: 'middle' },
  });

  // 2. J3:K3 - Date and Day (Subheader light red FFFBEAEA)
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
    // Title row (startRow) - Red FFC8102E
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

    // Column Headers row (startRow + 1) - Light red FFFBEAEA
    formatCell(`${colLabel}${startRow + 1}`, {
      value: itemLabel,
      font: { bold: true, size: 10 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEAEA' } },
      alignment: { horizontal: 'center' },
    });
    formatCell(`${colAmount}${startRow + 1}`, {
      value: amountLabel,
      font: { bold: true, size: 10 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBEAEA' } },
      alignment: { horizontal: 'center' },
    });

    // Items rows
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

    // Total row (endRow) - Semantic light green FFE2EFDA
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

  // Build upper expense sections
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

  // Cash and Sales (J5:K11) - Title in Red FFC8102E
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

  // Notice: Ewallet is completely removed!
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

  // Employee Advances Section (A39:K69)
  // Row 39: Title in Red FFC8102E
  ws.mergeCells('A39:K39');
  formatCell('A39', {
    value: 'سجل سلف الموظفين اليومية',
    font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8102E' } },
    alignment: { horizontal: 'center' },
  });

  // Row 40: Subheaders in Light Red FFFBEAEA (Columns: م | اسم الموظف | الملاحظات | دخول | خروج | السلفة)
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

  // 28 Employee rows (Rows 41 to 68)
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

  // Row 69: Employee Advances Total
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

  const targetPath = path.join(process.cwd(), 'public/templates/closing-report-template.xlsx');
  await wb.xlsx.writeFile(targetPath);
  console.log('Template generated successfully at:', targetPath);

  // Also write to dist/templates if dist exists
  try {
    const distPath = path.join(process.cwd(), 'dist/templates/closing-report-template.xlsx');
    await wb.xlsx.writeFile(distPath);
    console.log('Template synced to dist at:', distPath);
  } catch {
    // dist may not exist yet
  }
}

generateTemplate().catch((err) => {
  console.error('Error generating template:', err);
  process.exit(1);
});
