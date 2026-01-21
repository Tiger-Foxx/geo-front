import { useState, useMemo, useEffect } from 'react';
import { REGIONS_DEPARTMENTS, CROPS, generateMockData } from '../data/mockData';
import { ArrowUpRight, ArrowDownRight, ArrowRight, Download, Filter, BarChart3, MapPin, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const TabularView = () => {
  const [selectedRegion, setSelectedRegion] = useState('Centre');
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(CROPS[0]);
  const [pivotMode, setPivotMode] = useState<'years-rows' | 'dept-rows'>('years-rows');
  
  const data = useMemo(() => generateMockData(), []);
  const departments = REGIONS_DEPARTMENTS[selectedRegion] || [];
  const years = Array.from({ length: 6 }, (_, i) => 2017 + i); // 2017-2022
  
  const rows = pivotMode === 'years-rows' ? years : departments;
  const cols = pivotMode === 'years-rows' ? departments : years;


  // Helper to get formatted value and fake trend
  const getCellData = (dept: string, year: number) => {
    const record = data.find(d => d.department === dept && d.season_year === year && d.product === selectedProduct);
    const val = record?.value;
    const status = record?.status || 'missing';
    
    // Fake trend logic for demo (only if current val exists)
    const prevRecord = data.find(d => d.department === dept && d.season_year === year - 1 && d.product === selectedProduct);
    const prevYearVal = prevRecord?.value;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let percent = 0;

    if (val && prevYearVal) {
        trend = val > prevYearVal ? 'up' : val < prevYearVal ? 'down' : 'stable';
        percent = ((val - prevYearVal) / prevYearVal) * 100;
    }
    
    return { val, status, trend, percent };
  };

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.region-selector-trigger') && !target.closest('.region-dropdown-content')) {
        setIsRegionDropdownOpen(false);
      }
    };
    if (isRegionDropdownOpen) {
        document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isRegionDropdownOpen]);

  return (
    <div className="h-full w-full bg-slate-50 dark:bg-[#050505] p-3 md:p-6 md:pl-[88px] pt-16 md:pt-6 flex flex-col overflow-hidden">
       <div className="w-full h-full flex flex-col space-y-4 max-w-[1600px] mx-auto">
        
        {/* Magic Toolbar - Simplified Shadows */}
        <header className="relative z-[500] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-sm shrink-0">
          <div>
            <div className="flex items-center gap-2 md:gap-3 mb-1">
                <div className="p-1.5 md:p-2 bg-cameroon-green/10 rounded-lg text-cameroon-green">
                    <BarChart3 size={18} className="md:w-[20px] md:h-[20px]" />
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Matrice Économique</h1>
            </div>
            <p className="text-slate-500 dark:text-neutral-400 text-xs md:text-sm pl-8 md:pl-12 font-medium">Analyse croisée des volumes par bassin</p>
          </div>
          
          <div className="flex flex-wrap gap-2 md:gap-3 items-center w-full md:w-auto">
             <div className="flex bg-slate-100 dark:bg-neutral-900 p-1 rounded-xl border border-slate-200 dark:border-white/5">
                <button 
                    onClick={() => setPivotMode('years-rows')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${pivotMode === 'years-rows' ? 'bg-white dark:bg-neutral-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-neutral-500 dark:hover:text-neutral-300'}`}
                >
                    Années
                </button>
                 <button 
                    onClick={() => setPivotMode('dept-rows')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${pivotMode === 'dept-rows' ? 'bg-white dark:bg-neutral-800 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-neutral-500 dark:hover:text-neutral-300'}`}
                >
                    Départements
                </button>
             </div>

             <div className="h-6 w-px bg-slate-200 dark:bg-neutral-800 mx-1 md:mx-2" />

             {/* Custom Region Selector */}
             <div className="relative z-50 flex-1 md:flex-none w-full md:w-auto">
                <button
                    onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                    className={`region-selector-trigger w-full md:w-auto flex items-center gap-2 md:gap-3 bg-white dark:bg-neutral-900 border shadow-sm rounded-xl px-3 md:px-4 py-2 text-xs md:text-sm font-semibold transition-all outline-none ${
                        isRegionDropdownOpen 
                        ? 'border-cameroon-green ring-2 ring-cameroon-green/10 text-cameroon-green' 
                        : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-neutral-200 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-neutral-800'
                    }`}
                >
                    <div className={`p-1 rounded-md transition-colors ${isRegionDropdownOpen ? 'bg-cameroon-green text-white' : 'bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-neutral-400'}`}>
                        <MapPin size={14} />
                    </div>
                    <span>{selectedRegion}</span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isRegionDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                    {isRegionDropdownOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="region-dropdown-content absolute top-full mt-2 left-0 w-64 max-h-[400px] overflow-y-auto custom-scrollbar bg-white dark:bg-[#111] border border-slate-100 dark:border-white/10 shadow-2xl rounded-xl p-1.5 flex flex-col gap-0.5 z-[999]"
                        >
                            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest border-b border-slate-50 dark:border-white/5 mb-1">
                                Bassins de Production
                            </div>
                            {Object.keys(REGIONS_DEPARTMENTS).map(r => (
                                <button
                                    key={r}
                                    onClick={() => {
                                        setSelectedRegion(r);
                                        setIsRegionDropdownOpen(false);
                                    }}
                                    className={`relative text-left px-3 py-2 text-sm font-medium rounded-lg transition-all flex items-center justify-between group ${
                                        selectedRegion === r 
                                        ? 'bg-cameroon-green/10 text-cameroon-green' 
                                        : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-neutral-300'
                                    }`}
                                >
                                    <span>{r}</span>
                                    {selectedRegion === r && <div className="w-1.5 h-1.5 rounded-full bg-cameroon-green" />}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
             </div>
             
             <div className="relative group flex-1 md:flex-none w-full md:w-auto">
                <select 
                value={selectedProduct} 
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full appearance-none bg-cameroon-green text-white border-none shadow-md shadow-cameroon-green/20 rounded-xl px-3 md:px-4 py-2 pr-8 text-xs md:text-sm font-medium outline-none cursor-pointer hover:bg-green-700 transition-colors"
                >
                {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none" />
             </div>

             <button className="p-2 text-slate-400 dark:text-neutral-500 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-white dark:hover:bg-neutral-800 border border-transparent hover:border-slate-200 dark:hover:border-white/10 rounded-xl transition-all" title="Exporter CSV">
                 <Download size={18} className="md:w-[20px] md:h-[20px]" />
             </button>
          </div>
        </header>

        {/* The Pivot Table - Clean & Flat */}
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 overflow-hidden bg-white dark:bg-[#0A0A0A] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm relative flex flex-col"
        >
          <div className="absolute inset-0 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 z-20 bg-slate-50/95 dark:bg-[#111]/95 backdrop-blur-md">
                <tr>
                   <th className="p-4 font-bold text-slate-400 dark:text-neutral-500 text-[11px] w-32 uppercase tracking-widest sticky left-0 z-30 bg-slate-50 dark:bg-[#111] border-b border-r border-slate-200 dark:border-white/5 shadow-[4px_0_24px_-2px_rgba(0,0,0,0.02)]">
                    {pivotMode === 'years-rows' ? 'Période' : 'Zone Admin.'}
                  </th>
                  {cols.map((col) => (
                    <th key={col} className="p-3 font-semibold text-slate-600 dark:text-neutral-400 text-[11px] uppercase tracking-wider text-center border-b border-l border-slate-100 dark:border-white/5 min-w-[100px]">
                        {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/[0.02]">
                {rows.map((row) => (
                  <tr key={row} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-bold text-slate-700 dark:text-neutral-300 sticky left-0 z-10 bg-white dark:bg-[#0A0A0A] group-hover:bg-slate-50 dark:group-hover:bg-[#0D0D0D] transition-colors border-r border-slate-100 dark:border-white/5 text-sm shadow-[4px_0_16px_-4px_rgba(0,0,0,0.02)]">
                        {row}
                    </td>
                    {cols.map((col) => {
                      const dept = pivotMode === 'years-rows' ? col as string : row as string;
                      const year = pivotMode === 'years-rows' ? row as number : col as number;
                      const { val, status, trend, percent } = getCellData(dept, year);

                      return (
                        <td key={col} className={`p-3 border-l border-slate-50 dark:border-white/[0.02] text-center relative ${status === 'missing' ? 'bg-slate-50/30 diagonal-stripes' : ''}`}>
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            {status === 'missing' || val === null || val === undefined ? (
                                <span className="text-[10px] font-medium text-slate-300 dark:text-neutral-700 uppercase tracking-wider text-[0.65rem]">Non dispo.</span>
                            ) : (
                                <>
                                    <span className={`text-sm font-medium tabular-nums tracking-tight ${status === 'estimated' ? 'text-cameroon-yellow' : 'text-slate-700 dark:text-neutral-300'}`}>
                                        {val.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        {status === 'estimated' && '*'}
                                    </span>
                                    
                                    {trend !== 'stable' && (
                                        <div className={`flex items-center text-[10px] font-medium gap-0.5 ${
                                            trend === 'up' ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-500 dark:text-rose-500'
                                        }`}>
                                            {trend === 'up' ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                            <span>{Math.abs(percent).toFixed(1)}%</span>
                                        </div>
                                    )}
                                </>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

