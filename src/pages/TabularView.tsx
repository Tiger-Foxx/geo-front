import { useState, useMemo, useEffect, useCallback } from 'react';
import { REGIONS_DEPARTMENTS, REGIONS, generateMockData, AGRI_INDICATORS, MOCK_DB, PECHE_INFRA_TYPES } from '../data/mockData';
import { ArrowUpRight, ArrowDownRight, Download, BarChart3, MapPin, ChevronDown, TrendingUp, Layers, Calendar, Check, Fish, Anchor, Warehouse, Globe, Building2, Waves, Factory, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TabularViewProps {
  selectedProduct: string;
  activeTheme: 'agriculture' | 'elevage' | 'peche' | 'overview';
  years: number[]; // From map view - we'll use as initial suggestion but manage our own
  selectedIndicator?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PÊCHE SUB-COMPONENT - Specialized view for fishing data (multiscalar)
// ═══════════════════════════════════════════════════════════════════════════════

// Based on REAL data structure from Description_datas_brutes_dispo.md:
// - National: évolution 2015-2021 (prod par type)
// - Régional: données COMPLÈTES par région (prod par type + infrastructures) - données 2021 uniquement pour l'instant
// - Départemental: production totale par département - données 2021 uniquement

type PecheDataDimension = 'production' | 'infrastructure';

const PECHE_LABELS: Record<string, string> = {
  // Production
  'peche_artisanale_maritime': 'Pêche Artisanale Maritime',
  'peche_continentale': 'Pêche Continentale', 
  'peche_industrielle': 'Pêche Industrielle',
  'aquaculture': 'Aquaculture',
  'production_totale': 'Production Totale',
  // Infra
  'nb_pisciculteurs': 'Pisciculteurs',
  'etangs_actifs': 'Étangs Actifs',
  'fumoirs': 'Fumoirs',
  'halls_vente': 'Halls de Vente',
  'bacs': 'Bacs',
  'cages': 'Cages',
  // Legacy (mock)
  'prod_industrielle': 'Industrielle',
  'prod_continentale': 'Continentale', 
  'prod_artisanale': 'Artisanale',
  'prod_totale': 'Total',
  'etangs': 'Étangs',
};

const PECHE_ICONS: Record<string, typeof Fish> = {
  'peche_artisanale_maritime': Anchor,
  'peche_continentale': Waves,
  'peche_industrielle': Factory,
  'aquaculture': Fish,
  'production_totale': BarChart3,
  'nb_pisciculteurs': Users,
  'etangs_actifs': Waves,
  'fumoirs': Building2,
  'halls_vente': Warehouse,
  'bacs': Layers,
  'cages': Fish,
  // Legacy
  'prod_industrielle': Factory,
  'prod_continentale': Waves,
  'prod_artisanale': Anchor,
  'prod_totale': BarChart3,
  'etangs': Waves,
};

const PecheTabularView = () => {
  // Available years for national data (from mock - 2015-2021)
  const availableYears = useMemo(() => MOCK_DB.peche.national.map(d => d.annee).sort((a, b) => b - a), []);
  
  const [selectedYear, setSelectedYear] = useState<number>(availableYears[0] || 2021);
  const [dimension, setDimension] = useState<PecheDataDimension>('production');
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 200);
    return () => clearTimeout(timer);
  }, [selectedYear, dimension]);

  // Data from mock DB
  const nationalData = MOCK_DB.peche.national;
  const regionalData = MOCK_DB.peche.regional;
  const departementalData = MOCK_DB.peche.departemental;
  
  // Get national data for selected year
  const nationalYearData = useMemo(() => 
    nationalData.find(d => d.annee === selectedYear), 
    [nationalData, selectedYear]
  );
  
  // Get previous year data for trend calculation
  const prevYearData = useMemo(() => 
    nationalData.find(d => d.annee === selectedYear - 1),
    [nationalData, selectedYear]
  );

  return (
    <div className="h-full w-full bg-white dark:bg-[#050505] p-0 md:p-6 md:pl-[88px] pt-16 md:pt-6 flex flex-col overflow-hidden font-sans">
      <div className="w-full h-full flex flex-col space-y-0 max-w-[1600px] mx-auto border-x border-slate-100 dark:border-white/5 relative">
        
        {/* Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-black/60 backdrop-blur-[2px]"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="loader-dots text-blue-500"><span></span><span></span><span></span></div>
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">Chargement</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 p-6 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-[#050505] shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400">
                <Fish size={16} strokeWidth={2.5} />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Données Pêche & Aquaculture</h1>
            </div>
            <p className="text-slate-500 dark:text-neutral-500 text-sm font-medium pl-11">
              Exploration multidimensionnelle : Production par type & Infrastructures
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            
            {/* Year Selector */}
            <div className="relative z-50">
              <button
                onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-neutral-900 rounded-xl text-sm font-bold text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors"
              >
                <Calendar size={14} className="text-blue-500" />
                <span>{selectedYear}</span>
                <ChevronDown size={14} className={`transition-transform ${isYearDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isYearDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute top-full mt-1 left-0 bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden shadow-xl z-50"
                  >
                    {availableYears.map(year => (
                      <button
                        key={year}
                        onClick={() => {
                          setSelectedYear(year);
                          setIsYearDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-sm font-medium text-left transition-colors ${
                          selectedYear === year 
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                            : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-neutral-400'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-8 w-px bg-slate-200 dark:bg-white/10" />

            {/* Dimension Toggle: Production vs Infrastructure */}
            <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-neutral-900 gap-1">
              <button
                onClick={() => setDimension('production')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  dimension === 'production'
                    ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 dark:text-neutral-500 hover:text-slate-700 dark:hover:text-neutral-300'
                }`}
              >
                <BarChart3 size={14} />
                <span>Production</span>
              </button>
              <button
                onClick={() => setDimension('infrastructure')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  dimension === 'infrastructure'
                    ? 'bg-white dark:bg-neutral-800 text-teal-600 dark:text-teal-400 shadow-sm'
                    : 'text-slate-500 dark:text-neutral-500 hover:text-slate-700 dark:hover:text-neutral-300'
                }`}
              >
                <Building2 size={14} />
                <span>Infrastructures</span>
              </button>
            </div>
            
            <button className="ml-auto p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" title="Exporter CSV">
              <Download size={18} strokeWidth={2} />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-white dark:bg-[#050505] relative flex flex-col">
          <div className="absolute inset-0 overflow-auto custom-scrollbar p-6">
            
            {/* ═══════════════════════════════════════════════════════════════════════════ */}
            {/* PRODUCTION DIMENSION */}
            {/* ═══════════════════════════════════════════════════════════════════════════ */}
            {dimension === 'production' && (
              <div className="space-y-8">
                
                {/* Section 1: National Summary for Selected Year */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <Globe size={18} className="text-blue-500" />
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Résumé National {selectedYear}</h2>
                  </div>
                  
                  {nationalYearData ? (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {(['prod_artisanale', 'prod_continentale', 'prod_industrielle', 'aquaculture', 'prod_totale'] as const).map(key => {
                        const Icon = PECHE_ICONS[key] || BarChart3;
                        const val = nationalYearData[key];
                        const prevVal = prevYearData?.[key];
                        const trend = prevVal ? ((val - prevVal) / prevVal * 100) : null;
                        
                        return (
                          <div key={key} className={`p-4 rounded-xl border ${
                            key === 'prod_totale' 
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50' 
                              : 'bg-white dark:bg-neutral-900 border-slate-200 dark:border-white/10'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              <Icon size={14} className={key === 'prod_totale' ? 'text-blue-600' : 'text-slate-400'} />
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-neutral-500">
                                {PECHE_LABELS[key]}
                              </span>
                            </div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                              {val.toLocaleString('fr-FR')}
                              <span className="text-xs font-normal text-slate-400 ml-1">t</span>
                            </div>
                            {trend !== null && (
                              <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${
                                trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-rose-600' : 'text-slate-400'
                              }`}>
                                {trend > 0 ? <ArrowUpRight size={12} /> : trend < 0 ? <ArrowDownRight size={12} /> : null}
                                {trend > 0 ? '+' : ''}{trend.toFixed(1)}% vs {selectedYear - 1}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 dark:text-neutral-600">
                      Pas de données nationales pour {selectedYear}
                    </div>
                  )}
                </section>

                {/* Section 2: Historical Trend Table */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp size={18} className="text-blue-500" />
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Évolution Historique</h2>
                    <span className="text-xs text-slate-400">2015 → 2021</span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead className="bg-slate-50 dark:bg-neutral-900">
                        <tr>
                          <th className="p-3 font-semibold text-slate-500 dark:text-neutral-500 text-[11px] uppercase tracking-widest border-b border-slate-200 dark:border-white/10">Année</th>
                          {(['prod_artisanale', 'prod_continentale', 'prod_industrielle', 'aquaculture', 'prod_totale'] as const).map(key => (
                            <th key={key} className="p-3 font-semibold text-slate-500 dark:text-neutral-500 text-[10px] uppercase tracking-widest text-right border-b border-slate-200 dark:border-white/10">
                              {PECHE_LABELS[key]}
                            </th>
                          ))}
                          <th className="p-3 font-semibold text-slate-500 dark:text-neutral-500 text-[10px] uppercase tracking-widest text-center border-b border-slate-200 dark:border-white/10">Croiss.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {[...nationalData].sort((a, b) => b.annee - a.annee).map(row => (
                          <tr 
                            key={row.annee} 
                            className={`transition-colors ${
                              row.annee === selectedYear 
                                ? 'bg-blue-50 dark:bg-blue-900/20' 
                                : 'hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                            }`}
                          >
                            <td className={`p-3 font-bold text-sm ${row.annee === selectedYear ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'}`}>
                              {row.annee}
                            </td>
                            {(['prod_artisanale', 'prod_continentale', 'prod_industrielle', 'aquaculture', 'prod_totale'] as const).map(key => (
                              <td key={key} className="p-3 text-right text-sm tabular-nums text-slate-700 dark:text-neutral-300">
                                {row[key].toLocaleString('fr-FR')}
                              </td>
                            ))}
                            <td className="p-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                                row.taux_croissance > 0 
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                  : row.taux_croissance < 0 
                                    ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                                    : 'bg-slate-100 dark:bg-neutral-800 text-slate-500'
                              }`}>
                                {row.taux_croissance > 0 ? '+' : ''}{row.taux_croissance.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Section 3: Départemental Production (2021 only based on available data) */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <Layers size={18} className="text-purple-500" />
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Production par Département</h2>
                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[9px] font-bold rounded">
                      Données 2021 uniquement
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {REGIONS.map(region => {
                      const deptData = departementalData.filter(d => d.region === region).sort((a, b) => b.valeur - a.valeur);
                      const regionTotal = deptData.reduce((sum, d) => sum + d.valeur, 0);
                      const isCoastal = ['Littoral', 'Sud', 'Sud-Ouest'].includes(region);
                      const maxVal = Math.max(...deptData.map(d => d.valeur), 1);
                      
                      if (regionTotal === 0) return null;
                      
                      return (
                        <div key={region} className="border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
                          <div className={`p-3 flex items-center justify-between ${
                            isCoastal ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-slate-50 dark:bg-neutral-900'
                          }`}>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 dark:text-white">{region}</span>
                              {isCoastal && <Anchor size={12} className="text-blue-500" />}
                            </div>
                            <span className="text-sm font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                              {regionTotal.toLocaleString('fr-FR')} t
                            </span>
                          </div>
                          <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-[200px] overflow-y-auto custom-scrollbar">
                            {deptData.map(dept => (
                              <div key={dept.departement} className="p-2 px-3 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-white/[0.02] relative">
                                <div 
                                  className="absolute left-0 top-0 bottom-0 bg-purple-100/50 dark:bg-purple-900/20"
                                  style={{ width: `${(dept.valeur / maxVal) * 100}%` }}
                                />
                                <span className="relative z-10 flex-1 text-xs text-slate-600 dark:text-neutral-400">{dept.departement}</span>
                                <span className="relative z-10 text-xs font-bold tabular-nums text-slate-900 dark:text-white">
                                  {dept.valeur.toLocaleString('fr-FR')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════════════ */}
            {/* INFRASTRUCTURE DIMENSION */}
            {/* ═══════════════════════════════════════════════════════════════════════════ */}
            {dimension === 'infrastructure' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <Building2 size={18} className="text-teal-500" />
                  <h2 className="text-lg font-bold text-slate-800 dark:text-white">Infrastructures par Région</h2>
                  <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[9px] font-bold rounded">
                    Données 2021 uniquement
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-slate-50 dark:bg-neutral-900">
                      <tr>
                        <th className="p-4 font-semibold text-slate-500 dark:text-neutral-500 text-[11px] uppercase tracking-widest border-b border-slate-200 dark:border-white/10 sticky left-0 bg-slate-50 dark:bg-neutral-900 z-10">Région</th>
                        {PECHE_INFRA_TYPES.map(inf => {
                          const Icon = PECHE_ICONS[inf] || Building2;
                          return (
                            <th key={inf} className="p-3 font-semibold text-slate-500 dark:text-neutral-500 text-[10px] uppercase tracking-widest text-center border-b border-slate-200 dark:border-white/10 min-w-[100px]">
                              <div className="flex flex-col items-center gap-1">
                                <Icon size={14} className="text-teal-400" />
                                <span>{PECHE_LABELS[inf] || inf}</span>
                              </div>
                            </th>
                          );
                        })}
                        <th className="p-3 font-semibold text-slate-500 dark:text-neutral-500 text-[10px] uppercase tracking-widest text-center border-b border-slate-200 dark:border-white/10">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {[...regionalData].sort((a, b) => {
                        const totalA = PECHE_INFRA_TYPES.reduce((sum, k) => sum + (a[k] || 0), 0);
                        const totalB = PECHE_INFRA_TYPES.reduce((sum, k) => sum + (b[k] || 0), 0);
                        return totalB - totalA;
                      }).map(row => {
                        const total = PECHE_INFRA_TYPES.reduce((sum, k) => sum + (row[k] || 0), 0);
                        const isCoastal = ['Littoral', 'Sud', 'Sud-Ouest'].includes(row.region);
                        
                        return (
                          <tr key={row.region} className="hover:bg-teal-50/50 dark:hover:bg-teal-900/10 transition-colors">
                            <td className="p-4 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-white/10 text-sm sticky left-0 bg-white dark:bg-[#050505] z-10">
                              <div className="flex items-center gap-2">
                                {row.region}
                                {isCoastal && <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[8px] font-bold uppercase rounded">Côtier</span>}
                              </div>
                            </td>
                            {PECHE_INFRA_TYPES.map(inf => (
                              <td key={inf} className="p-3 text-center">
                                <span className={`text-sm font-semibold tabular-nums ${
                                  row[inf] > 0 ? 'text-slate-800 dark:text-neutral-200' : 'text-slate-300 dark:text-neutral-700'
                                }`}>
                                  {row[inf]?.toLocaleString('fr-FR') || '—'}
                                </span>
                              </td>
                            ))}
                            <td className="p-3 text-center">
                              <span className="inline-flex items-center justify-center min-w-[50px] px-2 py-1 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-sm font-bold">
                                {total.toLocaleString('fr-FR')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN TABULAR VIEW COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export const TabularView = ({ selectedProduct, activeTheme, selectedIndicator = 'Production' }: TabularViewProps) => {
  // If theme is PECHE, render specialized view
  if (activeTheme === 'peche') {
    return <PecheTabularView />;
  }
  
  // Otherwise, continue with Agriculture/Elevage view
  const [selectedRegion, setSelectedRegion] = useState('Centre');
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [pivotMode, setPivotMode] = useState<'years-rows' | 'dept-rows'>('years-rows');
  const [localIndicator, setLocalIndicator] = useState(selectedIndicator);
  
  // Determine available years based on theme
  const availableYears = useMemo(() => {
    if (activeTheme === 'agriculture') return Array.from({ length: 25 }, (_, i) => 2022 - i); // 1998-2022
    if (activeTheme === 'elevage') return [2021, 2020];
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
