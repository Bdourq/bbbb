import React, { useState, useEffect } from 'react';
import { Camera } from 'lucide-react';

export const LogoUpload = () => {
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    const savedLogo = localStorage.getItem('app-logo');
    if (savedLogo) {
      setLogo(savedLogo);
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLogo(base64String);
        localStorage.setItem('app-logo', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogo(null);
    localStorage.removeItem('app-logo');
  };

  return (
    <div className="relative group w-24 h-24 sm:w-32 sm:h-32 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden flex-shrink-0 print:border-none print:bg-transparent">
      {logo ? (
        <>
          <img src={logo} alt="Logo" className="w-full h-full object-contain p-2" />
          <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center print:hidden" data-html2canvas-ignore="true">
            <button 
              onClick={removeLogo}
              className="text-white text-xs bg-red-500 px-2 py-1 rounded"
            >
              حذف
            </button>
          </div>
        </>
      ) : (
        <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-gray-600 print:hidden" data-html2canvas-ignore="true">
          <Camera size={24} className="mb-1" />
          <span className="text-xs text-center px-1">أضف الشعار</span>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImageUpload} 
            className="hidden" 
          />
        </label>
      )}
    </div>
  );
};
