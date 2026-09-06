import React from 'react';
import restaurantLogo from '../assets/logo.jpeg';

interface ExportHeaderProps {
  title: string;
  date: string;
  dayLabel: string;
  className?: string;
  id?: string;
}

export const ExportHeader: React.FC<ExportHeaderProps> = ({
  title,
  date,
  dayLabel,
  className = '',
  id,
}) => {
  return (
    <div
      id={id}
      className={`export-header mb-5 bg-[#ffffff] border-2 border-[#1e1b4b] rounded-2xl p-4 sm:p-5 shadow-none ${className}`}
      dir="rtl"
    >
      <div className="flex items-center gap-5">
        {/* Right side: High-resolution Restaurant Logo */}
        <div className="w-20 h-20 bg-black rounded-2xl border-2 border-amber-500 flex items-center justify-center overflow-hidden shrink-0 shadow-sm p-1">
          <img
            src={restaurantLogo}
            alt="شعار مطعم يحيى البيك"
            className="w-full h-full object-contain"
            crossOrigin="anonymous"
          />
        </div>

        {/* Title + Day & Date only */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black text-[#1e1b4b] tracking-tight leading-snug font-tajawal">
            {title}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-base sm:text-lg font-bold text-[#0f172a] font-tajawal">
            <span className="flex items-center gap-1.5">
              <span className="text-slate-500 font-bold">اليوم:</span>
              <strong className="text-[#1e1b4b] font-black">{dayLabel}</strong>
            </span>
            <span className="text-slate-300 font-normal">|</span>
            <span className="flex items-center gap-1.5">
              <span className="text-slate-500 font-bold">التاريخ:</span>
              <strong className="text-[#1e1b4b] font-black" dir="ltr">{date}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ExportFooterProps {
  date?: string;
  className?: string;
  id?: string;
}

export const ExportFooter: React.FC<ExportFooterProps> = ({
  className = '',
  id,
}) => {
  return (
    <div
      id={id}
      className={`export-footer mt-4 pt-2.5 border-t border-slate-200/90 flex flex-wrap items-center justify-between text-[11px] sm:text-xs text-slate-500 font-tajawal ${className}`}
      dir="rtl"
    >
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 inline-block"></span>
        <span className="font-semibold text-slate-700">نظام إدارة وإغلاق الكاش اليومي • مطعم يحيى البيك</span>
      </div>
      <div className="flex items-center gap-1.5 font-medium text-slate-500 mt-1 sm:mt-0" dir="ltr">
        <span>Engineered & Developed by</span>
        <span className="font-bold text-[#1e1b4b] bg-slate-100 px-2 py-0.5 rounded border border-slate-200/80">
          Eng. Qusai Albdour
        </span>
      </div>
    </div>
  );
};
