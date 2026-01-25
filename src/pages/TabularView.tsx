import { useState, useMemo, useEffect, useCallback } from 'react';
import { REGIONS_DEPARTMENTS, generateMockData, AGRI_INDICATORS } from '../data/mockData';
import { ArrowUpRight, ArrowDownRight, Download, BarChart3, MapPin, ChevronDown, TrendingUp, Layers, Calendar, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TabularViewProps {
  selectedProduct: string;
  activeTheme: 'agriculture' | 'elevage' | 'peche' | 'overview';
  years: number[]; // From map view - we'll use as initial suggestion but manage our own
  selectedIndicator?: string;
}

export const TabularView = ({ selectedProduct, activeTheme, selectedIndicator = 'Production' }: TabularViewProps) => {
  const [selectedRegion, setSelectedRegion] = useState('Centre');
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [pivotMode, setPivotMode] = useState<'years-rows' | 'dept-rows'>('years-rows');
  const [localIndicator, setLocalIndicator] = useState(selectedIndicator);
  
  // Determine available years based on theme
  const availableYears = useMemo(() => {
    if (activeTheme === 'agriculture') return Array.from({ length: 25 }, (_, i) => 2022 - i); // 1998-2022
    if (activeTheme === 'elevage') return [2021, 2020];
    if (activeTheme === 'peche') return [2021];
    return Array.from({ length: 7 }, (_, i) => 2022 - i);
  }, [activeTheme]);
  
  // Default to last 5 years for performance (user can expand)
  const defaultYearsForTheme = useMemo(() => {
    if (activeTheme === 'agriculture') return availableYears.slice(0, 5); // Last 5 years
    return availableYears; // Elevage/Peche have few years anyway
  }, [activeTheme, availableYears]);
  
  // TabularView's OWN period state - defaults to reasonable subset
  const [selectedYears, setSelectedYears] = useState<number[]>(defaultYearsForTheme);
  
  // Reset selected years when theme changes
  useEffect(() => {
    setSelectedYears(defaultYearsForTheme);
  }, [activeTheme, defaultYearsForTheme]);
  
  // Sync local indicator with prop
  useEffect(() => {
    setLocalIndicator(selectedIndicator);
  }, [selectedIndicator]);
  
  // Memoize data generation (expensive!)
  const data = useMemo(() => generateMockData(), []);
  const departments = useMemo(() => REGIONS_DEPARTMENTS[selectedRegion] || [], [selectedRegion]);
  
  // Memoize sorted years to avoid re-sorting on every render
  const displayYears = useMemo(() => [...selectedYears].sort((a, b) => b - a), [selectedYears]);
  
  const rows = useMemo(() => pivotMode === 'years-rows' ? displayYears : departments, [pivotMode, displayYears, departments]);
  const cols = useMemo(() => pivotMode === 'years-rows' ? departments : displayYears, [pivotMode, displayYears, departments]);

  // Toggle year selection - memoized callback
  const toggleYear = useCallback((year: number) => {
    setSelectedYears(prev => {
      if (prev.includes(year)) {
        if (prev.length === 1) return prev;
        return prev.filter(y => y !== year);
      }
      return [...prev, year];
    });
  }, []);
  
  // Quick actions for period selection - memoized
  const selectAllYears = useCallback(() => setSelectedYears(availableYears), [availableYears]);
  const selectLastN = useCallback((n: number) => setSelectedYears(availableYears.slice(0, n)), [availableYears]);

  // Memoize getCellData to avoid recreating on every render
  const getCellData = useCallback((dept: string, year: number) => {
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
  }, [data, selectedProduct, localIndicator]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.region-selector-trigger') && !target.closest('.region-dropdown-content')) {
        setIsRegionDropdownOpen(false);
      }
      if (!target.closest('.period-selector-trigger') && !target.closest('.period-dropdown-content')) {
        setIsPeriodDropdownOpen(false);
      }
    };
    if (isRegionDropdownOpen || isPeriodDropdownOpen) {
        document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isRegionDropdownOpen, isPeriodDropdownOpen]);

  // Simulated loading state (will be real when connected to API)
  const [isLoading, setIsLoading] = useState(false);
  
  // Simulate loading when filters change
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [selectedProduct, selectedRegion, selectedYears, localIndicator]);

  return (
    <div className="h-full w-full bg-white dark:bg-[#050505] p-0 md:p-6 md:pl-[88px] pt-16 md:pt-6 flex flex-col overflow-hidden font-sans">
       <div className="w-full h-full flex flex-col space-y-0 max-w-[1600px] mx-auto border-x border-slate-100 dark:border-white/5 relative">
        
        {/* Elegant Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-[2px]"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="loader-dots text-cameroon-green">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="text-[11px] font-medium text-slate-400 dark:text-neutral-500 uppercase tracking-widest loader-text">
                  Chargement
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

             {/* PERIOD SELECTOR - NEW! Multi-select for tabular view */}
             <div className="relative z-50 min-w-[180px]">
                <button
                    onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                    className="period-selector-trigger w-full flex items-center justify-between gap-3 bg-transparent border-b border-slate-200 dark:border-white/10 px-2 py-2 text-sm font-semibold transition-colors hover:border-slate-400 dark:hover:border-white/30 outline-none group"
                >
                    <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                        <Calendar size={14} className="text-slate-400 dark:text-slate-600 group-hover:text-cameroon-green transition-colors" />
                        <span>
                           {selectedYears.length === availableYears.length 
                              ? 'Toutes périodes' 
                              : selectedYears.length === 1 
                                ? selectedYears[0] 
                                : `${selectedYears.length} années`}
                        </span>
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isPeriodDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                    {isPeriodDropdownOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.1 }}
                            className="period-dropdown-content absolute top-full mt-1 left-0 w-[220px] max-h-[350px] overflow-hidden bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-lg flex flex-col z-[100]"
                        >
                            {/* Quick Actions */}
                            <div className="p-2 border-b border-slate-100 dark:border-white/5 flex gap-1 flex-wrap">
                                <button 
                                   onClick={selectAllYears}
                                   className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${selectedYears.length === availableYears.length ? 'bg-cameroon-green text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-white/20'}`}
                                >
                                   Toutes
                                </button>
                                {availableYears.length > 5 && (
                                  <>
                                    <button 
                                       onClick={() => selectLastN(5)}
                                       className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${selectedYears.length === 5 ? 'bg-cameroon-green text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-white/20'}`}
                                    >
                                       5 ans
                                    </button>
                                    <button 
                                       onClick={() => selectLastN(10)}
                                       className={`px-2 py-1 text-[10px] font-bold rounded transition-colors ${selectedYears.length === 10 ? 'bg-cameroon-green text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-neutral-400 hover:bg-slate-200 dark:hover:bg-white/20'}`}
                                    >
                                       10 ans
                                    </button>
                                  </>
                                )}
                            </div>
                            
                            {/* Year List */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                                {availableYears.map(year => (
                                    <button
                                        key={year}
                                        onClick={() => toggleYear(year)}
                                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded transition-colors ${
                                            selectedYears.includes(year) 
                                            ? 'bg-cameroon-green/10 text-cameroon-green' 
                                            : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-neutral-400'
                                        }`}
                                    >
                                        <span className="font-mono">{year}</span>
                                        {selectedYears.includes(year) && (
                                            <div className="w-4 h-4 rounded bg-cameroon-green flex items-center justify-center">
                                                <Check size={10} className="text-white" strokeWidth={3} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                            
                            {/* Footer */}
                            <div className="p-2 border-t border-slate-100 dark:border-white/5 text-center">
                               <span className="text-[10px] text-slate-400 dark:text-neutral-600">
                                  {selectedYears.length} sur {availableYears.length} sélectionnées
                               </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
             </div>

             <div className="h-8 w-px bg-slate-100 dark:bg-white/10 hidden md:block" />

             {/* Region Selector - Minimalist */}
             <div className="relative z-40 min-w-[200px]">
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
                            className="region-dropdown-content absolute top-full mt-1 left-0 w-full max-h-[300px] overflow-y-auto custom-scrollbar bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-lg p-1 flex flex-col gap-0.5 z-[100]"
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
