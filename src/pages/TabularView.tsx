import { useState, useMemo, useEffect, useCallback } from 'react';
import {  MOCK_DB, PECHE_INFRA_TYPES } from '../data/mockData';
import { ArrowUpRight, ArrowDownRight, Download, BarChart3, MapPin, ChevronDown, TrendingUp, Layers, Calendar, Check, Fish, Anchor, Warehouse, Globe, Building2, Waves, Factory, AlertCircle, Database, Wheat, Beef, Search, X, FileSpreadsheet, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGeoServerFilters, usePecheData } from '../hooks/useGeoServer';
import GeoServerAPI from '../services/geoserver';
import { DATA_MODE } from '../config';

interface TabularViewProps {
  selectedProduct: string;
  activeTheme: 'agriculture' | 'elevage' | 'peche' | 'overview';
  years: number[];
  selectedIndicator?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITAIRE D'EXPORT CSV/EXCEL
// ═══════════════════════════════════════════════════════════════════════════════

interface ExportOptions {
  filename: string;
  headers: string[];
  rows: (string | number | null)[][];
  title?: string;
  metadata?: Record<string, string>;
}

const exportToCSV = ({ filename, headers, rows, title, metadata }: ExportOptions) => {
  // BOM pour UTF-8 (support des caractères français)
  let csvContent = '\ufeff';
  
  // Métadonnées en commentaires
  if (title) {
    csvContent += `# ${title}\n`;
  }
  if (metadata) {
    Object.entries(metadata).forEach(([key, value]) => {
      csvContent += `# ${key}: ${value}\n`;
    });
    csvContent += `# Exporté le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}\n`;
    csvContent += '#\n';
  }
  
  // En-têtes
  csvContent += headers.map(h => `"${h}"`).join(';') + '\n';
  
  // Données
  rows.forEach(row => {
    csvContent += row.map(cell => {
      if (cell === null || cell === undefined) return '""';
      if (typeof cell === 'number') return cell.toString().replace('.', ','); // Format FR
      return `"${cell}"`;
    }).join(';') + '\n';
  });
  
  // Créer le blob et télécharger
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export Excel (via format HTML que Excel peut lire)
const exportToExcel = ({ filename, headers, rows, title, metadata }: ExportOptions) => {
  let htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
    <head>
      <meta charset="UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>${title || 'Données'}</x:Name>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <style>
        table { border-collapse: collapse; }
        th { background-color: #056B32; color: white; font-weight: bold; padding: 8px; border: 1px solid #ddd; }
        td { padding: 6px; border: 1px solid #ddd; }
        .metadata { color: #666; font-style: italic; }
        .number { text-align: right; }
      </style>
    </head>
    <body>
  `;
  
  // Métadonnées
  if (title) {
    htmlContent += `<h2>${title}</h2>`;
  }
  if (metadata) {
    htmlContent += '<p class="metadata">';
    Object.entries(metadata).forEach(([key, value]) => {
      htmlContent += `${key}: ${value}<br/>`;
    });
    htmlContent += `Exporté le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`;
    htmlContent += '</p>';
  }
  
  // Tableau
  htmlContent += '<table>';
  htmlContent += '<thead><tr>';
  headers.forEach(h => {
    htmlContent += `<th>${h}</th>`;
  });
  htmlContent += '</tr></thead>';
  
  htmlContent += '<tbody>';
  rows.forEach(row => {
    htmlContent += '<tr>';
    row.forEach((cell, idx) => {
      const isNumber = typeof cell === 'number';
      const value = cell === null || cell === undefined ? '' : cell;
      htmlContent += `<td class="${isNumber ? 'number' : ''}">${value}</td>`;
    });
    htmlContent += '</tr>';
  });
  htmlContent += '</tbody></table>';
  
  htmlContent += '</body></html>';
  
  const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.xls`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT BOUTON EXPORT AVEC MENU
// ═══════════════════════════════════════════════════════════════════════════════

interface ExportButtonProps {
  onExportCSV: () => void;
  onExportExcel: () => void;
  disabled?: boolean;
}

const ExportButton = ({ onExportCSV, onExportExcel, disabled }: ExportButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
          disabled 
            ? 'bg-slate-100 dark:bg-neutral-800 text-slate-400 cursor-not-allowed'
            : 'bg-cameroon-green/10 text-cameroon-green hover:bg-cameroon-green/20'
        }`}
        title="Exporter les données"
      >
        <Download size={16} strokeWidth={2} />
        <span>Exporter</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute top-full mt-1 right-0 w-[180px] bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden shadow-xl z-50"
          >
            <button
              onClick={() => { onExportCSV(); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-neutral-300 transition-colors"
            >
              <FileText size={16} className="text-emerald-500" />
              <div>
                <div>Export CSV</div>
                <div className="text-[10px] text-slate-400">Compatible Excel</div>
              </div>
            </button>
            <div className="h-px bg-slate-100 dark:bg-white/5" />
            <button
              onClick={() => { onExportExcel(); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-left hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-neutral-300 transition-colors"
            >
              <FileSpreadsheet size={16} className="text-green-600" />
              <div>
                <div>Export Excel</div>
                <div className="text-[10px] text-slate-400">Format .xls</div>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Overlay pour fermer le menu */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT INDICATEUR DE CHARGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

const LoadingOverlay = ({ message = 'Chargement' }: { message?: string }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
    className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-black/80 backdrop-blur-sm"
  >
    <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl border border-slate-200 dark:border-white/10">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-3 border-slate-200 dark:border-neutral-700" />
        <div className="absolute inset-0 w-12 h-12 rounded-full border-3 border-transparent border-t-cameroon-green animate-spin" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-bold text-slate-800 dark:text-white">{message}</span>
        <div className="loader-dots text-cameroon-green">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  </motion.div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT ÉTAT VIDE
// ═══════════════════════════════════════════════════════════════════════════════

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  action 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string; 
  action?: { label: string; onClick: () => void };
}) => (
  <div className="flex-1 flex items-center justify-center p-8">
    <div className="text-center max-w-md">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-neutral-900 flex items-center justify-center">
        <Icon size={28} className="text-slate-400 dark:text-neutral-600" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-neutral-500 mb-4">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-cameroon-green text-white text-sm font-bold rounded-lg hover:bg-cameroon-green/90 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// VUE TABULAIRE AGRICULTURE - Données GeoServer
// ═══════════════════════════════════════════════════════════════════════════════

interface AgricultureTableProps {
  product: string;
  indicator: string;
  initialYear: number;
}

const AgricultureTabularView = ({ product, indicator, initialYear }: AgricultureTableProps) => {
  const geoServerFilters = useGeoServerFilters();
  const useBackend = DATA_MODE === 'geoserver' && !geoServerFilters.error;
  
  // État local pour les années sélectionnées
  const [selectedYears, setSelectedYears] = useState<number[]>([initialYear]);
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState(''); // Filtre de recherche
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [isRegionDropdownOpen, setIsRegionDropdownOpen] = useState(false);
  
  // État pour stocker les données multi-années
  const [multiYearData, setMultiYearData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Années disponibles depuis GeoServer
  const availableYears = useMemo(() => {
    if (geoServerFilters.agriYearRange.years?.length) {
      return geoServerFilters.agriYearRange.years.sort((a, b) => b - a);
    }
    // Fallback
    const min = geoServerFilters.agriYearRange.min || 1998;
    const max = geoServerFilters.agriYearRange.max || 2008;
    return Array.from({ length: max - min + 1 }, (_, i) => max - i);
  }, [geoServerFilters.agriYearRange]);
  
  // Charger les données pour toutes les années sélectionnées
  useEffect(() => {
    if (!useBackend || !product || !indicator) {
      setIsLoading(false);
      return;
    }
    
    const fetchAllYearsData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Charger les données pour chaque année en parallèle
        const promises = selectedYears.map(year => 
          GeoServerAPI.agriculture.getData(product, indicator, year)
        );
        
        const results = await Promise.all(promises);
        
        // Fusionner toutes les données
        const allData: any[] = [];
        results.forEach((result, idx) => {
          const year = selectedYears[idx];
          result.features.forEach(f => {
            const props = f.properties as any;
            allData.push({
              year,
              region: props.region || props.nom_region,
              department: props.departement || props.nom_dep || props.department,
              value: props.valeur ?? props.value,
              product: props.product,
              indicator: props.indicator
            });
          });
        });
        
        setMultiYearData(allData);
        console.log('[TabularView] Données chargées:', allData.length, 'enregistrements');
      } catch (e) {
        console.error('[TabularView] Erreur chargement:', e);
        setError('Impossible de charger les données');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAllYearsData();
  }, [useBackend, product, indicator, selectedYears]);
  
  // Regrouper les données par département/région
  const tableData = useMemo(() => {
    if (!multiYearData.length) return [];
    
    // Grouper par zone géographique
    const grouped = new Map<string, Map<number, number>>();
    const regionMap = new Map<string, string>();
    
    multiYearData.forEach(row => {
      const zone = row.department || row.region || 'Unknown';
      if (row.region) regionMap.set(zone, row.region);
      
      if (!grouped.has(zone)) {
        grouped.set(zone, new Map());
      }
      grouped.get(zone)!.set(row.year, row.value);
    });
    
    // Convertir en tableau
    const result = Array.from(grouped.entries()).map(([zone, yearValues]) => {
      const row: any = { 
        zone,
        region: regionMap.get(zone) || zone
      };
      selectedYears.forEach(year => {
        row[`y${year}`] = yearValues.get(year) ?? null;
      });
      return row;
    });
    
    // Filtrer par région si sélectionnée
    let filtered = selectedRegion !== 'all' 
      ? result.filter(r => r.region === selectedRegion)
      : result;
    
    // Filtrer par recherche textuelle
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(r => 
        r.zone.toLowerCase().includes(term) || 
        r.region.toLowerCase().includes(term)
      );
    }
    
    return filtered.sort((a, b) => a.zone.localeCompare(b.zone));
  }, [multiYearData, selectedYears, selectedRegion, searchTerm]);
  
  // Obtenir les régions uniques
  const uniqueRegions = useMemo(() => {
    const regions = new Set(multiYearData.map(d => d.region).filter(Boolean));
    return Array.from(regions).sort();
  }, [multiYearData]);
  
  // Toggle année
  const toggleYear = (year: number) => {
    setSelectedYears(prev => {
      if (prev.includes(year)) {
        if (prev.length === 1) return prev;
        return prev.filter(y => y !== year);
      }
      return [...prev, year].sort((a, b) => b - a);
    });
  };
  
  // Calculer le trend
  const getTrend = (row: any, year: number) => {
    const currentVal = row[`y${year}`];
    const sortedYears = selectedYears.filter(y => y < year).sort((a, b) => b - a);
    const prevYear = sortedYears[0];
    if (!prevYear) return null;
    const prevVal = row[`y${prevYear}`];
    if (!currentVal || !prevVal) return null;
    return ((currentVal - prevVal) / prevVal) * 100;
  };
  
  // Unité
  const getUnit = () => {
    if (indicator === 'Production') return 't';
    if (indicator === 'Area Planted') return 'ha';
    if (indicator === 'Yield') return 'kg/ha';
    return '';
  };

  // ─── FONCTIONS D'EXPORT ─────────────────────────────────────────────────────
  const handleExportCSV = useCallback(() => {
    if (!tableData.length) return;
    
    const sortedYears = [...selectedYears].sort((a, b) => b - a);
    const headers = ['Département', 'Région', ...sortedYears.map(y => y.toString())];
    const rows = tableData.map(row => [
      row.zone,
      row.region,
      ...sortedYears.map(y => row[`y${y}`] ?? null)
    ]);
    
    exportToCSV({
      filename: `agriculture_${product}_${indicator}`.toLowerCase().replace(/\s+/g, '_'),
      headers,
      rows,
      title: `Données Agriculture - ${product}`,
      metadata: {
        'Produit': product,
        'Indicateur': indicator,
        'Années': sortedYears.join(', '),
        'Région': selectedRegion === 'all' ? 'Toutes' : selectedRegion,
        'Nombre de lignes': tableData.length.toString()
      }
    });
  }, [tableData, selectedYears, product, indicator, selectedRegion]);

  const handleExportExcel = useCallback(() => {
    if (!tableData.length) return;
    
    const sortedYears = [...selectedYears].sort((a, b) => b - a);
    const headers = ['Département', 'Région', ...sortedYears.map(y => y.toString())];
    const rows = tableData.map(row => [
      row.zone,
      row.region,
      ...sortedYears.map(y => row[`y${y}`] ?? null)
    ]);
    
    exportToExcel({
      filename: `agriculture_${product}_${indicator}`.toLowerCase().replace(/\s+/g, '_'),
      headers,
      rows,
      title: `Agriculture - ${product} (${indicator})`,
      metadata: {
        'Produit': product,
        'Indicateur': indicator,
        'Années': sortedYears.join(', '),
        'Région': selectedRegion === 'all' ? 'Toutes' : selectedRegion
      }
    });
  }, [tableData, selectedYears, product, indicator, selectedRegion]);

  return (
    <div className="h-full w-full bg-white dark:bg-[#050505] p-0 md:p-6 md:pl-[88px] pt-16 md:pt-6 flex flex-col overflow-hidden font-sans">
      <div className="w-full h-full flex flex-col space-y-0 max-w-[1800px] mx-auto border-x border-slate-100 dark:border-white/5 relative">
        
        {/* Loading Overlay */}
        <AnimatePresence>
          {isLoading && <LoadingOverlay message={`Chargement ${product}`} />}
        </AnimatePresence>

        {/* Header */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 p-6 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-[#050505] shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-8 h-8 bg-cameroon-green/10 rounded text-cameroon-green">
                <Wheat size={16} strokeWidth={2.5} />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {product}
              </h1>
              <span className="px-2 py-1 bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-400 text-xs font-bold rounded">
                {indicator}
              </span>
            </div>
            <p className="text-slate-500 dark:text-neutral-500 text-sm font-medium pl-11">
              Données par département • {selectedYears.length} année(s) sélectionnée(s)
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            {/* Sélecteur d'années */}
            <div className="relative z-50">
              <button
                onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-neutral-900 rounded-xl text-sm font-bold text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors"
              >
                <Calendar size={14} className="text-cameroon-green" />
                <span>{selectedYears.length} année(s)</span>
                <ChevronDown size={14} className={`transition-transform ${isYearDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isYearDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute top-full mt-1 right-0 w-[280px] bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden shadow-xl z-50"
                  >
                    {/* Actions rapides */}
                    <div className="p-2 border-b border-slate-100 dark:border-white/5 flex gap-1 flex-wrap">
                      <button 
                        onClick={() => setSelectedYears(availableYears.slice(0, 5))}
                        className="px-2 py-1 text-[10px] font-bold rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-neutral-400 hover:bg-slate-200"
                      >
                        5 dernières
                      </button>
                      <button 
                        onClick={() => setSelectedYears(availableYears.slice(0, 10))}
                        className="px-2 py-1 text-[10px] font-bold rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-neutral-400 hover:bg-slate-200"
                      >
                        10 dernières
                      </button>
                      <button 
                        onClick={() => setSelectedYears(availableYears)}
                        className="px-2 py-1 text-[10px] font-bold rounded bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-neutral-400 hover:bg-slate-200"
                      >
                        Toutes
                      </button>
                    </div>
                    
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                      {availableYears.map(year => (
                        <button
                          key={year}
                          onClick={() => toggleYear(year)}
                          className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded transition-colors ${
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-8 w-px bg-slate-200 dark:bg-white/10" />

            {/* Filtre région */}
            <div className="relative z-40">
              <button
                onClick={() => setIsRegionDropdownOpen(!isRegionDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-neutral-900 rounded-xl text-sm font-bold text-slate-700 dark:text-neutral-300 hover:bg-slate-200 dark:hover:bg-neutral-800 transition-colors"
              >
                <MapPin size={14} className="text-blue-500" />
                <span>{selectedRegion === 'all' ? 'Toutes régions' : selectedRegion}</span>
                <ChevronDown size={14} className={`transition-transform ${isRegionDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isRegionDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute top-full mt-1 right-0 w-[200px] bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden shadow-xl z-50 max-h-[300px] overflow-y-auto custom-scrollbar"
                  >
                    <button
                      onClick={() => { setSelectedRegion('all'); setIsRegionDropdownOpen(false); }}
                      className={`w-full px-4 py-2 text-sm font-medium text-left transition-colors ${
                        selectedRegion === 'all' 
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                          : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-neutral-400'
                      }`}
                    >
                      Toutes les régions
                    </button>
                    {uniqueRegions.map(region => (
                      <button
                        key={region}
                        onClick={() => { setSelectedRegion(region); setIsRegionDropdownOpen(false); }}
                        className={`w-full px-4 py-2 text-sm font-medium text-left transition-colors ${
                          selectedRegion === region 
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                            : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-neutral-400'
                        }`}
                      >
                        {region}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Champ de recherche */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[180px] pl-9 pr-8 py-2 bg-slate-100 dark:bg-neutral-900 border-0 rounded-xl text-sm font-medium text-slate-700 dark:text-neutral-300 placeholder:text-slate-400 focus:ring-2 focus:ring-cameroon-green/30 outline-none transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            
            {/* Bouton Export avec menu */}
            <ExportButton 
              onExportCSV={handleExportCSV}
              onExportExcel={handleExportExcel}
              disabled={tableData.length === 0 || isLoading}
            />
          </div>
        </header>

        {/* Contenu */}
        <div className="flex-1 overflow-hidden relative">
          {error ? (
            <EmptyState 
              icon={AlertCircle}
              title="Erreur de chargement"
              description={error}
              action={{ label: 'Réessayer', onClick: () => window.location.reload() }}
            />
          ) : tableData.length === 0 && !isLoading ? (
            <EmptyState 
              icon={Database}
              title="Aucune donnée"
              description={`Aucune donnée disponible pour ${product} (${indicator})`}
            />
          ) : (
            <div className="absolute inset-0 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="sticky top-0 z-20 bg-white dark:bg-[#050505]">
                  <tr>
                    <th className="p-4 font-semibold text-slate-500 dark:text-neutral-500 text-[11px] uppercase tracking-widest sticky left-0 z-30 bg-white dark:bg-[#050505] border-b border-r border-slate-200 dark:border-white/10 min-w-[180px]">
                      Département
                    </th>
                    <th className="p-3 font-semibold text-slate-500 dark:text-neutral-500 text-[11px] uppercase tracking-widest border-b border-r border-slate-100 dark:border-white/5 min-w-[100px]">
                      Région
                    </th>
                    {selectedYears.sort((a, b) => b - a).map(year => (
                      <th key={year} className="p-3 font-semibold text-slate-500 dark:text-neutral-500 text-[11px] uppercase tracking-widest text-center border-b border-r border-slate-100 dark:border-white/5 min-w-[120px]">
                        {year}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {tableData.map((row) => (
                    <tr key={row.zone} className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 font-medium text-slate-900 dark:text-white sticky left-0 z-10 bg-white dark:bg-[#050505] group-hover:bg-slate-50 dark:group-hover:bg-[#0A0A0A] transition-colors border-r border-slate-200 dark:border-white/10 text-sm">
                        {row.zone}
                      </td>
                      <td className="p-3 text-xs text-slate-500 dark:text-neutral-500 border-r border-slate-100 dark:border-white/5">
                        {row.region}
                      </td>
                      {selectedYears.sort((a, b) => b - a).map(year => {
                        const val = row[`y${year}`];
                        const trend = getTrend(row, year);
                        
                        return (
                          <td key={year} className="p-3 text-center border-r border-slate-100 dark:border-white/5">
                            {val !== null && val !== undefined ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-neutral-200">
                                  {typeof val === 'number' ? val.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) : val}
                                  <span className="text-[10px] text-slate-400 ml-0.5">{getUnit()}</span>
                                </span>
                                {trend !== null && (
                                  <div className={`flex items-center text-[10px] font-medium gap-0.5 px-1.5 py-0.5 rounded-full ${
                                    trend > 0 
                                      ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                      : trend < 0
                                        ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                                        : 'bg-slate-100 dark:bg-neutral-800 text-slate-500'
                                  }`}>
                                    {trend > 0 ? <ArrowUpRight size={10} strokeWidth={3} /> : trend < 0 ? <ArrowDownRight size={10} strokeWidth={3} /> : null}
                                    <span>{trend > 0 ? '+' : ''}{trend.toFixed(1)}%</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300 dark:text-neutral-700">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Footer avec stats */}
        <footer className="shrink-0 p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-neutral-900/50 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-500">
          <div className="flex items-center gap-4">
            <span><strong>{tableData.length}</strong> enregistrements</span>
            <span>•</span>
            <span><strong>{selectedYears.length}</strong> années</span>
            <span>•</span>
            <span>Source: <strong>GeoServer</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Données en temps réel</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// VUE TABULAIRE ÉLEVAGE - Données GeoServer
// ═══════════════════════════════════════════════════════════════════════════════

const ElevageTabularView = ({ initialYear }: { product: string; initialYear: number }) => {
  const geoServerFilters = useGeoServerFilters();
  const useBackend = DATA_MODE === 'geoserver' && !geoServerFilters.error;
  
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  
  // État pour les données multi-filières
  const [allFilieresData, setAllFilieresData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Années disponibles
  const availableYears = useMemo(() => {
    if (geoServerFilters.elevageYearRange.years?.length) {
      return geoServerFilters.elevageYearRange.years.sort((a, b) => b - a);
    }
    return [2021, 2020];
  }, [geoServerFilters.elevageYearRange]);
  
  // Charger toutes les filières pour l'année sélectionnée
  useEffect(() => {
    if (!useBackend) {
      setIsLoading(false);
      return;
    }
    
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Charger TOUTES les données élevage pour l'année (sans filtre filière)
        const result = await GeoServerAPI.elevage.getRegionalData(undefined, selectedYear);
        
        const data = result.features.map(f => {
          const props = f.properties as any;
          return {
            region: props.region || props.nom_region,
            filiere: props.filiere,
            effectif: props.effectif
          };
        });
        
        setAllFilieresData(data);
        console.log('[TabularView Élevage] Données chargées:', data.length);
      } catch (e) {
        console.error('[TabularView Élevage] Erreur:', e);
        setError('Impossible de charger les données');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [useBackend, selectedYear]);
  
  // Pivot: Régions en lignes, Filières en colonnes
  const { tableData, filieres } = useMemo(() => {
    if (!allFilieresData.length) return { tableData: [], filieres: [] };
    
    const filieresSet = new Set<string>();
    const grouped = new Map<string, Map<string, number>>();
    
    allFilieresData.forEach(row => {
      const region = row.region;
      const filiere = row.filiere;
      if (filiere) filieresSet.add(filiere);
      
      if (!grouped.has(region)) {
        grouped.set(region, new Map());
      }
      grouped.get(region)!.set(filiere, row.effectif);
    });
    
    const filieresList = Array.from(filieresSet).sort();
    
    const result = Array.from(grouped.entries()).map(([region, filiereValues]) => {
      const row: any = { region };
      let total = 0;
      filieresList.forEach(f => {
        const val = filiereValues.get(f) ?? null;
        row[f] = val;
        if (val) total += val;
      });
      row.total = total;
      return row;
    });
    
    return { 
      tableData: result.sort((a, b) => b.total - a.total),
      filieres: filieresList 
    };
  }, [allFilieresData]);

  // ─── FONCTIONS D'EXPORT ÉLEVAGE ─────────────────────────────────────────────
  const handleExportCSV = useCallback(() => {
    if (!tableData.length) return;
    
    const headers = ['Région', ...filieres, 'Total'];
    const rows = tableData.map(row => [
      row.region,
      ...filieres.map(f => row[f] ?? null),
      row.total
    ]);
    
    exportToCSV({
      filename: `elevage_${selectedYear}`,
      headers,
      rows,
      title: `Données Élevage - ${selectedYear}`,
      metadata: {
        'Année': selectedYear.toString(),
        'Filières': filieres.join(', '),
        'Nombre de régions': tableData.length.toString(),
        'Unité': 'têtes'
      }
    });
  }, [tableData, filieres, selectedYear]);

  const handleExportExcel = useCallback(() => {
    if (!tableData.length) return;
    
    const headers = ['Région', ...filieres, 'Total'];
    const rows = tableData.map(row => [
      row.region,
      ...filieres.map(f => row[f] ?? null),
      row.total
    ]);
    
    exportToExcel({
      filename: `elevage_${selectedYear}`,
      headers,
      rows,
      title: `Élevage - Effectifs ${selectedYear}`,
      metadata: {
        'Année': selectedYear.toString(),
        'Filières': filieres.join(', '),
        'Unité': 'têtes'
      }
    });
  }, [tableData, filieres, selectedYear]);

  return (
    <div className="h-full w-full bg-white dark:bg-[#050505] p-0 md:p-6 md:pl-[88px] pt-16 md:pt-6 flex flex-col overflow-hidden font-sans">
      <div className="w-full h-full flex flex-col space-y-0 max-w-[1800px] mx-auto border-x border-slate-100 dark:border-white/5 relative">
        
        <AnimatePresence>
          {isLoading && <LoadingOverlay message="Chargement élevage" />}
        </AnimatePresence>

        {/* Header */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 p-6 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-[#050505] shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded text-amber-600 dark:text-amber-400">
                <Beef size={16} strokeWidth={2.5} />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Effectifs Élevage
              </h1>
              <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded">
                {selectedYear}
              </span>
            </div>
            <p className="text-slate-500 dark:text-neutral-500 text-sm font-medium pl-11">
              Données régionales • Toutes filières • <span className="text-amber-600 dark:text-amber-400">Unité: têtes</span>
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            {/* Sélecteur d'année */}
            <div className="relative z-50">
              <button
                onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-sm font-bold text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
              >
                <Calendar size={14} />
                <span>{selectedYear}</span>
                <ChevronDown size={14} className={`transition-transform ${isYearDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isYearDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute top-full mt-1 right-0 bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden shadow-xl z-50"
                  >
                    {availableYears.map(year => (
                      <button
                        key={year}
                        onClick={() => { setSelectedYear(year); setIsYearDropdownOpen(false); }}
                        className={`w-full px-4 py-2 text-sm font-medium text-left transition-colors ${
                          selectedYear === year 
                            ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' 
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
            
            {/* Bouton Export avec menu */}
            <ExportButton 
              onExportCSV={handleExportCSV}
              onExportExcel={handleExportExcel}
              disabled={tableData.length === 0 || isLoading}
            />
          </div>
        </header>

        {/* Contenu */}
        <div className="flex-1 overflow-hidden relative">
          {error ? (
            <EmptyState icon={AlertCircle} title="Erreur" description={error} />
          ) : tableData.length === 0 && !isLoading ? (
            <EmptyState icon={Database} title="Aucune donnée" description="Aucune donnée élevage disponible" />
          ) : (
            <div className="absolute inset-0 overflow-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-20 bg-white dark:bg-[#050505]">
                  <tr>
                    <th className="p-4 font-semibold text-slate-500 dark:text-neutral-500 text-[11px] uppercase tracking-widest sticky left-0 z-30 bg-white dark:bg-[#050505] border-b border-r border-slate-200 dark:border-white/10 min-w-[150px]">
                      Région
                    </th>
                    {filieres.map(filiere => (
                      <th key={filiere} className="p-3 font-semibold text-slate-500 dark:text-neutral-500 text-[10px] uppercase tracking-widest text-center border-b border-r border-slate-100 dark:border-white/5 min-w-[100px]">
                        <div>{filiere}</div>
                        <div className="text-[9px] font-normal text-slate-400 dark:text-neutral-600 mt-0.5">têtes</div>
                      </th>
                    ))}
                    <th className="p-3 font-semibold text-amber-600 dark:text-amber-400 text-[11px] uppercase tracking-widest text-center border-b border-slate-200 dark:border-white/10 min-w-[120px] bg-amber-50/50 dark:bg-amber-900/10">
                      <div>Total</div>
                      <div className="text-[9px] font-normal text-amber-500/70 dark:text-amber-500/50 mt-0.5">têtes</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {tableData.map(row => (
                    <tr key={row.region} className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 font-medium text-slate-900 dark:text-white sticky left-0 z-10 bg-white dark:bg-[#050505] group-hover:bg-slate-50 dark:group-hover:bg-[#0A0A0A] transition-colors border-r border-slate-200 dark:border-white/10 text-sm">
                        {row.region}
                      </td>
                      {filieres.map(filiere => {
                        const val = row[filiere];
                        return (
                          <td key={filiere} className="p-3 text-center border-r border-slate-100 dark:border-white/5">
                            {val !== null && val !== undefined ? (
                              <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-neutral-200">
                                {val.toLocaleString('fr-FR')}
                              </span>
                            ) : (
                              <span className="text-slate-300 dark:text-neutral-700">—</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-3 text-center bg-amber-50/50 dark:bg-amber-900/10">
                        <span className="text-sm font-bold tabular-nums text-amber-700 dark:text-amber-400">
                          {row.total?.toLocaleString('fr-FR')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <footer className="shrink-0 p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-neutral-900/50 flex items-center justify-between text-xs text-slate-500 dark:text-neutral-500">
          <div className="flex items-center gap-4">
            <span><strong>{tableData.length}</strong> régions</span>
            <span>•</span>
            <span><strong>{filieres.length}</strong> filières</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Données GeoServer</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// VUE TABULAIRE PÊCHE - Données GeoServer
// ═══════════════════════════════════════════════════════════════════════════════

type PecheDataDimension = 'production' | 'infrastructure';

const PECHE_LABELS: Record<string, string> = {
  'etangs': 'Étangs',
  'fumoirs': 'Fumoirs',
  'halls_vente': 'Halls de Vente',
  'bacs': 'Bacs',
  'cages': 'Cages',
  'prod_industrielle': 'Industrielle',
  'prod_continentale': 'Continentale', 
  'prod_artisanale': 'Artisanale',
  'aquaculture': 'Aquaculture',
  'prod_totale': 'Total',
};

// Unités pour chaque indicateur pêche
const PECHE_UNITS: Record<string, string> = {
  'etangs': 'unités',
  'fumoirs': 'unités',
  'halls_vente': 'unités',
  'bacs': 'unités',
  'cages': 'unités',
  'prod_industrielle': 't',
  'prod_continentale': 't', 
  'prod_artisanale': 't',
  'aquaculture': 't',
  'prod_totale': 't',
};

const PECHE_ICONS: Record<string, typeof Fish> = {
  'etangs': Waves,
  'fumoirs': Building2,
  'halls_vente': Warehouse,
  'bacs': Layers,
  'cages': Fish,
  'prod_industrielle': Factory,
  'prod_continentale': Waves,
  'prod_artisanale': Anchor,
  'aquaculture': Fish,
  'prod_totale': BarChart3,
};

interface PecheTabularViewProps {
  initialYear: number;
}

const PecheTabularView = ({ initialYear }: PecheTabularViewProps) => {
  const geoServerFilters = useGeoServerFilters();
  const useBackend = DATA_MODE === 'geoserver' && !geoServerFilters.error;
  
  const [selectedYear, setSelectedYear] = useState<number>(initialYear);
  const [dimension, setDimension] = useState<PecheDataDimension>('production');
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Charger les données GeoServer
  const pecheData = usePecheData({ year: selectedYear, enabled: useBackend });
  
  const isLoading = pecheData.national.loading || pecheData.infraRegional.loading || pecheData.prodDepartement.loading;

  // Années disponibles depuis GeoServer
  const availableYears = useMemo(() => {
    if (geoServerFilters.pecheYearRange.years?.length > 0) {
      return [...geoServerFilters.pecheYearRange.years].sort((a, b) => b - a);
    }
    // Fallback
    return [2021, 2020, 2019, 2018, 2017, 2016, 2015];
  }, [geoServerFilters.pecheYearRange.years]);

  // Données nationales
  const nationalData = useMemo(() => {
    if (pecheData.national.data?.features?.length) {
      return pecheData.national.data.features.map(f => f.properties);
    }
    return MOCK_DB.peche.national;
  }, [pecheData.national.data]);

  const nationalYearData = useMemo(() => 
    nationalData.find(d => d.annee === selectedYear), 
    [nationalData, selectedYear]
  );
  
  const prevYearData = useMemo(() => 
    nationalData.find(d => d.annee === selectedYear - 1), 
    [nationalData, selectedYear]
  );

  // Données régionales (infrastructure)
  const regionalData = useMemo(() => {
    if (pecheData.infraRegional.data?.features?.length) {
      return pecheData.infraRegional.data.features.map(f => ({
        region: f.properties.nom_region,
        annee: f.properties.annee,
        etangs: f.properties.etangs,
        fumoirs: f.properties.fumoirs,
        halls_vente: f.properties.halls_vente,
        bacs: f.properties.bacs,
        cages: f.properties.cages,
      }));
    }
    return MOCK_DB.peche.regional;
  }, [pecheData.infraRegional.data]);

  // Données départementales (production)
  const departementalData = useMemo(() => {
    if (pecheData.prodDepartement.data?.features?.length) {
      return pecheData.prodDepartement.data.features.map(f => ({
        departement: f.properties.nom_dep,
        annee: f.properties.annee,
        valeur: f.properties.prod_totale,
        note: f.properties.note,
      }));
    }
    return MOCK_DB.peche.departemental;
  }, [pecheData.prodDepartement.data]);

  // Filtrer les données départementales par recherche
  const filteredDeptData = useMemo(() => {
    if (!searchTerm) return departementalData;
    return departementalData.filter(d => 
      d.departement?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [departementalData, searchTerm]);

  // Filtrer les données régionales par recherche
  const filteredRegionalData = useMemo(() => {
    if (!searchTerm) return regionalData;
    return regionalData.filter(d => 
      d.region?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [regionalData, searchTerm]);

  // ─── FONCTIONS D'EXPORT PÊCHE ─────────────────────────────────────────────
  const handleExportCSV = useCallback(() => {
    let headers: string[];
    let rows: (string | number | null)[][];
    let filename: string;
    let title: string;
    
    if (dimension === 'production') {
      headers = ['Département', 'Production (tonnes)', 'Note'];
      rows = filteredDeptData.map(d => [d.departement, d.valeur, d.note || '']);
      filename = `peche_production_departements_${selectedYear}`;
      title = `Pêche - Production Départementale ${selectedYear}`;
    } else {
      headers = ['Région', 'Étangs', 'Fumoirs', 'Halls de vente', 'Bacs', 'Cages'];
      rows = filteredRegionalData.map(d => [
        d.region, d.etangs, d.fumoirs, d.halls_vente, d.bacs, d.cages
      ]);
      filename = `peche_infrastructures_${selectedYear}`;
      title = `Pêche - Infrastructures Régionales ${selectedYear}`;
    }
    
    exportToCSV({
      filename,
      headers,
      rows,
      title,
      metadata: {
        'Année': selectedYear.toString(),
        'Dimension': dimension === 'production' ? 'Production' : 'Infrastructures',
        'Nombre de lignes': rows.length.toString()
      }
    });
  }, [dimension, filteredDeptData, filteredRegionalData, selectedYear]);

  const handleExportExcel = useCallback(() => {
    let headers: string[];
    let rows: (string | number | null)[][];
    let filename: string;
    let title: string;
    
    if (dimension === 'production') {
      headers = ['Département', 'Production (tonnes)', 'Note'];
      rows = filteredDeptData.map(d => [d.departement, d.valeur, d.note || '']);
      filename = `peche_production_departements_${selectedYear}`;
      title = `Pêche - Production Départementale ${selectedYear}`;
    } else {
      headers = ['Région', 'Étangs', 'Fumoirs', 'Halls de vente', 'Bacs', 'Cages'];
      rows = filteredRegionalData.map(d => [
        d.region, d.etangs, d.fumoirs, d.halls_vente, d.bacs, d.cages
      ]);
      filename = `peche_infrastructures_${selectedYear}`;
      title = `Pêche - Infrastructures Régionales ${selectedYear}`;
    }
    
    exportToExcel({
      filename,
      headers,
      rows,
      title,
      metadata: {
        'Année': selectedYear.toString(),
        'Dimension': dimension === 'production' ? 'Production' : 'Infrastructures'
      }
    });
  }, [dimension, filteredDeptData, filteredRegionalData, selectedYear]);

  return (
    <div className="h-full w-full bg-white dark:bg-[#050505] p-0 md:p-6 md:pl-[88px] pt-16 md:pt-6 flex flex-col overflow-hidden font-sans">
      <div className="w-full h-full flex flex-col space-y-0 max-w-[1600px] mx-auto border-x border-slate-100 dark:border-white/5 relative">
        
        <AnimatePresence>
          {isLoading && <LoadingOverlay message="Chargement pêche" />}
        </AnimatePresence>

        {/* Header */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 p-6 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-[#050505] shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded text-blue-600 dark:text-blue-400">
                <Fish size={16} strokeWidth={2.5} />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Pêche & Aquaculture</h1>
              {useBackend && (
                <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded">
                  GeoServer
                </span>
              )}
            </div>
            <p className="text-slate-500 dark:text-neutral-500 text-sm font-medium pl-11">
              {dimension === 'production' 
                ? `Production nationale & départementale ${selectedYear}` 
                : `Infrastructures régionales ${selectedYear}`
              }
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={dimension === 'production' ? "Rechercher département..." : "Rechercher région..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-8 py-2 w-48 bg-slate-100 dark:bg-neutral-900 rounded-xl text-sm text-slate-700 dark:text-neutral-300 placeholder:text-slate-400 dark:placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-neutral-800 rounded-full transition-colors"
                >
                  <X size={12} className="text-slate-400" />
                </button>
              )}
            </div>

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
                    className="absolute top-full mt-1 left-0 bg-white dark:bg-[#0A0A0A] border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden shadow-xl z-50 max-h-48 overflow-y-auto"
                  >
                    {availableYears.map(year => (
                      <button
                        key={year}
                        onClick={() => { setSelectedYear(year); setIsYearDropdownOpen(false); }}
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

            {/* Dimension Toggle */}
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
            
            {/* Bouton Export avec menu */}
            <ExportButton 
              onExportCSV={handleExportCSV}
              onExportExcel={handleExportExcel}
              disabled={isLoading}
            />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-white dark:bg-[#050505] relative flex flex-col">
          <div className="absolute inset-0 overflow-auto custom-scrollbar p-6">
            
            {dimension === 'production' && (
              <div className="space-y-8">
                {/* National Summary */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <Globe size={18} className="text-blue-500" />
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Production Nationale {selectedYear}</h2>
                  </div>
                  
                  {nationalYearData ? (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {(['prod_artisanale', 'prod_continentale', 'prod_industrielle', 'aquaculture', 'prod_totale'] as const).map(key => {
                        const Icon = PECHE_ICONS[key] || BarChart3;
                        const val = (nationalYearData as any)[key];
                        const prevVal = prevYearData ? (prevYearData as any)[key] : null;
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
                              {val?.toLocaleString('fr-FR') || 'N/A'}
                              <span className="text-xs font-normal text-slate-400 ml-1">t</span>
                            </div>
                            {trend !== null && (
                              <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${
                                trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-rose-600' : 'text-slate-400'
                              }`}>
                                {trend > 0 ? <ArrowUpRight size={12} /> : trend < 0 ? <ArrowDownRight size={12} /> : null}
                                {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 dark:text-neutral-600 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                      Pas de données nationales pour {selectedYear}
                    </div>
                  )}
                </section>

                {/* Historical Table */}
                <section>
                  <div className="flex items-center gap-3 mb-4">
                    <TrendingUp size={18} className="text-blue-500" />
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Évolution Nationale</h2>
                  </div>
                  
                  <div className="overflow-x-auto border border-slate-200 dark:border-white/10 rounded-xl">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <thead className="bg-slate-50 dark:bg-neutral-900">
                        <tr>
                          <th className="p-3 font-semibold text-slate-500 dark:text-neutral-500 text-[11px] uppercase tracking-widest border-b border-slate-200 dark:border-white/10">Année</th>
                          {(['prod_artisanale', 'prod_continentale', 'prod_industrielle', 'aquaculture', 'prod_totale'] as const).map(key => (
                            <th key={key} className="p-3 font-semibold text-slate-500 dark:text-neutral-500 text-[10px] uppercase tracking-widest text-right border-b border-slate-200 dark:border-white/10">
                              {PECHE_LABELS[key]} <span className="text-slate-400 font-normal">({PECHE_UNITS[key]})</span>
                            </th>
                          ))}
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
                                {(row as any)[key]?.toLocaleString('fr-FR') || '—'}
                                {(row as any)[key] && <span className="text-[10px] text-slate-400 ml-0.5">{PECHE_UNITS[key]}</span>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Départemental Production */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Layers size={18} className="text-purple-500" />
                      <h2 className="text-lg font-bold text-slate-800 dark:text-white">Production par Département</h2>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-neutral-600">
                      {filteredDeptData.length} département{filteredDeptData.length > 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {filteredDeptData.length > 0 ? (
                    <div className="overflow-x-auto border border-slate-200 dark:border-white/10 rounded-xl">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 dark:bg-neutral-900">
                          <tr>
                            <th className="p-3 font-semibold text-slate-500 dark:text-neutral-500 text-[11px] uppercase tracking-widest border-b border-slate-200 dark:border-white/10">Département</th>
                            <th className="p-3 font-semibold text-slate-500 dark:text-neutral-500 text-[11px] uppercase tracking-widest text-right border-b border-slate-200 dark:border-white/10">Production (t)</th>
                            <th className="p-3 font-semibold text-slate-500 dark:text-neutral-500 text-[11px] uppercase tracking-widest border-b border-slate-200 dark:border-white/10">Note</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                          {[...filteredDeptData]
                            .sort((a, b) => (b.valeur || 0) - (a.valeur || 0))
                            .map((row, idx) => {
                              const maxVal = Math.max(...filteredDeptData.map(d => d.valeur || 0), 1);
                              const pct = ((row.valeur || 0) / maxVal) * 100;
                              
                              return (
                                <tr key={row.departement || idx} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors relative">
                                  <td className="p-3 font-medium text-sm text-slate-900 dark:text-white relative">
                                    <div 
                                      className="absolute left-0 top-0 bottom-0 bg-purple-100/50 dark:bg-purple-900/20 transition-all"
                                      style={{ width: `${pct}%` }}
                                    />
                                    <span className="relative z-10">{row.departement}</span>
                                  </td>
                                  <td className="p-3 text-right text-sm tabular-nums font-bold text-purple-600 dark:text-purple-400">
                                    {row.valeur?.toLocaleString('fr-FR') || '—'}
                                  </td>
                                  <td className="p-3 text-xs text-slate-400 dark:text-neutral-600 italic">
                                    {'—'}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 dark:text-neutral-600 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                      {searchTerm ? `Aucun département correspondant à "${searchTerm}"` : 'Pas de données départementales'}
                    </div>
                  )}
                </section>
              </div>
            )}

            {dimension === 'infrastructure' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Building2 size={18} className="text-teal-500" />
                    <h2 className="text-lg font-bold text-slate-800 dark:text-white">Infrastructures par Région</h2>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-neutral-600">
                    {filteredRegionalData.length} région{filteredRegionalData.length > 1 ? 's' : ''}
                  </span>
                </div>
                
                {filteredRegionalData.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 dark:border-white/10 rounded-xl">
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
                                  <span className="text-[9px] text-slate-400 dark:text-neutral-600 font-normal normal-case">({PECHE_UNITS[inf] || 'unités'})</span>
                                </div>
                              </th>
                            );
                          })}
                          <th className="p-3 font-semibold text-slate-500 dark:text-neutral-500 text-[10px] uppercase tracking-widest text-center border-b border-slate-200 dark:border-white/10">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {[...filteredRegionalData].sort((a, b) => {
                          const totalA = PECHE_INFRA_TYPES.reduce((sum, k) => sum + ((a as any)[k] || 0), 0);
                          const totalB = PECHE_INFRA_TYPES.reduce((sum, k) => sum + ((b as any)[k] || 0), 0);
                          return totalB - totalA;
                        }).map(row => {
                          const total = PECHE_INFRA_TYPES.reduce((sum, k) => sum + ((row as any)[k] || 0), 0);
                          
                          return (
                            <tr key={row.region} className="hover:bg-teal-50/50 dark:hover:bg-teal-900/10 transition-colors">
                              <td className="p-4 font-bold text-slate-900 dark:text-white border-r border-slate-200 dark:border-white/10 text-sm sticky left-0 bg-white dark:bg-[#050505] z-10">
                                {row.region}
                              </td>
                              {PECHE_INFRA_TYPES.map(inf => (
                                <td key={inf} className="p-3 text-center">
                                  <span className={`text-sm font-semibold tabular-nums ${
                                    (row as any)[inf] > 0 ? 'text-slate-800 dark:text-neutral-200' : 'text-slate-300 dark:text-neutral-700'
                                  }`}>
                                    {(row as any)[inf]?.toLocaleString('fr-FR') || '—'}
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
                ) : (
                  <div className="p-8 text-center text-slate-400 dark:text-neutral-600 border border-dashed border-slate-200 dark:border-white/10 rounded-xl">
                    {searchTerm ? `Aucune région correspondant à "${searchTerm}"` : 'Pas de données d\'infrastructure'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// VUE TABULAIRE OVERVIEW (Référentiel)
// ═══════════════════════════════════════════════════════════════════════════════

const OverviewTabularView = () => (
  <div className="h-full w-full bg-white dark:bg-[#050505] p-0 md:p-6 md:pl-[88px] pt-16 md:pt-6 flex flex-col overflow-hidden font-sans">
    <div className="w-full h-full flex flex-col items-center justify-center max-w-[800px] mx-auto">
      <div className="text-center p-8">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-100 dark:bg-neutral-900 flex items-center justify-center">
          <Globe size={36} className="text-slate-400 dark:text-neutral-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-3">Mode Référentiel</h2>
        <p className="text-slate-500 dark:text-neutral-500 max-w-md mx-auto mb-6">
          La vue tabulaire n'est pas disponible en mode référentiel. 
          Sélectionnez un thème pour visualiser les données.
        </p>
        <div className="flex justify-center gap-3">
          <div className="px-4 py-2 bg-cameroon-green/10 text-cameroon-green rounded-lg text-sm font-bold flex items-center gap-2">
            <Wheat size={16} />
            Agriculture
          </div>
          <div className="px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-sm font-bold flex items-center gap-2">
            <Beef size={16} />
            Élevage
          </div>
          <div className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-bold flex items-center gap-2">
            <Fish size={16} />
            Pêche
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL - Routage selon le thème
// ═══════════════════════════════════════════════════════════════════════════════

export const TabularView = ({ selectedProduct, activeTheme, years, selectedIndicator = 'Production' }: TabularViewProps) => {
  if (activeTheme === 'overview') {
    return <OverviewTabularView />;
  }
  
  if (activeTheme === 'peche') {
    return <PecheTabularView initialYear={years[0]} />;
  }
  
  if (activeTheme === 'elevage') {
    return <ElevageTabularView product={selectedProduct} initialYear={years[0]} />;
  }
  
  // Agriculture (par défaut)
  return (
    <AgricultureTabularView 
      product={selectedProduct} 
      indicator={selectedIndicator} 
      initialYear={years[0]} 
    />
  );
};
