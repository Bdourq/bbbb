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
  date: string;
  cashierName?: string;
  issueTimestamp?: string;
  pageNumber?: string;
  className?: string;
  id?: string;
}

export const ExportFooter: React.FC<ExportFooterProps> = () => {
  return null;
};
