import { useState, useEffect, useMemo, useRef } from 'react'; // Added useRef
import { Sidebar, type ThemeMode } from '../components/layout/Sidebar';
import { MapContainer, type BasemapType } from '../components/map/MapContainer';
import { MapTools } from '../components/map/MapTools';
import { TabularView } from './TabularView';
import { Search, Filter, Play, Pause, ChevronRight, Layers, Map as MapIcon, Globe, Calendar, GripVertical, Check, X, Minimize2, Maximize2 } from 'lucide-react';
import { CROPS, LIVESTOCK, FISHERIES, FISH_INFRASTRUCTURE, generateMockData } from '../data/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet'; // Need L types

export const Geoportal = () => {
    // State: View & Theme
    const [view, setView] = useState<'map' | 'table'>('map');
    const [activeTheme, setActiveTheme] = useState<ThemeMode>('agriculture');
    const [sidebarPanelOpen, setSidebarPanelOpen] = useState(false);
  
    // State: Data & Layer Selection
    const [aggregationLevel, setAggregationLevel] = useState<'national' | 'region' | 'department'>('region');
    const [selectedProduct, setSelectedProduct] = useState<string | null>(CROPS[0]);
    const [years, setYears] = useState<number[]>([2022]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showLayerConfig, setShowLayerConfig] = useState(true); 
    const [productSearchTerm, setProductSearchTerm] = useState('');
    
    // Layer visibility toggles (for admin boundaries display only)
    const [visibleLayers, setVisibleLayers] = useState<{region: boolean; department: boolean; commune: boolean}>({ region: true, department: false, commune: false });

    // Map Ref
    const mapRef = useRef<L.Map | null>(null);
    
    // Dynamic Configuration based on Theme
    const sectorConfig = useMemo(() => {
        switch (activeTheme) {
            case 'agriculture': return { products: CROPS, minYear: 1998, maxYear: 2022, defaultYear: 2022 };
            case 'elevage': return { products: LIVESTOCK, minYear: 2015, maxYear: 2021, defaultYear: 2021 };
            case 'peche': return { products: [...FISHERIES, ...FISH_INFRASTRUCTURE], minYear: 2015, maxYear: 2021, defaultYear: 2021 };
            default: return { products: CROPS, minYear: 2000, maxYear: 2022, defaultYear: 2022 };
        }
    }, [activeTheme]);

    // Derived State for Products List
    const currentList = useMemo(() => {
        return sectorConfig.products
            .filter(item => item.toLowerCase().includes(productSearchTerm.toLowerCase()))
            .sort((a,b) => a.localeCompare(b));
    }, [sectorConfig, productSearchTerm]);

    // Handle Theme Change
    const handleThemeChange = (newTheme: ThemeMode) => {
      setActiveTheme(newTheme);
      setProductSearchTerm('');
      
      const newConfig = newTheme === 'agriculture' ? { products: CROPS, defaultYear: 2022 } 
                      : newTheme === 'elevage' ? { products: LIVESTOCK, defaultYear: 2021 }
                      : { products: FISHERIES, defaultYear: 2021 };
                      
      setSelectedProduct(newConfig.products[0]);
      setYears([newConfig.defaultYear]);
    };
    
    // Basemap & LocalStorage
    const [basemap, setBasemap] = useState<BasemapType>(() => {
       return localStorage.getItem('fox_basemap') as BasemapType || 'osm';
    });
    const [showBasemapSelector, setShowBasemapSelector] = useState(false);
    const [isDateWidgetCollapsed, setIsDateWidgetCollapsed] = useState(false);
    
    const handleBasemapChange = (newBasemap: BasemapType) => {
      setBasemap(newBasemap);
      localStorage.setItem('fox_basemap_user_override', 'true');
    };
  
    // Sync Basemap
    useEffect(() => {
      const handleThemeChange = () => {
        const userOverride = localStorage.getItem('fox_basemap_user_override') === 'true';
        if (!userOverride) {
          const isDark = document.documentElement.classList.contains('dark');
          setBasemap(isDark ? 'dark' : 'osm');
        }
      };
      
      const userOverride = localStorage.getItem('fox_basemap_user_override') === 'true';
      if (!userOverride) {
        const isDark = localStorage.getItem('fox_theme') === 'dark';
        setBasemap(isDark ? 'dark' : 'osm');
      }
  
      window.addEventListener('theme-change', handleThemeChange);
      return () => window.removeEventListener('theme-change', handleThemeChange);
    }, []);
  
    useEffect(() => {
       localStorage.setItem('fox_basemap', basemap);
    }, [basemap]);
    
    // Data Memoization
    const data = useMemo(() => generateMockData(), []);
  
    // ACTIONS
    const handleProductSelect = (p: string) => {
        setSelectedProduct(p);
    };

    const toggleLayerVisibility = (layer: 'region' | 'department' | 'commune') => {
        setVisibleLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
    };

    const handleZoomIn = () => mapRef.current?.zoomIn();
    const handleZoomOut = () => mapRef.current?.zoomOut();
    const handleResetView = () => mapRef.current?.flyTo([7.3697, 12.3547], 6, { duration: 1.5 });
    
    // ACTION: Locate User
    const handleLocate = () => {
        if (!mapRef.current) return;
        mapRef.current.locate({ setView: true, maxZoom: 10 });
        
        mapRef.current.once('locationfound', (e) => {
             L.popup()
              .setLatLng(e.latlng)
              .setContent('<div class="text-xs font-bold text-center">Vous êtes ici</div>')
              .openOn(mapRef.current!);
        });
        
        mapRef.current.once('locationerror', () => {
            alert('Impossible de vous localiser.');
        });
    };

    // ACTION: Fullscreen
    const handleFullscreen = () => {
         if (mapRef.current && (mapRef.current as any).toggleFullscreen) {
            (mapRef.current as any).toggleFullscreen();
         }
    };
  
    // Animation Loop
    useEffect(() => {
      let interval: any;
      if (isPlaying) {
        interval = setInterval(() => {
          setYears(prev => {
             const current = prev[0];
             const max = sectorConfig.maxYear;
             const min = sectorConfig.minYear;
             const next = current >= max ? min : current + 1;
             return [next];
          });
        }, 1500);
      }
      return () => clearInterval(interval);
    }, [isPlaying, sectorConfig]);
  
    const toggleYear = (y: number) => {
        setYears([y]);
    };
  
    const availableYears = Array.from(
        { length: sectorConfig.maxYear - sectorConfig.minYear + 1 }, 
        (_, i) => sectorConfig.maxYear - i
    );
  
    return (
      <div className="relative h-screen w-full bg-slate-50 flex overflow-hidden font-sans">
        
        {/* 1. Global Sidebar */}
      <Sidebar 
        view={view} 
        onViewChange={setView}
        activeTheme={activeTheme}
        onThemeChange={handleThemeChange}
        activePanel={sidebarPanelOpen}
        onTogglePanel={() => setSidebarPanelOpen(!sidebarPanelOpen)}
        onSettingsClick={() => {}} 
      >
        <div className="p-5 flex flex-col gap-8 h-full">
                
          {/* Layer Visibility Toggles */}
          <div className="space-y-3">
             <div 
               onClick={() => setShowLayerConfig(!showLayerConfig)}
               className="flex items-center justify-between cursor-pointer group"
             >
                <h3 className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-[0.2em] group-hover:text-cameroon-green transition-colors">Couches Limites</h3>
                <ChevronRight size={14} className={`text-slate-300 dark:text-neutral-600 transition-transform ${showLayerConfig ? 'rotate-90' : ''}`} />
             </div>
             
             <AnimatePresence>
                {showLayerConfig && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="flex flex-col gap-1.5 p-1">
                            {[
                                { id: 'region', label: 'Régions', icon: Globe },
                                { id: 'department', label: 'Départements', icon: MapIcon },
                                { id: 'commune', label: 'Arrondissements', icon: Layers }
                            ].map((level) => (
                                <div
                                    key={level.id}
                                    onClick={() => toggleLayerVisibility(level.id as any)}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-[12px] font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-800 transition-all bg-white dark:bg-neutral-900 border border-slate-100 dark:border-white/10"
                                >
                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                                        visibleLayers[level.id as keyof typeof visibleLayers]
                                            ? 'bg-cameroon-green border-cameroon-green' 
                                            : 'border-slate-300 dark:border-neutral-600'
                                    }`}>
                                        {visibleLayers[level.id as keyof typeof visibleLayers] && <Check size={10} className="text-white" strokeWidth={3} />}
                                    </div>
                                    <level.icon size={14} className="text-slate-400 dark:text-neutral-500" />
                                    <span className="flex-1 text-left text-slate-600 dark:text-neutral-300">{level.label}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
             </AnimatePresence>
          </div>

          {/* Product/Variable Selection */}
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col pt-2 border-t border-slate-50 dark:border-white/5">
             <div className="flex flex-col gap-2 px-1">
                <h3 className="text-[11px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-[0.2em]">
                    {activeTheme === 'overview' ? 'Indicateurs' : 'Filières'}
                </h3>
                {/* Aggregation Level Selector */}
                {activeTheme !== 'overview' && (
                    <div className="flex gap-1 p-0.5 bg-slate-100 dark:bg-neutral-900 rounded-lg">
                        {[
                            { id: 'national', label: 'Nat.' },
                            { id: 'region', label: 'Rég.' },
                            { id: 'department', label: 'Dép.' }
                        ].map(level => (
                            <button
                                key={level.id}
                                onClick={() => setAggregationLevel(level.id as any)}
                                className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                                    aggregationLevel === level.id
                                        ? 'bg-white dark:bg-neutral-800 text-cameroon-green shadow-sm'
                                        : 'text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-neutral-300'
                                }`}
                            >
                                {level.label}
                            </button>
                        ))}
                    </div>
                )}
             </div>
             
             {/* Search Bar */}
             {activeTheme !== 'overview' && (
                <div className="px-1">
                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-neutral-900 border border-slate-100 dark:border-white/10 rounded-lg px-2 py-1.5 focus-within:ring-1 focus-within:ring-cameroon-green/30 focus-within:bg-white dark:focus-within:bg-neutral-800 transition-all">
                        <Search size={14} className="text-slate-400 dark:text-neutral-500" />
                        <input 
                            type="text" 
                            value={productSearchTerm}
                            onChange={(e) => setProductSearchTerm(e.target.value)}
                            placeholder="Filtrer..."
                            className="bg-transparent border-none text-[12px] w-full focus:outline-none placeholder:text-slate-400 dark:placeholder:text-neutral-500 dark:text-white"
                        />
                        {productSearchTerm && (
                            <button onClick={() => setProductSearchTerm('')} className="text-slate-400 dark:text-neutral-500 hover:text-slate-600 dark:hover:text-white"><X size={12} /></button>
                        )}
                    </div>
                </div>
             )}

             <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                {activeTheme === 'overview' ? (
                   <div className="text-sm text-slate-400 dark:text-neutral-500 italic p-2">Vue synthétique en cours de développement...</div>
                ) : (
                    currentList.map(item => (
                    <motion.button
                        key={item}
                        whileHover={{ x: 4 }}
                        onClick={() => handleProductSelect(item)}
                        className={`w-full group flex items-center justify-between p-3 rounded-xl text-left transition-all border ${
                        selectedProduct === item 
                        ? 'bg-cameroon-green text-white shadow-lg shadow-cameroon-green/20 border-transparent' 
                        : 'bg-white dark:bg-neutral-900 border-slate-100 dark:border-white/5 text-slate-600 dark:text-neutral-300 hover:border-cameroon-green/30 dark:hover:border-cameroon-green/30 hover:shadow-md'
                        }`}
                    >
                        <span className="text-[13px] font-medium">{item}</span>
                        {selectedProduct === item && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />}
                    </motion.button>
                    ))
                )}
             </div>
          </div>

        </div>
      </Sidebar>

      {/* 2. Main Content Area */}
      <main className="flex-1 relative h-full w-full">
        
        {/* Top Floating Bar - ONLY VISIBLE IN MAP VIEW */}
        <AnimatePresence>
          {view === 'map' && (
             <div className="absolute top-14 left-2 right-2 md:top-6 md:left-32 md:right-auto md:w-[480px] z-[2000] pointer-events-none flex flex-col gap-2">
                <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="w-full h-10 md:h-12 glass rounded-full flex items-center px-2 pointer-events-auto border border-white/60 dark:border-white/10 shadow-xl ring-1 ring-black/5"
                >
                    <div className="w-8 md:w-10 h-full flex items-center justify-center flex-shrink-0">
                    <Search size={16} className="md:w-[18px] md:h-[18px] text-slate-400 dark:text-neutral-500" />
                    </div>
                    <input 
                        type="text" 
                        placeholder="Chercher..." 
                        className="flex-1 bg-transparent border-none focus:ring-0 text-xs md:text-[13px] font-medium outline-none placeholder:text-slate-400 dark:placeholder:text-neutral-500 h-full text-slate-700 dark:text-neutral-200"
                    />
                    <button className="p-1.5 md:p-2 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-full transition-colors relative hidden sm:block">
                        <Filter size={14} className="md:w-[16px] md:h-[16px] text-slate-500 dark:text-neutral-400" />
                    </button>
                    <div className="w-px h-4 md:h-6 bg-slate-200 dark:bg-neutral-700 mx-1.5 md:mx-2 hidden sm:block" />
                    <div className="pr-1 hidden sm:block">
                        <div className="w-7 md:w-8 h-7 md:h-8 rounded-full bg-cameroon-red text-white flex items-center justify-center text-xs font-bold border-2 border-white dark:border-neutral-900 shadow-sm ring-2 ring-red-100 dark:ring-red-900/20">
                            A
                        </div>
                    </div>
                </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Date Widget - Draggable */}
        <AnimatePresence>
           {view === 'map' && (
              <motion.div
                 drag
                 dragMomentum={false}
                 dragConstraints={{ left: -500, right: 0, top: 0, bottom: 500 }}
                 initial={{ opacity: 0, x: 50 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: 50 }}
                 className="absolute top-3 md:top-6 right-3 md:right-6 z-[5000] pointer-events-auto"
              >
                  <motion.div 
                    animate={{ 
                        height: isDateWidgetCollapsed ? 'auto' : 'auto',
                        width: isDateWidgetCollapsed ? 160 : 160, 
                    }}
                    transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                    className="glass-panel rounded-xl md:rounded-2xl shadow-2xl border border-white/60 dark:border-white/10 overflow-hidden flex flex-col"
                    style={{ maxHeight: isDateWidgetCollapsed ? '50px' : '350px' }}
                  >
                      
                      <div className="p-2 md:p-3 bg-slate-50/80 dark:bg-black/80 backdrop-blur-md border-b border-slate-100 dark:border-white/5 flex items-center justify-between cursor-move active:cursor-grabbing group">
                          <div className="flex items-center gap-1.5 md:gap-2 text-slate-500 dark:text-neutral-400">
                             <Calendar size={12} className="md:w-[14px] md:h-[14px]" />
                             <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider">
                                {isDateWidgetCollapsed ? `${years.length} Année(s)` : 'Période'}
                             </span>
                          </div>
                          <div className="flex items-center gap-0.5 md:gap-1">
                            <button 
                                onClick={() => setIsDateWidgetCollapsed(!isDateWidgetCollapsed)}
                                className="p-0.5 md:p-1 hover:bg-slate-200 dark:hover:bg-neutral-800 rounded text-slate-400 hover:text-slate-600 dark:hover:text-neutral-200 transition-colors pointer-cursor"
                            >
                                {isDateWidgetCollapsed ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
                            </button>
                            <GripVertical size={14} className="text-slate-300 dark:text-neutral-600 group-hover:text-slate-400 transition-colors" />
                          </div>
                      </div>
                      
                      {!isDateWidgetCollapsed && (
                        <>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                                {availableYears.map(yr => (
                                    <div 
                                        key={yr}
                                        onClick={() => toggleYear(yr)}
                                        className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all mb-0.5 ${
                                            years.includes(yr) 
                                            ? 'bg-cameroon-green/10 text-cameroon-green' 
                                            : 'hover:bg-slate-50 dark:hover:bg-neutral-800 text-slate-600 dark:text-neutral-300'
                                        }`}
                                    >
                                        <span className={`text-[13px] font-mono ${years.includes(yr) ? 'font-bold' : 'font-medium'}`}>{yr}</span>
                                        {years.includes(yr) && (
                                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                <div className="w-4 h-4 rounded bg-cameroon-green flex items-center justify-center">
                                                    <Check size={10} className="text-white" strokeWidth={3} />
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="p-2 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/50 flex justify-center">
                                <button 
                                    onClick={() => setIsPlaying(!isPlaying)}
                                    className="w-full py-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-white/10 shadow-sm text-[11px] font-bold text-slate-600 dark:text-neutral-300 hover:text-cameroon-green hover:border-cameroon-green/30 flex items-center justify-center gap-2 transition-all"
                                >
                                    {isPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                                    {isPlaying ? 'PAUSE' : 'ANIMER'}
                                </button>
                            </div>
                        </>
                      )}
                  </motion.div>
              </motion.div>
           )}
        </AnimatePresence>

        {/* Content Switcher */}
        <div className="absolute inset-0 z-0">
            {view === 'map' ? (
                <div className="w-full h-full relative">
                    <MapContainer 
                        onMapReady={(map) => { mapRef.current = map; }}
                        data={data}
                        year={years[0]} 
                        product={selectedProduct || ''}
                        indicator={activeTheme === 'elevage' ? 'Effectif' : 'Production'}
                        basemap={basemap}
                        adminLevel={aggregationLevel === 'national' ? 'region' : aggregationLevel}
                    />

                    {/* NEW MAP TOOLS - FLOATING RIGHT */}
                    <MapTools 
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        onResetView={handleResetView}
                        onLocate={handleLocate}
                        onFullscreen={handleFullscreen}
                    />
                    
                    {/* Basemap Switcher */}
                    <div 
                        className="absolute bottom-20 left-2 md:bottom-8 md:left-32 z-[1000]"
                        onClick={() => setShowBasemapSelector(!showBasemapSelector)}
                        onMouseEnter={() => window.innerWidth > 768 && setShowBasemapSelector(true)}
                        onMouseLeave={() => window.innerWidth > 768 && setShowBasemapSelector(false)}
                    >
                        <motion.div 
                            layout
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className={`bg-white dark:bg-black rounded-xl shadow-xl overflow-hidden ring-4 ring-white dark:ring-neutral-900 cursor-pointer group ${showBasemapSelector ? 'w-auto h-auto' : 'w-16 h-16'}`}
                        >
                            {!showBasemapSelector ? (
                                <motion.div layoutId="preview" className="w-16 h-16 relative">
                                    <img 
                                        src={
                                            basemap === 'satellite' ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/8/8" : 
                                            basemap === 'dark' ? "https://a.basemaps.cartocdn.com/dark_all/4/8/8.png" : 
                                            basemap === 'osm' ? "https://a.tile.openstreetmap.org/4/8/8.png" :
                                            "https://a.basemaps.cartocdn.com/light_all/4/8/8.png"
                                        } 
                                        className="w-full h-full object-cover" 
                                        alt="Basemap" 
                                    />
                                    <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[9px] font-bold text-center py-0.5 backdrop-blur-sm">CALQUES</div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.2 }}
                                    className="p-2 flex gap-2"
                                >
                                    {[
                                      { id: 'light', label: 'Clair', img: "https://a.basemaps.cartocdn.com/light_all/4/8/8.png" },
                                      { id: 'dark', label: 'Sombre', img: "https://a.basemaps.cartocdn.com/dark_all/4/8/8.png" },
                                      { id: 'satellite', label: 'Satellite', img: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/8/8" },
                                      { id: 'terrain', label: 'Terrain', img: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/4/8/8" },
                                      { id: 'osm', label: 'OSM', img: "https://a.tile.openstreetmap.org/4/8/8.png" },
                                    ].map(b => (
                                        <div 
                                            key={b.id} 
                                            onClick={() => handleBasemapChange(b.id as BasemapType)}
                                            className={`relative w-16 h-16 rounded-lg overflow-hidden cursor-pointer ring-2 transition-all ${basemap === b.id ? 'ring-cameroon-green scale-105 z-10' : 'ring-transparent hover:ring-slate-300 dark:hover:ring-neutral-600'}`}
                                        >
                                            <img src={b.img} className="w-full h-full object-cover" alt={b.label} />
                                            <div className={`absolute inset-x-0 bottom-0 py-0.5 text-[8px] font-bold text-center backdrop-blur-sm ${basemap === b.id ? 'bg-cameroon-green text-white' : 'bg-black/50 text-white'}`}>
                                                {b.label}
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </motion.div>
                    </div>
                </div>
            ) : (
                <div className="w-full h-full bg-slate-50 dark:bg-black">
                    <TabularView 
                        selectedProduct={selectedProduct || ''}
                        activeTheme={activeTheme}
                        years={years}
                    />
                </div>
            )}
        </div>

      </main>
    </div>
  );
};

