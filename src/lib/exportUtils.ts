import * as xlsx from 'xlsx';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { ShiftData } from '../store/useShiftStore';

export const exportToExcel = (data: ShiftData, calc: any) => {
  const wb = xlsx.utils.book_new();

  const addedReceivablesTotal = data.addCashReceivables 
    ? data.addCashReceivables.reduce((sum, item) => sum + (item.amount || 0), 0)
    : (data.cashAndSales.paidOldReceivables || 0);

  const newReceivablesTotal = data.addNewReceivables
    ? data.addNewReceivables.reduce((sum, item) => sum + (item.amount || 0), 0)
    : (data.cashAndSales.addedReceivables || 0);

  // 1. Summary Sheet (ملخص الجرد المالي)
  const summaryData = [
    { 'البيان': 'تقرير إغلاق الكاش اليومي - مطعم يحيى البيك', 'القيمة': '' },
    { 'البيان': 'تاريخ الإغلاق', 'القيمة': data.date },
    { 'البيان': 'اسم الكاشير', 'القيمة': (calc.cashShortage > 0 || calc.cashSurplus > 0) ? (data.cashierName || 'غير محدد') : 'مطابق (لا يلزم كاشير)' },
    { 'البيان': 'حالة الشفت', 'القيمة': data.isClosed ? 'مغلق' : 'مفتوح' },
    { 'البيان': '', 'القيمة': '' },
    { 'البيان': '--- ملخص الجرد الفعلي (الأولوية القصوى) ---', 'القيمة': '' },
    { 'البيان': 'نقد (الكاش الفعلي)', 'القيمة': data.actualInventory.actualCash },
    { 'البيان': 'فيزا', 'القيمة': data.actualInventory.visa },
    { 'البيان': 'Rt', 'القيمة': data.actualInventory.rt },
    { 'البيان': 'مايسترو', 'القيمة': data.actualInventory.maestro },
    { 'البيان': 'فرق سعر', 'القيمة': data.actualInventory.priceDifference },
    { 'البيان': 'سلف', 'القيمة': data.actualInventory.advances },
    { 'البيان': 'المحفظة', 'القيمة': data.actualInventory.wallet },
    { 'البيان': 'مجموع الجرد الفعلي', 'القيمة': calc.totalInventory },
    { 'البيان': '', 'القيمة': '' },
    { 'البيان': '--- حركة الكاش والمبيعات ---', 'القيمة': '' },
    { 'البيان': 'النقد الافتتاحي', 'القيمة': data.cashAndSales.openingCash },
    { 'البيان': 'سداد ذمم قديمة', 'القيمة': addedReceivablesTotal },
    { 'البيان': 'إضافة ذمم جديدة', 'القيمة': newReceivablesTotal },
    { 'البيان': 'مبيعات', 'القيمة': data.cashAndSales.sales },
    { 'البيان': 'مبيعات أخرى', 'القيمة': data.cashAndSales.otherSales },
    { 'البيان': 'مجموع الكاش المتوفر', 'القيمة': calc.totalCash },
    { 'البيان': '', 'القيمة': '' },
    { 'البيان': '--- النتيجة النهائية ---', 'القيمة': '' },
    { 
      'البيان': 'نقص الكاش الإجمالي' + (calc.cashShortage > 0 && data.cashierName ? ` (${data.cashierName})` : ''), 
      'القيمة': calc.cashShortage ? -calc.cashShortage : 0 
    },
    { 
      'البيان': 'زيادة الكاش الإجمالي' + (calc.cashSurplus > 0 && data.cashierName ? ` (${data.cashierName})` : ''), 
      'القيمة': calc.cashSurplus 
    },
    ...(data.shiftDifferences?.morning && (data.shiftDifferences.morning.amount || 0) > 0 ? [{
      'البيان': `فارق الشفت الصباحي (${data.shiftDifferences.morning.cashierName || 'صباحي'}) - ${data.shiftDifferences.morning.type === 'shortage' ? 'عجز' : 'زيادة'}`,
      'القيمة': data.shiftDifferences.morning.type === 'shortage' ? -data.shiftDifferences.morning.amount : data.shiftDifferences.morning.amount
    }] : []),
    ...(data.shiftDifferences?.evening && (data.shiftDifferences.evening.amount || 0) > 0 ? [{
      'البيان': `فارق الشفت المسائي (${data.shiftDifferences.evening.cashierName || 'مسائي'}) - ${data.shiftDifferences.evening.type === 'shortage' ? 'عجز' : 'زيادة'}`,
      'القيمة': data.shiftDifferences.evening.type === 'shortage' ? -data.shiftDifferences.evening.amount : data.shiftDifferences.evening.amount
    }] : []),
    { 'البيان': '', 'القيمة': '' },
    { 'البيان': '--- توقيع وتذييل التقرير ---', 'القيمة': '' },
    { 'البيان': 'الكاشير المسؤول', 'القيمة': (calc.cashShortage > 0 || calc.cashSurplus > 0) ? (data.cashierName || 'غير محدد') : 'مطابق' },
    { 'البيان': 'تاريخ التقرير', 'القيمة': data.date }
  ];
  const wsSummary = xlsx.utils.json_to_sheet(summaryData);
  wsSummary['!dir'] = 'rtl';
  xlsx.utils.book_append_sheet(wb, wsSummary, "ملخص الجرد الإغلاق");

  // 2. Detailed Expenses & Receivables Sheet (المصاريف والذمم مرتبة حسب الأولوية)
  const flattenList = (list: any[], categoryName: string) => 
    list
      .filter(item => (item.label && item.label.trim()) || (Number(item.amount) !== 0))
      .map(item => ({ 'التصنيف': categoryName, 'البيان': item.label || (categoryName === 'المحفظة الإلكترونية' ? 'حركة محفظة' : '-'), 'المبلغ': item.amount || 0 }));

  const rawExpensesData = [
    ...flattenList(data.addCashReceivables || [], 'إضافة ذمم (للكاش)'),
    ...flattenList(data.purchases, 'مشتريات'),
    ...flattenList(data.otherExpenses, 'مصاريف أخرى'),
    ...flattenList(data.abuAbdullah, 'أبو عبدالله'),
    ...flattenList(data.equipment, 'معدات وصيانة'),
    ...flattenList(data.addMerchantReceivables, 'إضافة ذمم تجار'),
    ...flattenList(data.apartment, 'الشقة'),
    ...flattenList(data.adminExpenses, 'مصاريف إدارية'),
    ...flattenList(data.ewallet, 'المحفظة الإلكترونية'),
    ...flattenList(data.payMerchantReceivables, 'سداد ذمم تجار'),
    ...flattenList(data.yahya, 'يحيى'),
    ...flattenList(data.spices, 'بهارات'),
  ];

  // Sort by priority (items with non-zero amounts first)
  const expensesData = rawExpensesData.sort((a, b) => Number(b.المبلغ) - Number(a.المبلغ));
  if (expensesData.length > 0) {
    const wsExpenses = xlsx.utils.json_to_sheet(expensesData);
    wsExpenses['!dir'] = 'rtl';
    xlsx.utils.book_append_sheet(wb, wsExpenses, "المصاريف والذمم");
  }

  // 3. Kitchen & Production Sheet (استهلاك المطبخ والإنتاج)
  const kitchenData = [
    { 'التصنيف': 'استهلاك المطبخ', 'البيان': 'سيخ 1', 'الكمية/القيمة': data.kitchenConsumption.skewer1 },
    { 'التصنيف': 'استهلاك المطبخ', 'البيان': 'سيخ 2', 'الكمية/القيمة': data.kitchenConsumption.skewer2 },
    { 'التصنيف': 'استهلاك المطبخ', 'البيان': 'تزويد', 'الكمية/القيمة': data.kitchenConsumption.supply },
    { 'التصنيف': 'استهلاك المطبخ', 'البيان': 'مرتجع', 'الكمية/القيمة': data.kitchenConsumption.return },
    { 'التصنيف': 'استهلاك المطبخ', 'البيان': 'استهلاك رز', 'الكمية/القيمة': data.kitchenConsumption.rice },
    { 'التصنيف': 'استهلاك المطبخ', 'البيان': 'استهلاك لوز', 'الكمية/القيمة': data.kitchenConsumption.almond },
    { 'التصنيف': 'استهلاك المطبخ', 'البيان': 'استهلاك بطاطا', 'الكمية/القيمة': data.kitchenConsumption.potato },
    { 'التصنيف': 'جرد الإنتاج', 'البيان': 'بروستد', 'الكمية/القيمة': data.productionInventory.broasted },
    { 'التصنيف': 'جرد الإنتاج', 'البيان': 'تكا', 'الكمية/القيمة': data.productionInventory.tikka },
    { 'التصنيف': 'جرد الإنتاج', 'البيان': 'زنجر', 'الكمية/القيمة': data.productionInventory.zinger },
  ];
  const wsKitchen = xlsx.utils.json_to_sheet(kitchenData);
  wsKitchen['!dir'] = 'rtl';
  xlsx.utils.book_append_sheet(wb, wsKitchen, "المطبخ والإنتاج");

  // 4. Employees Attendance & Advances Sheet (حضور وسلف الموظفين)
  const advancesData = data.employeeAdvances.map((emp, index) => {
    let dailyWage = 0;
    if (emp.startTime && emp.endTime && emp.hourlyRate) {
      const [sh, sm] = emp.startTime.split(':').map(Number);
      const [eh, em] = emp.endTime.split(':').map(Number);
      let hours = (eh + em / 60) - (sh + sm / 60);
      if (hours < 0) hours += 24;
      dailyWage = Number((hours * emp.hourlyRate).toFixed(2));
    }

    const isOff = emp.employeeName.trim() && !emp.startTime && !emp.endTime;

    return {
      'م': index + 1,
      'اسم الموظف': emp.employeeName || '-',
      'الحالة': isOff ? 'OFF (لم يحضر)' : 'حاضر',
      'وقت الدخول': emp.startTime || '-',
      'وقت الخروج': emp.endTime || '-',
      'أجر الساعة': emp.hourlyRate || 0,
      'الأجر اليومي': dailyWage,
      'قيمة السلفة': emp.amount || 0,
      'ملاحظات': emp.notes || ''
    };
  });
  if (advancesData.length > 0) {
    const wsAdvances = xlsx.utils.json_to_sheet(advancesData);
    wsAdvances['!dir'] = 'rtl';
    xlsx.utils.book_append_sheet(wb, wsAdvances, "حضور وسلف الموظفين");
  }

  // Save File
  xlsx.writeFile(wb, `تقرير_إغلاق_الكاش_${data.date}.xlsx`);
};

export const printDocument = () => {
  window.print();
};

export const getDayLabel = (dateStr: string): string => {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const weekdaysMap: Record<number, string> = {
      5: 'الجمعة',
      6: 'السبت',
      0: 'الأحد',
      1: 'الاثنين',
      2: 'الثلاثاء',
      3: 'الأربعاء',
      4: 'الخميس'
    };
    return weekdaysMap[dateObj.getDay()] || 'اليوم';
  } catch {
    return 'اليوم';
  }
};

export const exportToPdf = async (date: string) => {
  const dayLabel = getDayLabel(date);
  const cashElement = document.getElementById('cash-report-export') || document.getElementById('report-content');
  const empElement = document.getElementById('employee-report-export');
  if (!cashElement) return;

  try {
    const filter = (node: HTMLElement) => {
      if (node?.hasAttribute && node.hasAttribute('data-html2canvas-ignore')) return false;
      if (node?.classList && typeof node.classList.contains === 'function' && node.classList.contains('print:hidden')) return false;
      return true;
    };

    cashElement.classList.add('export-mode');
    await new Promise(resolve => setTimeout(resolve, 200));

    const cashDataUrl = await toPng(cashElement, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      filter: filter,
    });

    cashElement.classList.remove('export-mode');

    // Create jsPDF instance in A4 Landscape orientation (297mm x 210mm)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 297mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 210mm
    const margin = 6;
    const imgWidth = pdfWidth - (margin * 2); // 285mm

    const cashImgProps = pdf.getImageProperties(cashDataUrl);
    const cashImgHeight = (cashImgProps.height * imgWidth) / cashImgProps.width;

    let heightLeft = cashImgHeight;
    let position = margin;

    pdf.addImage(cashDataUrl, 'PNG', margin, position, imgWidth, cashImgHeight);
    heightLeft -= (pdfHeight - (margin * 2));

    while (heightLeft > 0) {
      position = heightLeft - cashImgHeight + margin;
      pdf.addPage();
      pdf.addImage(cashDataUrl, 'PNG', margin, position, imgWidth, cashImgHeight);
      heightLeft -= (pdfHeight - (margin * 2));
    }

    // Capture employee advances section if present
    if (empElement) {
      empElement.classList.add('export-mode');
      await new Promise(resolve => setTimeout(resolve, 200));

      const empDataUrl = await toPng(empElement, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        filter: filter,
      });

      empElement.classList.remove('export-mode');

      const empImgProps = pdf.getImageProperties(empDataUrl);
      const empImgHeight = (empImgProps.height * imgWidth) / empImgProps.width;

      pdf.addPage();
      pdf.addImage(empDataUrl, 'PNG', margin, margin, imgWidth, empImgHeight);
    }

    pdf.save(`تقرير_إغلاق_${dayLabel}_${date}.pdf`);
  } catch (error) {
    const cashEl = document.getElementById('cash-report-export');
    if (cashEl) cashEl.classList.remove('export-mode');
    const empEl = document.getElementById('employee-report-export');
    if (empEl) empEl.classList.remove('export-mode');
    console.error('Error exporting PDF:', error);
    window.print();
  }
};

export type ExportImageTarget = 'both' | 'cash' | 'employees';

export const exportToImage = async (date: string, target: ExportImageTarget = 'both') => {
  const dayLabel = getDayLabel(date);

  const filter = (node: HTMLElement) => {
    // Exclude elements with data-html2canvas-ignore or print:hidden
    if (node?.hasAttribute && node.hasAttribute('data-html2canvas-ignore')) {
      return false;
    }
    if (node?.classList && typeof node.classList.contains === 'function' && node.classList.contains('print:hidden')) {
      return false;
    }
    return true;
  };

  const captureElement = async (elementId: string, fallbackId: string, filename: string) => {
    const element = document.getElementById(elementId) || document.getElementById(fallbackId);
    if (!element) {
      console.warn(`Element with ID '${elementId}' or '${fallbackId}' not found for export.`);
      return;
    }

    try {
      element.classList.add('export-mode');
      // Allow browser to apply styles before rendering
      await new Promise(resolve => setTimeout(resolve, 250));

      const dataUrl = await toPng(element, {
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        filter: filter,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          margin: '0'
        }
      });

      element.classList.remove('export-mode');

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      element.classList.remove('export-mode');
      console.error(`Error exporting image (${filename}):`, error);
      throw error;
    }
  };

  // 1. Export Cash Closing Table Image
  if (target === 'cash' || target === 'both') {
    const cashFilename = `إغلاق كشف إغلاق تقرير الكاش اليومي في ${date} ${dayLabel}.png`;
    await captureElement('cash-report-export', 'cash-report-content', cashFilename);
  }

  // Small delay between downloads so the browser can trigger both downloads reliably
  if (target === 'both') {
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 2. Export Employee Advances & Attendance Table Image
  if (target === 'employees' || target === 'both') {
    const empFilename = `إغلاق تقرير الموظفين اليومي في ${date} ${dayLabel}.png`;
    await captureElement('employee-report-export', 'employeeAdvances', empFilename);
  }
};
