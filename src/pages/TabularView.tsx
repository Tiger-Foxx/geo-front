import { useState, useMemo } from 'react';
import { REGIONS_DEPARTMENTS, CROPS, generateMockData } from '../data/mockData';
import { ArrowUpRight, ArrowDownRight, ArrowRight, Download, Filter, BarChart3, MapPin, ChevronDown, Table2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const TabularView = () => {
  const [selectedRegion, setSelectedRegion] = useState('Centre');
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(CROPS[0]);
  const [pivotMode, setPivotMode] = useState<'years-rows' | 'dept-rows'>('years-rows');
  // const [viewMetric, setViewMetric] = useState<'production' | 'yield'>('production');
  
  const data = useMemo(() => generateMockData(), []);
  const departments = REGIONS_DEPARTMENTS[selectedRegion] || [];
  const years = Array.from({ length: 6 }, (_, i) => 2017 + i); // 2017-2022

  // Helper to get formatted value and fake trend
  const getCellData = (dept: string, year: number) => {
    const record = data.find(d => d.department === dept && d.season_year === year && d.product === selectedProduct);
    const val = record?.value || 0;
    
    // Fake trend logic for demo
    const prevYearVal = data.find(d => d.department === dept && d.season_year === year - 1 && d.product === selectedProduct)?.value || val;
    const trend = val > prevYearVal ? 'up' : val < prevYearVal ? 'down' : 'stable';
    const percent = prevYearVal ? ((val - prevYearVal) / prevYearVal) * 100 : 0;
    
    return { val, trend, percent };
  };

  const rows = pivotMode === 'years-rows' ? years : departments;
  const cols = pivotMode === 'years-rows' ? departments : years;

  return (
    <div className="h-full w-full bg-slate-50/50 dark:bg-black p-8 pt-32 flex flex-col">
       <div className="max-w-7xl mx-auto w-full h-full flex flex-col space-y-6">
        
        {/* Magic Toolbar */}
        <header className="relative z-[500] flex flex-col md:flex-row justify-between items-end md:items-center gap-4 bg-white/60 dark:bg-neutral-900/80 backdrop-blur-md p-6 rounded-3xl border border-white/60 dark:border-white/10 shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-cameroon-green/10 rounded-lg text-cameroon-green">
                    <BarChart3 size={20} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Matrice Économique</h1>
            </div>
            <p className="text-slate-500 dark:text-neutral-400 text-sm pl-12">Analyse croisée des volumes par bassin</p>
          </div>
          
          <div className="flex flex-wrap gap-3 items-center">
             <div className="flex bg-slate-100/80 dark:bg-neutral-800/80 p-1 rounded-xl">
                <button 
                    onClick={() => setPivotMode('years-rows')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${pivotMode === 'years-rows' ? 'bg-white dark:bg-neutral-700 shadow text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-neutral-400'}`}
                >
                    Années en Ligne
                </button>
                 <button 
                    onClick={() => setPivotMode('dept-rows')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${pivotMode === 'dept-rows' ? 'bg-white dark:bg-neutral-700 shadow text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-neutral-400'}`}
                >
                    Départ. en Ligne
                </button>
             </div>

             <div className="h-8 w-px bg-slate-200 dark:bg-neutral-700 mx-2" />

             {/* Custom Region Selector */}
             <div className="relative z-50">
                <button
                    onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                    className={`flex items-center gap-3 bg-white dark:bg-neutral-900 border shadow-sm rounded-xl px-4 py-2 text-sm font-semibold transition-all outline-none ${
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
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute top-full mt-3 left-0 w-64 max-h-[400px] overflow-y-auto custom-scrollbar bg-white/95 dark:bg-black/95 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-2xl rounded-2xl p-2 flex flex-col gap-1 z-[999]"
                        >
                            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 mb-1">
                                Bassins de Production
                            </div>
                            {Object.keys(REGIONS_DEPARTMENTS).map(r => (
                                <button
                                    key={r}
                                    onClick={() => {
                                        setSelectedRegion(r);
                                        setIsRegionDropdownOpen(false);
                                    }}
                                    className={`relative text-left px-3 py-2.5 text-sm font-medium rounded-xl transition-all flex items-center justify-between group ${
                                        selectedRegion === r 
                                        ? 'bg-gradient-to-r from-cameroon-green to-green-700 text-white shadow-lg shadow-green-900/20' 
                                        : 'hover:bg-neutral-900 dark:hover:bg-white/5 text-slate-600 dark:text-neutral-300 hover:pl-4'
                                    }`}
                                >
                                    <span>{r}</span>
                                    {selectedRegion === r && (
                                        <motion.div layoutId="check">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                                        </motion.div>
                                    )}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
             </div>
             
             <div className="relative group">
                <select 
                value={selectedProduct} 
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="appearance-none bg-cameroon-green text-white border-none shadow-lg shadow-cameroon-green/20 rounded-xl px-4 py-2 pr-8 text-sm font-medium outline-none cursor-pointer hover:bg-green-800 transition-colors"
                >
                {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <Filter size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none" />
             </div>

             <button className="p-2 text-slate-400 dark:text-neutral-500 hover:text-slate-700 dark:hover:text-neutral-200 hover:bg-white dark:hover:bg-neutral-800 rounded-xl transition-all" title="Exporter CSV">
                 <Download size={20} />
             </button>
          </div>
        </header>

        {/* The Pivot Table */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 overflow-hidden bg-white/80 dark:bg-neutral-950/90 backdrop-blur-xl rounded-3xl border border-white dark:border-white/10 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] relative"
        >
          <div className="absolute inset-0 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-neutral-950/95 backdrop-blur-md shadow-sm">
                <tr>
                  <th className="p-5 font-bold text-slate-400 dark:text-neutral-500 text-xs w-32 uppercase tracking-wider sticky left-0 bg-slate-50/95 dark:bg-neutral-950/95 z-20 border-b border-slate-100 dark:border-white/10">
                    {pivotMode === 'years-rows' ? 'Période' : 'Zone Admin.'}
                  </th>
                  {cols.map((col) => (
                    <th key={col} className="p-4 font-semibold text-slate-700 dark:text-neutral-300 text-xs uppercase tracking-wider text-center border-b border-l border-slate-100 dark:border-white/10 min-w-32">
                        {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {rows.map((row) => (
                  <tr key={row} className="group hover:bg-blue-50/30 dark:hover:bg-cameroon-green/5 transition-colors">
                    <td className="p-4 font-bold text-slate-700 dark:text-neutral-200 sticky left-0 bg-white/50 dark:bg-neutral-950/80 group-hover:bg-blue-50/50 dark:group-hover:bg-cameroon-green/10 backdrop-blur-sm border-r border-slate-100 dark:border-white/5 z-10 transition-colors">
                        {row}
                    </td>
                    {cols.map((col) => {
                      const dept = pivotMode === 'years-rows' ? col as string : row as string;
                      const year = pivotMode === 'years-rows' ? row as number : col as number;
                      const { val, trend, percent } = getCellData(dept, year);

                      return (
                        <td key={col} className="p-3 border-l border-slate-50 dark:border-white/5 text-center relative">
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <span className="text-sm font-medium text-slate-800 dark:text-neutral-200 tabular-nums tracking-tight">
                                {val > 0 ? val.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '-'}
                            </span>
                            
                            {val > 0 && (
                                <div className={`flex items-center text-[10px] font-medium gap-0.5 ${
                                    trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' : trend === 'down' ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400 dark:text-neutral-500'
                                }`}>
                                    {trend === 'up' ? <ArrowUpRight size={10} /> : trend === 'down' ? <ArrowDownRight size={10} /> : <ArrowRight size={10} />}
                                    <span>{Math.abs(percent).toFixed(0)}%</span>
                                </div>
                            )}

                            {/* Micro Chart Background - optional advanced feature */}
                            {val > 0 && (
                                <div 
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-cameroon-green/20 dark:bg-cameroon-green/40" 
                                    style={{ width: `${Math.min(100, (val / 5000) * 100)}%`, opacity: 0.5 }} 
                                />
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

