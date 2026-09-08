import ExcelJS from 'exceljs';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
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


export type ExportImageTarget = 'both' | 'cash' | 'employees';


const EXPORT_FILTER = (node: HTMLElement) => {
  const exclusionClasses = ['print:hidden', 'no-export', 'lucide'];
  if (node.classList && exclusionClasses.some(cls => node.classList.contains(cls))) {
    return false;
  }
  return true;
};

export const exportToImage = async (date: string, target: ExportImageTarget = 'both') => {
  const dayLabel = getDayLabel(date);
  
  const captureElementDataUrl = async (elementId: string): Promise<string | null> => {
    const element = document.getElementById(elementId);
    if (!element) return null;
    try {
      element.classList.add('export-mode');
      await new Promise(resolve => setTimeout(resolve, 300));
      const dataUrl = await toPng(element, {
        pixelRatio: 4,
        backgroundColor: '#ffffff',
        style: { transform: 'scale(1)', transformOrigin: 'top left', margin: '0' }
      });
      element.classList.remove('export-mode');
      return dataUrl;
    } catch (error) {
      element.classList.remove('export-mode');
      console.error(`Error capturing image (${elementId}):`, error);
      return null;
    }
  };

  const getCashPage = async (pageIdx: number): Promise<string | null> => {
    if (pageIdx === 1) {
      return (
        await captureElementDataUrl('export-a4-page-1') ||
        await captureElementDataUrl('export-a4-cash-1')
      );
    }
    return await captureElementDataUrl(`export-a4-cash-${pageIdx}`);
  };

  const getEmpPage = async (pageIdx: number): Promise<string | null> => {
    if (pageIdx === 1) {
      return (
        await captureElementDataUrl('export-a4-page-2') ||
        await captureElementDataUrl('export-a4-emp-1')
      );
    }
    return (
      await captureElementDataUrl(`export-a4-page-${pageIdx + 1}`) ||
      await captureElementDataUrl(`export-a4-emp-${pageIdx}`)
    );
  };

  if (target === 'cash') {
    const cashPages: { name: string; base64: string; dataUrl: string }[] = [];
    let finIndex = 1;
    while (true) {
      const pageDataUrl = await getCashPage(finIndex);
      if (!pageDataUrl) break;
      const base64 = pageDataUrl.replace(/^data:image\/png;base64,/, '');
      cashPages.push({
        name: `تقرير_إغلاق_الكاش_اليومي_صفحة_${finIndex}_${dayLabel}_${date}.png`,
        base64,
        dataUrl: pageDataUrl
      });
      finIndex++;
    }

    if (cashPages.length === 0) return;

    if (cashPages.length === 1) {
      const link = document.createElement('a');
      link.download = `تقرير_إغلاق_الكاش_اليومي_${dayLabel}_${date}.png`;
      link.href = cashPages[0].dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const zip = new JSZip();
      const folderName = `تقرير_إغلاق_الكاش_${dayLabel}_${date}`;
      const folder = zip.folder(folderName) || zip;
      cashPages.forEach((cp, idx) => {
        folder.file(`${idx + 1}_تقرير_إغلاق_الكاش_صفحة_${idx + 1}_${dayLabel}_${date}.png`, cp.base64, { base64: true });
      });
      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      const link = document.createElement('a');
      link.download = `تقرير_إغلاق_الكاش_${dayLabel}_${date}.zip`;
      link.href = URL.createObjectURL(zipBlob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(link.href), 1500);
    }
  } else if (target === 'employees') {
    const empPages: { name: string; base64: string; dataUrl: string }[] = [];
    let empIndex = 1;
    while (true) {
      const pageDataUrl = await getEmpPage(empIndex);
      if (!pageDataUrl) break;
      const base64 = pageDataUrl.replace(/^data:image\/png;base64,/, '');
      empPages.push({
        name: `تقرير_سلف_وحضور_الموظفين_صفحة_${empIndex}_${dayLabel}_${date}.png`,
        base64,
        dataUrl: pageDataUrl
      });
      empIndex++;
    }

    if (empPages.length === 0) return;

    if (empPages.length === 1) {
      const link = document.createElement('a');
      link.download = `تقرير_سلف_وحضور_الموظفين_${dayLabel}_${date}.png`;
      link.href = empPages[0].dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const zip = new JSZip();
      const folderName = `تقرير_سلف_وحضور_الموظفين_${dayLabel}_${date}`;
      const folder = zip.folder(folderName) || zip;
      empPages.forEach((ep, idx) => {
        folder.file(`${idx + 1}_تقرير_سلف_وحضور_الموظفين_صفحة_${idx + 1}_${dayLabel}_${date}.png`, ep.base64, { base64: true });
      });
      const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
      const link = document.createElement('a');
      link.download = `تقرير_سلف_وحضور_الموظفين_${dayLabel}_${date}.zip`;
      link.href = URL.createObjectURL(zipBlob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(link.href), 1500);
    }
  } else if (target === 'both') {
    const zip = new JSZip();
    const folderName = `تقرير_إغلاق_${dayLabel}_${date}`;
    const folder = zip.folder(folderName) || zip;
    
    let fileOrder = 1;

    // Financial pages
    let finIndex = 1;
    while (true) {
      const pageDataUrl = await getCashPage(finIndex);
      if (!pageDataUrl) break;
      const base64 = pageDataUrl.replace(/^data:image\/png;base64,/, '');
      folder.file(`${fileOrder}_تقرير_إغلاق_الكاش_اليومي_صفحة_${finIndex}_${dayLabel}_${date}.png`, base64, { base64: true });
      fileOrder++;
      finIndex++;
    }

    // Employee pages
    let empIndex = 1;
    while (true) {
      const pageDataUrl = await getEmpPage(empIndex);
      if (!pageDataUrl) break;
      const base64 = pageDataUrl.replace(/^data:image\/png;base64,/, '');
      folder.file(`${fileOrder}_تقرير_سلف_وحضور_الموظفين_صفحة_${empIndex}_${dayLabel}_${date}.png`, base64, { base64: true });
      fileOrder++;
      empIndex++;
    }

    if (fileOrder === 1) return;

    const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    const zipFilename = `تقرير_إغلاق_${dayLabel}_${date}.zip`;
    const link = document.createElement('a');
    link.download = zipFilename;
    link.href = URL.createObjectURL(zipBlob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(link.href), 1500);
  }
};

export const exportToPdf = async (date: string) => {
  const dayLabel = getDayLabel(date);
  
  const captureElementDataUrl = async (elementId: string): Promise<string | null> => {
    const element = document.getElementById(elementId);
    if (!element) return null;
    try {
      element.classList.add('export-mode');
      await new Promise(resolve => setTimeout(resolve, 300));
      const dataUrl = await toPng(element, {
        pixelRatio: 4,
        backgroundColor: '#ffffff',
        style: { transform: 'scale(1)', transformOrigin: 'top left', margin: '0' }
      });
      element.classList.remove('export-mode');
      return dataUrl;
    } catch (error) {
      element.classList.remove('export-mode');
      return null;
    }
  };

  const getCashPage = async (pageIdx: number): Promise<string | null> => {
    if (pageIdx === 1) {
      return (
        await captureElementDataUrl('export-a4-page-1') ||
        await captureElementDataUrl('export-a4-cash-1')
      );
    }
    return await captureElementDataUrl(`export-a4-cash-${pageIdx}`);
  };

  const getEmpPage = async (pageIdx: number): Promise<string | null> => {
    if (pageIdx === 1) {
      return (
        await captureElementDataUrl('export-a4-page-2') ||
        await captureElementDataUrl('export-a4-emp-1')
      );
    }
    return (
      await captureElementDataUrl(`export-a4-page-${pageIdx + 1}`) ||
      await captureElementDataUrl(`export-a4-emp-${pageIdx}`)
    );
  };

  // Dimensions: A4 Landscape: 297mm x 210mm
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidthMm = 297;
  const pageHeightMm = 210;
  let isFirstPage = true;

  const appendPageToPdf = (pageDataUrl: string) => {
    if (!isFirstPage) {
      pdf.addPage('a4', 'landscape');
    }
    const imgProps = pdf.getImageProperties(pageDataUrl);
    const aspect = imgProps.height / imgProps.width;
    const calculatedHeightMm = pageWidthMm * aspect;

    if (calculatedHeightMm <= pageHeightMm + 2) {
      pdf.addImage(pageDataUrl, 'PNG', 0, 0, pageWidthMm, Math.min(calculatedHeightMm, pageHeightMm), undefined, 'FAST');
    } else if (calculatedHeightMm <= 235) {
      pdf.addImage(pageDataUrl, 'PNG', 0, 0, pageWidthMm, pageHeightMm, undefined, 'FAST');
    } else {
      let remaining = calculatedHeightMm;
      let pos = 0;
      let isFirstSlice = true;
      while (remaining > 0) {
        if (!isFirstSlice) pdf.addPage('a4', 'landscape');
        pdf.addImage(pageDataUrl, 'PNG', 0, pos, pageWidthMm, calculatedHeightMm, undefined, 'FAST');
        remaining -= pageHeightMm;
        pos -= pageHeightMm;
        isFirstSlice = false;
      }
    }
    isFirstPage = false;
  };

  // Render all Cash pages
  let finIndex = 1;
  while (true) {
    const pageDataUrl = await getCashPage(finIndex);
    if (!pageDataUrl) break;
    appendPageToPdf(pageDataUrl);
    finIndex++;
  }

  // Render all Employee pages
  let empIndex = 1;
  while (true) {
    const pageDataUrl = await getEmpPage(empIndex);
    if (!pageDataUrl) break;
    appendPageToPdf(pageDataUrl);
    empIndex++;
  }

  pdf.save(`تقرير_إغلاق_${dayLabel}_${date}.pdf`);
};

export const printDocument = () => {
  window.print();
};
