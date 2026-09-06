const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const headerStart = code.indexOf('<header');
const headerEnd = code.indexOf('</header>') + '</header>'.length;

const newHeader = `        <header className="bg-white p-6 rounded-xl shadow-sm border mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative">
          {isReadOnly && (
            <div className="absolute top-0 right-0 left-0 bottom-0 pointer-events-none rounded-xl bg-gray-50/20 border-2 border-amber-400/50 flex items-center justify-center z-0 overflow-hidden print:hidden"> 
              <span className="text-5xl md:text-7xl font-black text-amber-500/20 transform -rotate-12 whitespace-nowrap">للقراءة فقط - التقرير مغلق</span>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row w-full justify-between gap-6 z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  data-html2canvas-ignore="true"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors print:hidden"
                  title="التقارير السابقة"
                >
                  <Menu size={24} />
                </button>
                <LogoUpload />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-800">مطعم يحيى البيك - تقرير إغلاق الكاش اليومي</h1>
                  {/* Auto-save Indicator */}
                  <div className="print:hidden h-6 flex items-center" data-html2canvas-ignore="true">
                    {syncStatus === 'syncing' && (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full animate-pulse border border-indigo-100">
                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" />
                        جاري الحفظ...
                      </span>
                    )}
                    {syncStatus === 'synced' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50/50 px-2.5 py-1 rounded-full border border-emerald-100/50 transition-all duration-500">
                        <CheckCircle2 size={12} />
                        تم الحفظ
                      </span>
                    )}
                  </div>
                </div>
                {isLockedByAge && (
                  <span className="text-xs font-bold text-slate-500 mt-1 print:hidden flex items-center gap-1">
                    <Lock size={12} />
                    مؤرشف (مضى عليه أكثر من 3 أيام - غير قابل للتعديل)
                  </span>
                )}
                {!isLockedByAge && data.isClosed && (
                  <span className="text-xs font-bold text-amber-600 mt-1 print:hidden flex items-center gap-1">
                    <Lock size={12} />
                    مغلق (متاح لإعادة الفتح والتعديل لأنه ضمن مهلة 3 أيام)
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* 1. Day of Week Dropdown */}
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border print:border-none print:p-0">
                <span className="text-gray-500 font-medium text-xs sm:text-sm">اليوم:</span>
                <select
                  disabled={isReadOnly}
                  value={new Date(data.date).getDay()}
                  onChange={(e) => handleDaySelect(Number(e.target.value))}
                  className="bg-transparent font-bold text-gray-800 text-xs sm:text-sm outline-none cursor-pointer disabled:cursor-default"
                >
                  {weekdays.map((w) => (
                    <option key={w.value} value={w.value} className="text-gray-900 bg-white">
                      {w.label}
                    </option>
                  ))}
                </select>
              </div>
              {/* 2. Date Picker */}
              <div className="flex items-center gap-1.5">
                <label className="text-xs sm:text-sm text-gray-600 font-medium">التاريخ:</label>
                <input 
                  type="date" 
                  lang="en-US"
                  dir="ltr"
                  value={data.date}
                  disabled={isReadOnly}
                  onChange={(e) => setShiftDate(e.target.value)}
                  className="px-2.5 py-1.5 border rounded-lg text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium print:font-bold print:border-none print:p-0"
                />
              </div>
              {/* 3. Opening Cash (Header Direct Input) */}
              <div className="flex items-center gap-1.5">
                <label className="text-xs sm:text-sm text-gray-600 font-medium">النقد الافتتاحي:</label>
                <div className="flex items-center gap-1">
                  <input 
                    type="number"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    dir="ltr"
                    disabled={isReadOnly}
                    value={data.cashAndSales.openingCash || ''}
                    onFocus={(e) => e.target.select()}
                    onWheel={(e) => e.currentTarget.blur()}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      updateData(['cashAndSales', 'openingCash'], val);
                      if (errors['cashData']) {
                        clearError('cashData');
                      }
                    }}
                    placeholder="0.00"
                    className="w-24 px-2.5 py-1.5 border rounded-lg text-xs sm:text-sm font-extrabold text-center text-indigo-900 bg-amber-50/50 border-amber-200 outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all print:font-bold print:border-none print:p-0"
                  />
                  {previousDayActualCash > 0 && (
                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => {
                        updateData(['cashAndSales', 'openingCash'], previousDayActualCash);
                        toast.success(\`تم اختيار النقد الافتتاحي (\${previousDayActualCash} د.أ) بناءً على النقد الفعلي لليوم السابق\`);
                      }}
                      className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-md text-[11px] font-bold transition-colors cursor-pointer print:hidden shrink-0"
                      title="انقر لتطبيق النقد الفعلي لاليوم السابق كـ نقد افتتاحي"
                    >
                      ⚡ السابق: {previousDayActualCash} د.أ
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>`;

code = code.substring(0, headerStart) + newHeader + code.substring(headerEnd);
fs.writeFileSync('src/App.tsx', code);
