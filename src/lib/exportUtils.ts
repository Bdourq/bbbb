import ExcelJS from 'exceljs';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { ShiftData } from '../store/useShiftStore';
import restaurantLogo from '../assets/logo.jpeg';

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

import { loadClosingReportTemplateBuffer, populateClosingReport } from './excelTemplate';

export const exportToExcel = async (data: ShiftData, calc: any) => {
  // 1. Load the original template file (public/templates/closing-report-template.xlsx)
  const templateBuffer = await loadClosingReportTemplateBuffer();

  // 2. Populate values into the exact template cells preserving all layout and styling
  const { buffer } = await populateClosingReport(templateBuffer, data, calc);

  // 3. Download the populated template file with standard naming convention
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `تقرير_إغلاق_الكاش_${data.date}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

export const printDocument = () => {
  window.print();
};

export type ExportImageTarget = 'both' | 'cash' | 'employees';

const EXPORT_FILTER = (node: HTMLElement) => {
  if (node?.hasAttribute && node.hasAttribute('data-html2canvas-ignore')) {
    return false;
  }
  if (node?.classList && typeof node.classList.contains === 'function') {
    if (node.classList.contains('print:hidden') || node.classList.contains('no-print')) {
      return false;
    }
  }
  return true;
};

export const exportToImage = async (date: string, target: ExportImageTarget = 'both') => {
  const dayLabel = getDayLabel(date);

  const captureElement = async (elementId: string, fallbackId: string, filename: string) => {
    const element = document.getElementById(elementId) || document.getElementById(fallbackId);
    if (!element) {
      console.warn(`Element with ID '${elementId}' or '${fallbackId}' not found for export.`);
      return;
    }

    try {
      element.classList.add('export-mode');
      await new Promise(resolve => setTimeout(resolve, 300));

      // High-resolution 300 DPI capture
      const dataUrl = await toPng(element, {
        pixelRatio: 3,
        backgroundColor: '#ffffff',
        filter: EXPORT_FILTER,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          margin: '0',
          boxSizing: 'border-box'
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

  if (target === 'cash' || target === 'both') {
    const cashFilename = `إغلاق كشف إغلاق تقرير الكاش اليومي في ${date} ${dayLabel}.png`;
    await captureElement('cash-report-export', 'cash-report-content', cashFilename);
  }

  if (target === 'both') {
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  if (target === 'employees' || target === 'both') {
    const empFilename = `إغلاق تقرير الموظفين اليومي في ${date} ${dayLabel}.png`;
    await captureElement('employee-report-export', 'employeeAdvances', empFilename);
  }
};

// -------------------------------------------------------------
// MULTI-PAGE PDF EXPORT (ROW-SAFE PAGINATION + HEADERS & FOOTERS)
// -------------------------------------------------------------
async function sliceElementAtRowBoundaries(
  contentEl: HTMLElement,
  maxSliceHeightPx: number,
  pixelRatio = 2.5
): Promise<string[]> {
  const containerRect = contentEl.getBoundingClientRect();
  const breakElements = Array.from(contentEl.querySelectorAll('tr, .card-container'));

  const boundariesSet = new Set<number>();
  breakElements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.height > 0 && (el as HTMLElement).offsetParent !== null) {
      const bottom = Math.round(rect.bottom - containerRect.top);
      if (bottom > 0) {
        boundariesSet.add(bottom);
      }
    }
  });

  const splitPoints = Array.from(boundariesSet).sort((a, b) => a - b);

  const fullDataUrl = await toPng(contentEl, {
    pixelRatio: pixelRatio,
    backgroundColor: '#ffffff',
    filter: EXPORT_FILTER,
  });

  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = fullDataUrl;
  });

  const fullWidth = img.width;
  const fullHeight = img.height;
  const scale = fullWidth / contentEl.offsetWidth;
  const canvasSplits = splitPoints.map(p => Math.round(p * scale));

  const sliceDataUrls: string[] = [];
  let currentY = 0;

  while (currentY < fullHeight - 10) {
    const remainingHeight = fullHeight - currentY;
    if (remainingHeight <= maxSliceHeightPx) {
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = fullWidth;
      sliceCanvas.height = remainingHeight;
      const ctx = sliceCanvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, fullWidth, remainingHeight);
      ctx.drawImage(img, 0, currentY, fullWidth, remainingHeight, 0, 0, fullWidth, remainingHeight);
      sliceDataUrls.push(sliceCanvas.toDataURL('image/png'));
      break;
    }

    const targetY = currentY + maxSliceHeightPx;
    // Find highest split point between 40% and 100% of maxSliceHeightPx
    const candidateSplits = canvasSplits.filter(p => p > currentY + (maxSliceHeightPx * 0.4) && p <= targetY);

    let splitY = targetY;
    if (candidateSplits.length > 0) {
      splitY = candidateSplits[candidateSplits.length - 1];
    }

    const sliceHeight = splitY - currentY;
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = fullWidth;
    sliceCanvas.height = sliceHeight;
    const ctx = sliceCanvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, fullWidth, sliceHeight);
    ctx.drawImage(img, 0, currentY, fullWidth, sliceHeight, 0, 0, fullWidth, sliceHeight);
    sliceDataUrls.push(sliceCanvas.toDataURL('image/png'));

    currentY = splitY;
  }

  return sliceDataUrls;
}

export const exportToPdf = async (date: string) => {
  const dayLabel = getDayLabel(date);
  const cashContainer = document.getElementById('cash-report-export');
  const empContainer = document.getElementById('employee-report-export');
  const cashContent = document.getElementById('cash-report-content') || cashContainer;
  const empContent = document.getElementById('employeeAdvances') || empContainer;

  if (!cashContainer) return;

  try {
    // 1. Prepare export mode on both containers
    cashContainer.classList.add('export-mode');
    if (empContainer) empContainer.classList.add('export-mode');
    await new Promise(resolve => setTimeout(resolve, 300));

    // Dimensions: A4 Landscape: 297mm x 210mm
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidthMm = 297;
    const pageHeightMm = 210;
    const marginX = 8;
    const contentWidthMm = pageWidthMm - (marginX * 2); // 281mm

    // Reserved vertical space:
    // Header at top (y=6, height ~24mm)
    // No signature footer at bottom as requested, maximizing table visibility
    // Available middle height for table slice: 210 - 6 - 25 - 5 = 174mm
    const availableMiddleHeightMm = 174;
    const contentWidthPx = (cashContent as HTMLElement).offsetWidth || 1040;
    const maxSliceHeightPx = Math.round((availableMiddleHeightMm / contentWidthMm) * contentWidthPx * 2.5);

    // 2. Slice cash content safely without breaking rows
    const cashSlices = await sliceElementAtRowBoundaries(cashContent as HTMLElement, maxSliceHeightPx, 2.5);

    // 3. Slice employee content safely if present
    let empSlices: string[] = [];
    if (empContainer && empContent) {
      empSlices = await sliceElementAtRowBoundaries(empContent as HTMLElement, maxSliceHeightPx, 2.5);
    }

    const totalPages = cashSlices.length + empSlices.length;

    // Helper to capture a header or footer element
    const captureBlock = async (el: HTMLElement) => {
      const dataUrl = await toPng(el, {
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        filter: EXPORT_FILTER,
      });
      const img = new Image();
      await new Promise(res => { img.onload = res; img.src = dataUrl; });
      const heightMm = (img.height * contentWidthMm) / img.width;
      return { dataUrl, heightMm };
    };

    const cashHeaderEl = document.getElementById('export-header-cash') || cashContainer.querySelector('.export-header') as HTMLElement;
    const empHeaderEl = document.getElementById('export-header-employee') || empContainer?.querySelector('.export-header') as HTMLElement;
    const cashFooterEl = document.getElementById('export-footer-cash') || cashContainer.querySelector('.export-footer') as HTMLElement;
    const empFooterEl = document.getElementById('export-footer-employee') || empContainer?.querySelector('.export-footer') as HTMLElement;

    let currentPage = 1;

    // 4. Render Cash Slices
    for (let i = 0; i < cashSlices.length; i++) {
      if (currentPage > 1) {
        pdf.addPage();
      }

      // Draw Header
      let headerHeight = 22;
      if (cashHeaderEl) {
        const h = await captureBlock(cashHeaderEl);
        headerHeight = Math.min(h.heightMm, 25);
        pdf.addImage(h.dataUrl, 'PNG', marginX, 6, contentWidthMm, headerHeight);
      }

      // Draw Content Slice
      const sliceImg = new Image();
      await new Promise(res => { sliceImg.onload = res; sliceImg.src = cashSlices[i]; });
      const sliceHeightMm = (sliceImg.height * contentWidthMm) / sliceImg.width;
      const sliceY = 6 + headerHeight + 2;
      pdf.addImage(cashSlices[i], 'PNG', marginX, sliceY, contentWidthMm, sliceHeightMm);

      // Draw Footer on last cash slice or all pages
      if (cashFooterEl && (i === cashSlices.length - 1)) {
        const f = await captureBlock(cashFooterEl);
        const footerY = Math.min(sliceY + sliceHeightMm + 2, pageHeightMm - f.heightMm - 4);
        pdf.addImage(f.dataUrl, 'PNG', marginX, footerY, contentWidthMm, f.heightMm);
      }

      currentPage++;
    }

    // 5. Render Employee Slices
    for (let i = 0; i < empSlices.length; i++) {
      pdf.addPage();

      // Draw Header
      let headerHeight = 22;
      if (empHeaderEl) {
        const h = await captureBlock(empHeaderEl);
        headerHeight = Math.min(h.heightMm, 25);
        pdf.addImage(h.dataUrl, 'PNG', marginX, 6, contentWidthMm, headerHeight);
      }

      // Draw Content Slice
      const sliceImg = new Image();
      await new Promise(res => { sliceImg.onload = res; sliceImg.src = empSlices[i]; });
      const sliceHeightMm = (sliceImg.height * contentWidthMm) / sliceImg.width;
      const sliceY = 6 + headerHeight + 2;
      pdf.addImage(empSlices[i], 'PNG', marginX, sliceY, contentWidthMm, sliceHeightMm);

      // Draw Footer on last employee slice
      if (empFooterEl && (i === empSlices.length - 1)) {
        const f = await captureBlock(empFooterEl);
        const footerY = Math.min(sliceY + sliceHeightMm + 2, pageHeightMm - f.heightMm - 4);
        pdf.addImage(f.dataUrl, 'PNG', marginX, footerY, contentWidthMm, f.heightMm);
      }

      currentPage++;
    }

    // 6. Cleanup export mode
    cashContainer.classList.remove('export-mode');
    if (empContainer) empContainer.classList.remove('export-mode');

    // Remove any temp badges added
    document.querySelectorAll('.pdf-page-number').forEach(el => el.remove());

    pdf.save(`تقرير_إغلاق_الكاش_${dayLabel}_${date}.pdf`);
  } catch (error) {
    if (cashContainer) cashContainer.classList.remove('export-mode');
    if (empContainer) empContainer.classList.remove('export-mode');
    document.querySelectorAll('.pdf-page-number').forEach(el => el.remove());
    console.error('Error exporting PDF:', error);
    throw error;
  }
};
