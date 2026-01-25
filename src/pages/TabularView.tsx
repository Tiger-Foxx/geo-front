import { useState, useMemo, useEffect } from 'react';
import { REGIONS_DEPARTMENTS, generateMockData, AGRI_INDICATORS } from '../data/mockData';
import { ArrowUpRight, ArrowDownRight, Download, BarChart3, MapPin, ChevronDown, TrendingUp, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TabularViewProps {
  selectedProduct: string;
  activeTheme: 'agriculture' | 'elevage' | 'peche' | 'overview';
  years: number[];
  selectedIndicator?: string;
}

export const TabularView = ({ selectedProduct, activeTheme, years, selectedIndicator = 'Production' }: TabularViewProps) => {
  const [selectedRegion, setSelectedRegion] = useState('Centre');
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [pivotMode, setPivotMode] = useState<'years-rows' | 'dept-rows'>('years-rows');
  const [localIndicator, setLocalIndicator] = useState(selectedIndicator);
  
  // Sync local indicator with prop
  useEffect(() => {
    setLocalIndicator(selectedIndicator);
  }, [selectedIndicator]);
  
  const data = useMemo(() => generateMockData(), []);
  const departments = REGIONS_DEPARTMENTS[selectedRegion] || [];
  
  // Determine year range based on theme
  const defaultYears = useMemo(() => {
    if (activeTheme === 'agriculture') return Array.from({ length: 6 }, (_, i) => 2022 - i);
    if (activeTheme === 'elevage') return [2021, 2020];
    if (activeTheme === 'peche') return [2021];
    return Array.from({ length: 6 }, (_, i) => 2022 - i);
  }, [activeTheme]);
  
  const displayYears = years.length > 0 ? years : defaultYears;
  
  const rows = pivotMode === 'years-rows' ? displayYears : departments;
  const cols = pivotMode === 'years-rows' ? departments : displayYears;


  // Helper to get formatted value and fake trend
  const getCellData = (dept: string, year: number) => {
    const record = data.find(d => d.department === dept && d.season_year === year && d.product === selectedProduct && d.indicator === localIndicator);
    const val = record?.value;
    const status = record?.status || 'unavailable';
    const unit = record?.unit || 'tonnes';
    
    // Trend logic (compare with previous year)
    const prevRecord = data.find(d => d.department === dept && d.season_year === year - 1 && d.product === selectedProduct && d.indicator === localIndicator);
    const prevYearVal = prevRecord?.value;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let percent = 0;

    if (val && val > 0 && prevYearVal && prevYearVal > 0) {
        trend = val > prevYearVal ? 'up' : val < prevYearVal ? 'down' : 'stable';
        percent = ((val - prevYearVal) / prevYearVal) * 100;
    }
    
    return { val, status, trend, percent, unit };
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
    <div className="h-full w-full bg-white dark:bg-[#050505] p-0 md:p-6 md:pl-[88px] pt-16 md:pt-6 flex flex-col overflow-hidden font-sans">
       <div className="w-full h-full flex flex-col space-y-0 max-w-[1600px] mx-auto border-x border-slate-100 dark:border-white/5">
        
        {/* Header - Completely Flat, simple borders */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 p-6 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-[#050505] shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
                <div className="flex items-center justify-center w-8 h-8 bg-slate-100 dark:bg-white/5 rounded text-slate-900 dark:text-white">
                    <BarChart3 size={16} strokeWidth={2.5} />
                </div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Matrice Data</h1>
            </div>
            <p className="text-slate-500 dark:text-neutral-500 text-sm font-medium pl-11">Exploration brute par bassin et période</p>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center w-full md:w-auto">
             {/* Pivot Toggles - Flat Segmented Control */}
             <div className="flex p-0.5 rounded-lg border border-slate-200 dark:border-white/10">
                <button 
                    onClick={() => setPivotMode('years-rows')}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${pivotMode === 'years-rows' ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-neutral-500 dark:hover:text-neutral-300'}`}
                >
                    Par Années
                </button>
                 <button 
                    onClick={() => setPivotMode('dept-rows')}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${pivotMode === 'dept-rows' ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-neutral-500 dark:hover:text-neutral-300'}`}
                >
                    Par Départements
                </button>
             </div>

             <div className="h-8 w-px bg-slate-100 dark:bg-white/10 hidden md:block" />

             {/* Indicator Selector (Agriculture only) */}
             {activeTheme === 'agriculture' && (
               <div className="flex p-0.5 rounded-lg border border-slate-200 dark:border-white/10">
                  {AGRI_INDICATORS.map(ind => (
                      <button 
                          key={ind}
                          onClick={() => setLocalIndicator(ind)}
                          className={`px-3 py-1.5 text-[10px] font-semibold rounded-md transition-colors flex items-center gap-1 ${localIndicator === ind ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:text-neutral-500 dark:hover:text-neutral-300'}`}
                      >
                          {ind === 'Production' && <BarChart3 size={10} />}
                          {ind === 'Area Planted' && <Layers size={10} />}
                          {ind === 'Yield' && <TrendingUp size={10} />}
                          {ind === 'Production' ? 'Prod.' : ind === 'Area Planted' ? 'Surf.' : 'Rend.'}
                      </button>
                  ))}
               </div>
             )}

             <div className="h-8 w-px bg-slate-100 dark:bg-white/10 hidden md:block" />

             {/* Region Selector - Minimalist */}
             <div className="relative z-50 min-w-[200px]">
                <button
                    onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                    className="region-selector-trigger w-full flex items-center justify-between gap-3 bg-transparent border-b border-slate-200 dark:border-white/10 px-2 py-2 text-sm font-semibold transition-colors hover:border-slate-400 dark:hover:border-white/30 outline-none group"
                >
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                        <MapPin size={14} className="text-slate-400 dark:text-slate-600 group-hover:text-cameroon-green transition-colors" />
                        <span>{selectedRegion}</span>
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isRegionDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                    {isRegionDropdownOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.1 }}
                            className="region-dropdown-content absolute top-full mt-1 left-0 w-full max-h-[300px] overflow-y-auto custom-scrollbar bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-lg p-1 flex flex-col gap-0.5 z-100"
                        >
                            {Object.keys(REGIONS_DEPARTMENTS).map(r => (
                                <button
                                    key={r}
                                    onClick={() => {
                                        setSelectedRegion(r);
                                        setIsRegionDropdownOpen(false);
                                    }}
                                    className={`text-left px-3 py-2 text-xs font-medium rounded transition-colors ${
                                        selectedRegion === r 
                                        ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' 
                                        : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-neutral-400'
                                    }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
             </div>
             
             {/* Selected Product Display (Controlled by Sidebar) */}
             <div className="px-3 py-1.5 bg-cameroon-green/10 dark:bg-cameroon-green/20 border border-cameroon-green/20 rounded-lg">
                <span className="text-xs font-bold text-cameroon-green">{selectedProduct || 'Aucun produit'}</span>
             </div>

             <button className="ml-auto p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" title="Exporter CSV">
                 <Download size={18} strokeWidth={2} />
             </button>
          </div>
        </header>

        {/* The Pivot Table - Ultra Flat & Clean */}
        <div className="flex-1 overflow-hidden bg-white dark:bg-[#050505] relative flex flex-col">
          <div className="absolute inset-0 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 z-20 bg-white dark:bg-[#050505]">
                <tr>
                   <th className="p-4 font-semibold text-slate-500 dark:text-neutral-500 text-[11px] uppercase tracking-widest sticky left-0 z-30 bg-white dark:bg-[#050505] border-b border-r border-slate-200 dark:border-white/10 w-40">
                    {pivotMode === 'years-rows' ? 'Période' : 'Zone (Dép.)'}
                  </th>
                  {cols.map((col) => (
                    <th key={col} className="p-3 font-semibold text-slate-500 dark:text-neutral-500 text-[11px] uppercase tracking-widest text-center border-b border-r border-slate-100 dark:border-white/5 min-w-[120px] last:border-r-0">
                        {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {rows.map((row) => (
                  <tr key={row} className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 font-medium text-slate-900 dark:text-white sticky left-0 z-10 bg-white dark:bg-[#050505] group-hover:bg-slate-50 dark:group-hover:bg-[#0A0A0A] transition-colors border-r border-slate-200 dark:border-white/10 text-sm">
                        {row}
                    </td>
                    {cols.map((col) => {
                      const dept = pivotMode === 'years-rows' ? col as string : row as string;
                      const year = pivotMode === 'years-rows' ? row as number : col as number;
                      const { val, status, trend, percent } = getCellData(dept, year);
                      const maxValue = Math.max(...data.filter(d => d.product === selectedProduct).map(d => d.value || 0)) || 1;
                      const percentageOfMax = val ? (val / maxValue) * 100 : 0;

                      return (
                        <td key={col} className="p-3 border-r border-slate-100 dark:border-white/5 last:border-r-0 text-center relative h-[72px] group/cell hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                          {/* Magnitude Bar */}
                          {val && val > 0 && (
                              <div 
                                className="absolute bottom-0 left-0 h-1 bg-cameroon-green/20 dark:bg-cameroon-green/40 transition-all duration-500" 
                                style={{ width: `${percentageOfMax}%` }}
                              />
                          )}
                          
                          <div className="flex flex-col items-center justify-center gap-1 h-full relative z-10">
                            {status === 'unavailable' || val === null || val === undefined ? (
                                <span className="text-[10px] font-medium text-slate-300 dark:text-neutral-700 uppercase tracking-wider">—</span>
                            ) : val === 0 ? (
                                <span className="text-sm font-medium text-slate-300 dark:text-neutral-700">0</span>
                            ) : (
                                <>
                                    <span className={`text-sm font-semibold tabular-nums tracking-tight ${status === 'estimated' ? 'text-cameroon-yellow' : 'text-slate-900 dark:text-neutral-200'}`}>
                                        {val.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}
                                        {status === 'estimated' && '*'}
                                    </span>
                                    
                                    {/* Minimalist Trend Indicator */}
                                    {trend !== 'stable' && (
                                        <div className={`flex items-center text-[10px] font-medium gap-0.5 px-1.5 py-0.5 rounded-full ${
                                            trend === 'up' 
                                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                                            : 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                                        }`}>
                                            {trend === 'up' ? <ArrowUpRight size={10} strokeWidth={3} /> : <ArrowDownRight size={10} strokeWidth={3} />}
                                            <span>{Math.abs(percent).toFixed(0)}%</span>
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
        </div>
      </div>
    </div>
  );
};
