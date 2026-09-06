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
      className={`export-footer mt-5 pt-3.5 border-t border-slate-300 flex flex-row items-center justify-between text-xs sm:text-sm text-slate-600 font-tajawal bg-white w-full ${className}`}
      dir="rtl"
    >
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0"></span>
        <span className="font-bold text-slate-800 text-xs sm:text-sm">
          مطعم يحيى البيك • نظام إدارة وإغلاق الكاش اليومي
        </span>
      </div>
      <div className="flex items-center gap-1.5 font-medium text-slate-500 shrink-0" dir="ltr">
        <span className="text-xs sm:text-sm">Engineered & Developed by</span>
        <span className="font-extrabold text-[#1e1b4b] bg-slate-100 px-2.5 py-0.5 rounded border border-slate-300 text-xs sm:text-sm">
          Eng. Qusai Albdour
        </span>
      </div>
    </div>
  );
};
