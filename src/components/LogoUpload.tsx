import React from 'react';
import fixedLogo from '../assets/logo.jpeg';

export const LogoUpload = () => {
  return (
    <div className="relative w-24 h-24 sm:w-32 sm:h-32 bg-black rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm print:border-none print:bg-black">
      <img src={fixedLogo} alt="شعار يحيى البيك" className="w-full h-full object-contain p-0.5" />
    </div>
  );
};


