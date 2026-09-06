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
    { 'البيان': 'اسم الكاشير', 'القيمة': data.cashierName || '-' },
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
      'البيان': 'نقص الكاش' + (calc.cashShortage > 0 && data.cashierName ? ` (${data.cashierName})` : ''), 
      'القيمة': calc.cashShortage ? -calc.cashShortage : 0 
    },
    { 
      'البيان': 'زيادة الكاش' + (calc.cashSurplus > 0 && data.cashierName ? ` (${data.cashierName})` : ''), 
      'القيمة': calc.cashSurplus 
    },
    { 'البيان': '', 'القيمة': '' },
    { 'البيان': '--- توقيع وتذييل التقرير ---', 'القيمة': '' },
    { 'البيان': 'الكاشير المسؤول', 'القيمة': data.cashierName || '-' },
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

export const exportToPdf = async (date: string) => {
  const element = document.getElementById('report-content');
  if (!element) return;

  try {
    element.classList.add('export-mode');
    await new Promise(resolve => setTimeout(resolve, 200));

    const filter = (node: HTMLElement) => {
      if (node?.hasAttribute && node.hasAttribute('data-html2canvas-ignore')) return false;
      if (node?.classList && typeof node.classList.contains === 'function' && node.classList.contains('print:hidden')) return false;
      return true;
    };

    const dataUrl = await toPng(element, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      filter: filter,
    });

    element.classList.remove('export-mode');

    // Create jsPDF instance in A4 Landscape orientation (297mm x 210mm)
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const imgProps = pdf.getImageProperties(dataUrl);
    const pdfWidth = pdf.internal.pageSize.getWidth(); // 297mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 210mm

    const margin = 6;
    const imgWidth = pdfWidth - (margin * 2); // 285mm
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(dataUrl, 'PNG', margin, position, imgWidth, imgHeight);
    heightLeft -= (pdfHeight - (margin * 2));

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      pdf.addPage();
      pdf.addImage(dataUrl, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - (margin * 2));
    }

    pdf.save(`تقرير_إغلاق_${date}.pdf`);
  } catch (error) {
    element.classList.remove('export-mode');
    console.error('Error exporting PDF:', error);
    window.print();
  }
};

export const exportToImage = async (date: string) => {
  const mainElement = document.getElementById('report-content');
  const employeeElement = document.getElementById('employeeAdvances');
  if (!mainElement) return;
  
  try {
    mainElement.classList.add('export-mode');
    if (employeeElement) employeeElement.classList.add('export-mode');
    
    // Allow browser to apply styles before rendering
    await new Promise(resolve => setTimeout(resolve, 200));

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

    // 1. Export Main Tables Image (High Clarity)
    const mainDataUrl = await toPng(mainElement, {
      pixelRatio: 3,
      backgroundColor: '#ffffff',
      filter: filter,
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left'
      }
    });
    
    const link1 = document.createElement('a');
    link1.download = `اغلاق_كاش_${date}.png`;
    link1.href = mainDataUrl;
    link1.click();

    // 2. Export Employee Advances Table Image Separately (High Clarity)
    if (employeeElement) {
      await new Promise(resolve => setTimeout(resolve, 400));
      const employeeDataUrl = await toPng(employeeElement, {
        pixelRatio: 3,
        backgroundColor: '#ffffff',
        filter: filter,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });

      const link2 = document.createElement('a');
      link2.download = `اغلاق_جدول_الموظفين_${date}.png`;
      link2.href = employeeDataUrl;
      link2.click();
    }
    
    mainElement.classList.remove('export-mode');
    if (employeeElement) employeeElement.classList.remove('export-mode');
  } catch (error) {
    mainElement.classList.remove('export-mode');
    if (employeeElement) employeeElement.classList.remove('export-mode');
    console.error('Error exporting image:', error);
    throw error;
  }
};
