import { useState, useEffect, useMemo, useRef } from 'react';
import { Sidebar, type ThemeMode } from '../components/layout/Sidebar';
import { MapContainer, type BasemapType } from '../components/map/MapContainer';
import { MapTools } from '../components/map/MapTools';
import { TabularView } from './TabularView';
import { Search, Play, Pause, ChevronRight, Layers, Map as MapIcon, Globe, Calendar, GripVertical, Check, X, Minimize2, Maximize2, TrendingUp, BarChart2, Wheat, Beef, Fish, Eye, EyeOff, MapPin, Loader2, Wifi, WifiOff } from 'lucide-react';
import { CROPS, LIVESTOCK_FILIERES, FISHERIES, PECHE_INFRA_TYPES, AGRI_INDICATORS, generateMockData } from '../data/mockData';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import L from 'leaflet';
import { useGeoServerFilters, useAgricultureData, useElevageData, usePecheData, useAdminGeoJSON } from '../hooks/useGeoServer';
import { DATA_MODE } from '../config';
import type { DataPoint } from '../data/mockData';

export const Geoportal = () => {
    // State: View & Theme
    const [view, setView] = useState<'map' | 'table'>('map');
    const [activeTheme, setActiveTheme] = useState<ThemeMode>('overview'); // Démarrage en mode référentiel (divisions admin)
    const [sidebarPanelOpen, setSidebarPanelOpen] = useState(false);
  
    // State: Data & Layer Selection
    const [selectedProduct, setSelectedProduct] = useState<string | null>(null); // Pas de produit par défaut
    const [selectedIndicator, setSelectedIndicator] = useState<string>('Production');
    const [analysisLevel, setAnalysisLevel] = useState<'region' | 'department'>('department');
    const [years, setYears] = useState<number[]>([2022]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showLayerConfig, setShowLayerConfig] = useState(true); 
    const [productSearchTerm, setProductSearchTerm] = useState('');

    // Place Search State
    const [placeSearchQuery, setPlaceSearchQuery] = useState('');
    const [placeSearchResults, setPlaceSearchResults] = useState<any[]>([]);
    const [isPlaceSearching, setIsPlaceSearching] = useState(false);
    const [flyToLocation, setFlyToLocation] = useState<{lat: number, lng: number, label: string} | null>(null);

    // Debounced Search Effect
    useEffect(() => {
        if (!placeSearchQuery || placeSearchQuery.length < 3) {
            setPlaceSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsPlaceSearching(true);
            try {
                // Nominatim Search (Cameroon restricted)
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${placeSearchQuery}&countrycodes=cm&limit=5&addressdetails=1`);
                const data = await res.json();
                setPlaceSearchResults(data);
            } catch (e) {
                console.error("Search error", e);
            } finally {
                setIsPlaceSearching(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [placeSearchQuery]);


    // Layer visibility toggles - Ces couches sont RÉFÉRENTIELLES (pas d'analyse thématique)
    const [layers, setLayers] = useState([
      { id: 'region', label: 'Régions (10)', icon: Globe, visible: true },
      { id: 'department', label: 'Départements (58)', icon: MapIcon, visible: false },
      { id: 'arrondissement', label: 'Arrondissements', icon: Layers, visible: false },
      { id: 'chefsLieux', label: 'Chefs-lieux', icon: MapIcon, visible: false }
    ]);

    // Map Ref
    const mapRef = useRef<L.Map | null>(null);

    // ═══════════════════════════════════════════════════════════════════════════
    // GEOSERVER INTEGRATION - Chargement dynamique des filtres
    // ═══════════════════════════════════════════════════════════════════════════
    const geoServerFilters = useGeoServerFilters();
    const useBackend = DATA_MODE === 'geoserver' && !geoServerFilters.error;

    // ─── DONNÉES THÉMATIQUES GEOSERVER ───────────────────────────────────────
    const agricultureData = useAgricultureData({
      product: selectedProduct || '',
      indicator: selectedIndicator,
      year: years[0],
      enabled: useBackend && activeTheme === 'agriculture' && !!selectedProduct
    });

    const elevageData = useElevageData({
      filiere: selectedProduct || undefined,
      year: years[0],
      level: 'regional',
      enabled: useBackend && activeTheme === 'elevage' && !!selectedProduct
    });

    // ─── DONNÉES PÊCHE GEOSERVER ─────────────────────────────────────────────
    const pecheData = usePecheData({
      year: years[0],
      enabled: useBackend && activeTheme === 'peche' && !!selectedProduct
    });
    
    // ─── ÉTAT DE CHARGEMENT GLOBAL ─────────────────────────────────────────────
    const isThematicDataLoading = useMemo(() => {
      if (activeTheme === 'overview') return false;
      if (activeTheme === 'agriculture') return agricultureData.loading;
      if (activeTheme === 'elevage') return elevageData.loading;
      if (activeTheme === 'peche') return pecheData.infraRegional.loading || pecheData.prodDepartement.loading;
      return false;
    }, [activeTheme, agricultureData.loading, elevageData.loading, pecheData.infraRegional.loading, pecheData.prodDepartement.loading]);

    // ─── GÉOMÉTRIES RÉFÉRENTIELLES (toutes les couches admin) ──────────────
    const regionsGeoJSON = useAdminGeoJSON('regions');
    const departementsGeoJSON = useAdminGeoJSON('departements');
    const arrondissementsGeoJSON = useAdminGeoJSON('arrondissements');
    const chefsLieuxDepGeoJSON = useAdminGeoJSON('chefsLieuxDep');
    const chefsLieuxArrondGeoJSON = useAdminGeoJSON('chefsLieuxArrond');
    
    useEffect(() => {
      if (regionsGeoJSON.data) {
        console.log('[Geoportal] 🌍 Régions GeoServer chargées:', regionsGeoJSON.data.features.length);
      }
      if (departementsGeoJSON.data) {
        console.log('[Geoportal] 🗺️ Départements GeoServer chargés:', departementsGeoJSON.data.features.length);
      }
      if (arrondissementsGeoJSON.data) {
        console.log('[Geoportal] 📍 Arrondissements GeoServer chargés:', arrondissementsGeoJSON.data.features.length);
      }
      if (chefsLieuxDepGeoJSON.data) {
        console.log('[Geoportal] 🏛️ Chefs-lieux Dép. chargés:', chefsLieuxDepGeoJSON.data.features.length);
      }
      if (chefsLieuxArrondGeoJSON.data) {
        console.log('[Geoportal] 🏢 Chefs-lieux Arrond. chargés:', chefsLieuxArrondGeoJSON.data.features.length);
      }
    }, [regionsGeoJSON.data, departementsGeoJSON.data, arrondissementsGeoJSON.data, chefsLieuxDepGeoJSON.data, chefsLieuxArrondGeoJSON.data]);

    // Préparer les données de couches pour le MapContainer
    const adminLayersData = useMemo(() => ({
      regions: regionsGeoJSON.data,
      departements: departementsGeoJSON.data,
      arrondissements: arrondissementsGeoJSON.data,
      chefsLieuxDep: chefsLieuxDepGeoJSON.data,
      chefsLieuxArrond: chefsLieuxArrondGeoJSON.data
    }), [regionsGeoJSON.data, departementsGeoJSON.data, arrondissementsGeoJSON.data, chefsLieuxDepGeoJSON.data, chefsLieuxArrondGeoJSON.data]);

    // ─── SYNC INDICATEUR AVEC GEOSERVER ────────────────────────────
    // Synchronise UNIQUEMENT l'indicateur et l'année, PAS le produit (choix utilisateur)
    useEffect(() => {
      if (!useBackend) return;
      
      if (activeTheme === 'agriculture' && geoServerFilters.indicators.length > 0) {
        // SYNC INDICATEUR UNIQUEMENT - pas de sélection automatique du produit
        if (!geoServerFilters.indicators.includes(selectedIndicator)) {
          const firstIndicator = geoServerFilters.indicators[0];
          console.log('%c[Geoportal] 🔄 Sync indicateur avec GeoServer:', 'color: #10B981; font-weight: bold;', firstIndicator);
          setSelectedIndicator(firstIndicator);
        }
      }
      // Pour élevage: ne rien présélectionner non plus
    }, [useBackend, activeTheme, geoServerFilters.indicators, selectedIndicator]);

    // Sync année avec les vraies plages GeoServer
    useEffect(() => {
      if (!useBackend) return;
      
      if (activeTheme === 'agriculture' && geoServerFilters.agriYearRange.max > 0) {
        if (years[0] < geoServerFilters.agriYearRange.min || years[0] > geoServerFilters.agriYearRange.max) {
          console.log('%c[Geoportal] 🔄 Sync année avec GeoServer:', 'color: #10B981; font-weight: bold;', geoServerFilters.agriYearRange.max);
          setYears([geoServerFilters.agriYearRange.max]);
        }
      } else if (activeTheme === 'elevage' && geoServerFilters.elevageYearRange.max > 0) {
        if (years[0] < geoServerFilters.elevageYearRange.min || years[0] > geoServerFilters.elevageYearRange.max) {
          setYears([geoServerFilters.elevageYearRange.max]);
        }
      }
    }, [useBackend, activeTheme, geoServerFilters.agriYearRange, geoServerFilters.elevageYearRange, years]);
    
    // Dynamic Configuration based on Theme (avec fallback sur mock si backend KO)
    const sectorConfig = useMemo(() => {
        switch (activeTheme) {
            case 'agriculture': 
              return { 
                products: useBackend && geoServerFilters.products.length > 0 
                  ? geoServerFilters.products 
                  : CROPS, 
                indicators: useBackend && geoServerFilters.indicators.length > 0 
                  ? geoServerFilters.indicators 
                  : AGRI_INDICATORS,
                minYear: useBackend ? geoServerFilters.agriYearRange.min : 1998, 
                maxYear: useBackend ? geoServerFilters.agriYearRange.max : 2022, 
                defaultYear: useBackend ? geoServerFilters.agriYearRange.max : 2022,
                granularity: 'departementale' as const
              };
            case 'elevage': 
              return { 
                products: useBackend && geoServerFilters.filieres.length > 0 
                  ? geoServerFilters.filieres 
                  : LIVESTOCK_FILIERES, 
                indicators: ['Effectif'],
                minYear: useBackend ? geoServerFilters.elevageYearRange.min : 2020,
                maxYear: useBackend ? geoServerFilters.elevageYearRange.max : 2021, 
                defaultYear: useBackend ? geoServerFilters.elevageYearRange.max : 2021,
                granularity: 'regionale' as const
              };
            case 'peche': 
              return { 
                // Pour la pêche, les "produits" sont en fait les indicateurs cartographiables
                products: ['Production Totale', 'Étangs', 'Fumoirs', 'Halls de vente', 'Bacs', 'Cages'],
                indicators: ['Production', 'etangs', 'fumoirs', 'halls_vente', 'bacs', 'cages'],
                minYear: useBackend ? geoServerFilters.pecheYearRange.min : 2015,
                maxYear: useBackend ? geoServerFilters.pecheYearRange.max : 2021, 
                defaultYear: useBackend ? geoServerFilters.pecheYearRange.max : 2021,
                granularity: 'multiscalaire' as const
              };
            default: 
              return { 
                products: CROPS, 
                indicators: ['Production'],
                minYear: 2000, 
                maxYear: 2022, 
                defaultYear: 2022,
                granularity: 'departementale' as const
              };
        }
    }, [activeTheme, useBackend, geoServerFilters]);

        const thematicLevels = useMemo<Array<'region' | 'department'>>(() => {
            if (activeTheme === 'agriculture') return ['department', 'region'];
            if (activeTheme === 'elevage') return ['region'];
            if (activeTheme === 'peche') return ['department', 'region'];
            return [];
        }, [activeTheme]);

    // Derived State for Products List
    const currentList = useMemo(() => {
        return [...sectorConfig.products]
            .filter(item => item.toLowerCase().includes(productSearchTerm.toLowerCase()))
            .sort((a,b) => a.localeCompare(b));
    }, [sectorConfig, productSearchTerm]);

    // Handle Theme Change - Utilise les vraies valeurs GeoServer si disponibles
    const handleThemeChange = (newTheme: ThemeMode) => {
      setActiveTheme(newTheme);
      setProductSearchTerm('');
      
      // Déterminer les vrais produits/filières à utiliser
      const getConfig = () => {
        if (newTheme === 'agriculture') {
          const products = useBackend && geoServerFilters.products.length > 0 
            ? geoServerFilters.products 
            : CROPS;
          const indicators = useBackend && geoServerFilters.indicators.length > 0
            ? geoServerFilters.indicators
            : ['Production', 'Area Planted', 'Yield'];
          const defaultYear = useBackend ? geoServerFilters.agriYearRange.max || 2008 : 2008;
          return { products, indicators, defaultYear, indicator: indicators[0], level: 'department' as const };
        }
        if (newTheme === 'elevage') {
          const products = useBackend && geoServerFilters.filieres.length > 0
            ? geoServerFilters.filieres
            : LIVESTOCK_FILIERES;
          const defaultYear = useBackend ? geoServerFilters.elevageYearRange.max || 2021 : 2021;
          return { products, indicators: ['Effectif'], defaultYear, indicator: 'Effectif', level: 'region' as const };
        }
        // Pêche
        const defaultYear = useBackend ? geoServerFilters.pecheYearRange.max || 2021 : 2021;
        return { products: FISHERIES, indicators: ['Production'], defaultYear, indicator: 'Production', level: 'department' as const };
      };
      
      const newConfig = getConfig();
      console.log('%c[Geoportal] 🔄 Changement thème vers', 'color: #8B5CF6;', newTheme, newConfig);
                      
      // Ne PAS présélectionner de produit - attendre le choix utilisateur
      setSelectedProduct(null);
      setSelectedIndicator(newConfig.indicator);
      setAnalysisLevel(newConfig.level);
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
    
    // Data Memoization - Transformation WFS → DataPoint[]
    const data = useMemo((): DataPoint[] => {
      // Si données GeoServer disponibles pour Agriculture
      if (useBackend && activeTheme === 'agriculture' && agricultureData.data?.features?.length) {
        const features = agricultureData.data.features;
        console.log('[Geoportal] 🗺️ Utilisation données GeoServer Agriculture:', features.length, 'features');
        
        // Détecter si les données ont un champ département
        const sampleProps = features[0]?.properties as any;
        const hasDeptData = !!(sampleProps?.departement || sampleProps?.nom_dep || sampleProps?.adm2_name1);
        
        return features.map((f, idx) => {
          const props = f.properties as any;
          
          // Extraire région avec toutes les variantes possibles
          const regionName = props.region || props.nom_region || props.Region || props.REGION || props.adm1_name1 || 'Unknown';
          
          // Département: uniquement si le champ existe vraiment dans les données
          const deptName = hasDeptData 
            ? (props.departement || props.nom_dep || props.Departement || props.DEPARTEMENT || props.adm2_name1 || regionName)
            : regionName; // Si pas de dept, utiliser region (données régionales)
          
          // DEBUG: Afficher les noms de départements des données GeoServer
          if (idx < 3 && hasDeptData) {
            console.log(`[Geoportal] 🏷️ Données dept #${idx}:`, {
              raw_departement: props.departement,
              raw_nom_dep: props.nom_dep,
              extracted: deptName,
              region: regionName
            });
          }
          
          return {
            fnid: f.id || `gs-agri-${idx}`,
            region: regionName,
            department: deptName,
            product: props.product || selectedProduct || '',
            season_year: props.annee || years[0],
            indicator: props.indicator || selectedIndicator,
            value: props.valeur ?? props.value ?? null,
            unit: props.unite || 'unité',
            status: 'confirmed' as const,
            granularity: hasDeptData ? 'departmental' as const : 'regional' as const
          };
        });
      }
      
      // Si données GeoServer disponibles pour Élevage
      if (useBackend && activeTheme === 'elevage' && elevageData.data?.features?.length) {
        console.log('[Geoportal] 🗺️ Utilisation données GeoServer Élevage:', elevageData.data.features.length, 'features');
        
        return elevageData.data.features.map((f, idx) => {
          const props = f.properties as any;
          return {
            fnid: f.id || `gs-elev-${idx}`,
            region: props.region || props.nom_region || 'Unknown',
            department: props.region || 'Unknown', // Élevage = niveau régional
            product: props.filiere || selectedProduct || '',
            season_year: props.annee || years[0],
            indicator: 'Effectif',
            value: props.effectif ?? null,
            unit: 'têtes',
            status: 'confirmed' as const,
            granularity: 'regional' as const
          };
        });
      }

      // Si données GeoServer disponibles pour Pêche
      if (useBackend && activeTheme === 'peche') {
        const isInfraIndicator = PECHE_INFRA_TYPES.includes(selectedIndicator as any);
        
        // Infrastructure régionale (etangs, fumoirs, etc.)
        if (isInfraIndicator && pecheData.infraRegional.data?.features?.length) {
          console.log('[Geoportal] 🎣 Utilisation données GeoServer Pêche Infra:', pecheData.infraRegional.data.features.length, 'features');
          
          return pecheData.infraRegional.data.features.map((f, idx) => {
            const props = f.properties as any;
            const indicatorKey = selectedIndicator.toLowerCase().replace(/ /g, '_');
            return {
              fnid: f.id || `gs-peche-infra-${idx}`,
              region: props.nom_region || 'Unknown',
              department: props.nom_region || 'Unknown', // Niveau régional
              product: selectedProduct || 'Infrastructure',
              season_year: props.annee || years[0],
              indicator: selectedIndicator,
              value: props[indicatorKey] ?? null,
              unit: 'unités',
              status: 'confirmed' as const,
              granularity: 'regional' as const
            };
          });
        }
        
        // Production départementale
        if (!isInfraIndicator && pecheData.prodDepartement.data?.features?.length) {
          console.log('[Geoportal] 🎣 Utilisation données GeoServer Pêche Prod Dép:', pecheData.prodDepartement.data.features.length, 'features');
          
          return pecheData.prodDepartement.data.features.map((f, idx) => {
            const props = f.properties as any;
            return {
              fnid: f.id || `gs-peche-prod-${idx}`,
              region: 'Cameroun', // Pas de région dans v_peche_prod_departement
              department: props.nom_dep || 'Unknown',
              product: selectedProduct || 'Production',
              season_year: props.annee || years[0],
              indicator: 'Production',
              value: props.prod_totale ?? null,
              unit: 'tonnes',
              status: 'confirmed' as const,
              granularity: 'departmental' as const
            };
          });
        }
      }
      
      // Fallback Mock data
      console.log('[Geoportal] 📦 Utilisation données MOCK (backend:', useBackend, ', theme:', activeTheme, ')');
      return generateMockData();
    }, [useBackend, activeTheme, agricultureData.data, elevageData.data, pecheData.infraRegional.data, pecheData.prodDepartement.data, selectedProduct, selectedIndicator, years]);

        // Détecter si les données agriculture sont régionales ou départementales
        const agricultureDataLevel = useMemo(() => {
          if (agricultureData.data?.features?.length) {
            const props = agricultureData.data.features[0]?.properties as any;
            const hasDept = !!(props?.departement || props?.nom_dep || props?.adm2_name1);
            return hasDept ? 'departmental' : 'regional';
          }
          return 'regional'; // Par défaut régional
        }, [agricultureData.data]);
        
        // Clamp analysis level based on data availability
        useEffect(() => {
            if (activeTheme === 'elevage') {
                if (analysisLevel !== 'region') setAnalysisLevel('region');
                return;
            }

            if (activeTheme === 'peche') {
                const isInfra = PECHE_INFRA_TYPES.includes(selectedIndicator as any);
                if (isInfra && analysisLevel !== 'region') {
                    setAnalysisLevel('region');
                }
                return;
            }

            if (activeTheme === 'agriculture') {
                // Si données régionales uniquement, forcer niveau région
                if (agricultureDataLevel === 'regional' && analysisLevel === 'department') {
                    setAnalysisLevel('region');
                    return;
                }
                if (!['department', 'region'].includes(analysisLevel)) {
                    setAnalysisLevel(agricultureDataLevel === 'regional' ? 'region' : 'department');
                }
            }
        }, [activeTheme, selectedIndicator, analysisLevel]);
  
    // Mapping pour la pêche: label affiché → indicateur réel
    const pecheIndicatorMap: Record<string, string> = {
      'Production Totale': 'Production',
      'Étangs': 'etangs',
      'Fumoirs': 'fumoirs', 
      'Halls de vente': 'halls_vente',
      'Bacs': 'bacs',
      'Cages': 'cages'
    };

    // ACTIONS
    const handleProductSelect = (p: string) => {
        setSelectedProduct(p);
        
        // Pour la pêche, le "produit" sélectionné détermine l'indicateur
        if (activeTheme === 'peche') {
          const mappedIndicator = pecheIndicatorMap[p];
          if (mappedIndicator) {
            setSelectedIndicator(mappedIndicator);
            // Ajuster automatiquement le niveau d'analyse
            if (mappedIndicator === 'Production') {
              setAnalysisLevel('department');
            } else {
              setAnalysisLevel('region'); // Infrastructure = niveau régional
            }
          }
        }
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
        
        {/* ═══ INDICATEUR DE CHARGEMENT THÉMATIQUE (CENTRE DE LA CARTE) ═══ */}
        <AnimatePresence>
          {isThematicDataLoading && view === 'map' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[8000] pointer-events-none"
            >
              <div className="bg-white/95 dark:bg-black/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 px-6 py-4 flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full border-3 border-slate-200 dark:border-neutral-800" />
                  <div className="absolute inset-0 w-10 h-10 rounded-full border-3 border-transparent border-t-cameroon-green animate-spin" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm font-bold text-slate-800 dark:text-white">
                    Chargement des données
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-neutral-400">
                    {activeTheme === 'agriculture' && selectedProduct && `${selectedProduct} • ${selectedIndicator}`}
                    {activeTheme === 'elevage' && selectedProduct && `${selectedProduct} • Effectifs`}
                  </span>
                </div>
                <div className="loader-line w-32 mt-1" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ═══ BACKEND STATUS INDICATOR ═══ */}
        <div className="fixed bottom-4 right-4 z-[9999] pointer-events-none">
          <AnimatePresence>
            {geoServerFilters.loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white text-xs font-bold rounded-full shadow-lg"
              >
                <Loader2 size={14} className="animate-spin" />
                Connexion GeoServer...
              </motion.div>
            )}
            {!geoServerFilters.loading && useBackend && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-3 py-2 bg-emerald-500 text-white text-xs font-bold rounded-full shadow-lg"
              >
                <Wifi size={14} />
                Backend connecté
              </motion.div>
            )}
            {!geoServerFilters.loading && geoServerFilters.error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-2 bg-amber-500 text-white text-xs font-bold rounded-full shadow-lg"
              >
                <WifiOff size={14} />
                Mode hors-ligne (mock)
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
        <div className="flex flex-col gap-6 h-full pb-4">
                
          {/* Layer Visibility Toggles - ONLY IN REFERENTIAL MODE */}
          {activeTheme === 'overview' && (
          <div className="space-y-3">
             <div 
               onClick={() => setShowLayerConfig(!showLayerConfig)}
               className="flex items-center justify-between cursor-pointer group bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5 hover:border-cameroon-green/50 transition-colors"
             >
                <div className="flex items-center gap-2">
                    <Layers size={16} className="text-cameroon-green" />
                    <h3 className="text-xs font-bold text-slate-700 dark:text-neutral-300">CALQUES ADMINISTRATIFS</h3>
                </div>
                <ChevronRight size={14} className={`text-slate-400 dark:text-neutral-500 transition-transform ${showLayerConfig ? 'rotate-90' : ''}`} />
             </div>
             
             <AnimatePresence>
                {showLayerConfig && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <Reorder.Group axis="y" values={layers} onReorder={setLayers} className="flex flex-col gap-2 pt-1">
                            {layers.map((layer) => {
                                // Determine specific styling based on layer ID
                                const getLayerColor = (id: string, visible: boolean) => {
                                    if (!visible) return { 
                                        border: 'border-slate-100 dark:border-white/5', 
                                        bg: 'bg-white dark:bg-neutral-900', 
                                        iconBg: 'bg-slate-50 dark:bg-neutral-800',
                                        iconText: 'text-slate-400 dark:text-neutral-500', 
                                        text: 'text-slate-400 dark:text-neutral-500' 
                                    };
                                    
                                    switch(id) {
                                        case 'region': return { 
                                            border: 'border-blue-500/30', bg: 'bg-blue-50/30 dark:bg-blue-900/10', 
                                            iconBg: 'bg-blue-100 dark:bg-blue-900/30', iconText: 'text-blue-600 dark:text-blue-400',
                                            text: 'text-slate-700 dark:text-neutral-200'
                                        };
                                        case 'department': return { 
                                            border: 'border-teal-500/30', bg: 'bg-teal-50/30 dark:bg-teal-900/10', 
                                            iconBg: 'bg-teal-100 dark:bg-teal-900/30', iconText: 'text-teal-600 dark:text-teal-400',
                                            text: 'text-slate-700 dark:text-neutral-200'
                                        };
                                        case 'arrondissement': return { 
                                            border: 'border-purple-500/30', bg: 'bg-purple-50/30 dark:bg-purple-900/10', 
                                            iconBg: 'bg-purple-100 dark:bg-purple-900/30', iconText: 'text-purple-600 dark:text-purple-400',
                                            text: 'text-slate-700 dark:text-neutral-200'
                                        };
                                        case 'chefsLieux': return { 
                                            border: 'border-amber-500/30', bg: 'bg-amber-50/30 dark:bg-amber-900/10', 
                                            iconBg: 'bg-amber-100 dark:bg-amber-900/30', iconText: 'text-amber-600 dark:text-amber-400',
                                            text: 'text-slate-700 dark:text-neutral-200'
                                        };
                                        default: return { 
                                            border: 'border-cameroon-green/30', bg: 'bg-white dark:bg-neutral-900', 
                                            iconBg: 'bg-slate-50 dark:bg-neutral-800', iconText: 'text-slate-500 dark:text-neutral-400',
                                            text: 'text-slate-700 dark:text-neutral-200'
                                        };
                                    }
                                };
                                
                                const style = getLayerColor(layer.id, layer.visible);
                                
                                return (
                                <Reorder.Item key={layer.id} value={layer} className="relative">
                                    <div
                                        className={`flex items-center gap-3 px-3 py-3 rounded-xl border transition-all select-none ${style.bg} ${style.border} ${!layer.visible && 'opacity-60'}`}
                                    >
                                        <div className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-slate-300 dark:text-neutral-600 hover:text-slate-500 transition-colors">
                                           <GripVertical size={14} />
                                        </div>
                                        
                                        <div className={`flex items-center justify-center p-1.5 rounded-lg ${style.iconBg} ${style.iconText}`}>
                                            <layer.icon size={14} />
                                        </div>
                                        
                                        <span className={`flex-1 text-[12px] font-medium ${style.text}`}>
                                            {layer.label}
                                        </span>

                                        <button 
                                            onPointerDown={(e) => e.stopPropagation()}
                                            onClick={() => {
                                                const newLayers = layers.map(l => l.id === layer.id ? { ...l, visible: !l.visible } : l);
                                                setLayers(newLayers);
                                            }}
                                            className={`p-1.5 rounded-lg transition-colors ${
                                                layer.visible 
                                                ? `${style.iconText.replace('text-', 'bg-').replace('600', '100').replace('400', '900/20')} hover:brightness-95` 
                                                : 'text-slate-400 hover:text-slate-600 dark:text-neutral-600 dark:hover:text-neutral-400'
                                            }`}
                                        >
                                            {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                        </button>
                                    </div>
                                </Reorder.Item>
                                );
                            })}
                        </Reorder.Group>
                    </motion.div>
                )}
             </AnimatePresence>
          </div>
          )}

          {/* Product/Variable Selection */}
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
             {/* Controls Group */}
             <div className="flex flex-col gap-3">
                
                {/* Indicator Selector (for Agriculture) - BUTTON GROUP STYLE */}
                {activeTheme === 'agriculture' && (
                    <div className="bg-slate-100 dark:bg-neutral-900 p-1 rounded-xl flex gap-1">
                        {sectorConfig.indicators.map(ind => (
                            <button
                                key={ind}
                                onClick={() => setSelectedIndicator(ind)}
                                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wide rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                                    selectedIndicator === ind
                                        ? 'bg-white dark:bg-neutral-800 text-cameroon-green shadow-sm ring-1 ring-black/5 dark:ring-white/10'
                                        : 'text-slate-500 dark:text-neutral-500 hover:text-slate-700 dark:hover:text-neutral-300 hover:bg-white/50 dark:hover:bg-white/5'
                                }`}
                            >
                                {(ind === 'Production' || ind.toLowerCase().includes('prod')) && <BarChart2 size={12} />}
                                {(ind === 'Area Planted' || ind.toLowerCase().includes('area') || ind.toLowerCase().includes('surface')) && <Layers size={12} />}
                                {(ind === 'Yield' || ind.toLowerCase().includes('yield') || ind.toLowerCase().includes('rendement')) && <TrendingUp size={12} />}
                                {ind.toLowerCase().includes('prod') ? 'Prod' : 
                                 ind.toLowerCase().includes('area') || ind.toLowerCase().includes('surface') ? 'Surface' : 
                                 ind.toLowerCase().includes('yield') || ind.toLowerCase().includes('rendement') ? 'Rendement' : ind}
                            </button>
                        ))}
                    </div>
                )}

                {/* Thematic Analysis Level - TOGGLE STYLE */}
                {activeTheme !== 'overview' && thematicLevels.length > 0 && (
                    <div className="flex items-center justify-between bg-slate-50 dark:bg-neutral-900/50 p-1 rounded-xl border border-slate-100 dark:border-white/10">
                         <span className="text-[10px] font-bold  tracking-wider text-slate-400 dark:text-neutral-500 pl-3">Niv d'analyse :</span>
                         <div className="flex gap-1">
                            {(['region', 'department'] as const).map(level => {
                                const isAvailable = thematicLevels.includes(level);
                                return (
                                    <button
                                        key={level}
                                        onClick={() => isAvailable && setAnalysisLevel(level)}
                                        className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${
                                            analysisLevel === level
                                                ? 'bg-cameroon-green text-white shadow-sm'
                                                : isAvailable
                                                ? 'text-slate-500 dark:text-neutral-500 hover:bg-white dark:hover:bg-neutral-800'
                                                : 'text-slate-300 dark:text-neutral-800 cursor-not-allowed opacity-50'
                                        }`}
                                    >
                                        {level === 'region' ? 'Région' : 'Département'}
                                    </button>
                                );
                            })}
                         </div>
                    </div>
                )}
                
                {/* Search Bar - IMPROVED */}
                {activeTheme !== 'overview' && (
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Search size={14} className="text-slate-400 dark:text-neutral-500 group-focus-within:text-cameroon-green transition-colors" />
                        </div>
                        <input 
                            type="text" 
                            value={productSearchTerm}
                            onChange={(e) => setProductSearchTerm(e.target.value)}
                            placeholder={activeTheme === 'agriculture' ? "Rechercher une culture..." : "Rechercher..."}
                            className="w-full bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-cameroon-green/20 focus:border-cameroon-green transition-all dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-600"
                        />
                        {productSearchTerm && (
                            <button 
                                onClick={() => setProductSearchTerm('')} 
                                className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                )}
             </div>

             {/* List Content */}
             <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-2 pr-3 pb-safe">
                {activeTheme === 'overview' ? (
                     <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/10 text-center">
                        <Globe className="mx-auto mb-2 text-blue-400" size={24} />
                        <p className="text-xs text-blue-600 dark:text-blue-300 font-medium leading-relaxed">
                            Mode Référentiel
                            <br/>
                            <span className="opacity-70 font-normal">Activez les calques ci-dessus pour visualiser les limites administratives.</span>
                        </p>
                     </div>
                ) : (
                    <div className="grid gap-2">
                        {currentList.map((item, idx) => (
                        <motion.button
                            key={item}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            onClick={() => handleProductSelect(item)}
                            className={`w-full group flex items-center justify-between p-3.5 rounded-xl text-left transition-all border relative overflow-hidden ${
                            selectedProduct === item 
                            ? 'bg-cameroon-green text-white shadow-lg shadow-cameroon-green/20 border-transparent' 
                            : 'bg-white dark:bg-neutral-900 border-slate-100 dark:border-white/5 text-slate-700 dark:text-neutral-300 hover:border-cameroon-green/30 dark:hover:border-cameroon-green/30 hover:shadow-md'
                            }`}
                        >
                            <span className="text-[13px] font-semibold relative z-10">{item}</span>
                            {selectedProduct === item && (
                                <motion.div layoutId="selectedDot" className="w-2 h-2 rounded-full bg-white shadow-sm relative z-10" />
                            )}
                            
                            {/* Subtle background decoration for selected item */}
                            {selectedProduct === item && (
                                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                                     {activeTheme === 'agriculture' && <Wheat size={64} />}
                                     {activeTheme === 'elevage' && <Beef size={64} />}
                                     {activeTheme === 'peche' && <Fish size={64} />}
                                </div>
                            )}
                        </motion.button>
                        ))}
                        
                        {currentList.length === 0 && (
                            <div className="text-center py-8 text-slate-400 dark:text-neutral-600 text-xs">
                                Aucun résultat trouvé
                            </div>
                        )}
                    </div>
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
                    className="w-full h-10 md:h-12 glass rounded-2xl flex items-center px-2 pointer-events-auto border border-white/60 dark:border-white/10 shadow-xl ring-1 ring-black/5 relative z-20"
                >
                    <div className="w-8 md:w-10 h-full flex items-center justify-center flex-shrink-0">
                        {isPlaceSearching ? (
                            <Loader2 size={16} className="animate-spin text-cameroon-green" />
                        ) : (
                            <Search size={16} className="md:w-[18px] md:h-[18px] text-slate-400 dark:text-neutral-500" />
                        )}
                    </div>
                    <input 
                        type="text" 
                        value={placeSearchQuery}
                        onChange={(e) => setPlaceSearchQuery(e.target.value)}
                        placeholder="Rechercher un lieu, une région, une ville..." 
                        className="flex-1 bg-transparent border-none focus:ring-0 text-xs md:text-[13px] font-medium outline-none placeholder:text-slate-400 dark:placeholder:text-neutral-500 h-full text-slate-700 dark:text-neutral-200"
                    />
                    
                    {placeSearchQuery && (
                        <button 
                            onClick={() => {
                                setPlaceSearchQuery('');
                                setPlaceSearchResults([]);
                            }}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-neutral-800 rounded-full text-slate-400 mr-2"
                        >
                            <X size={14} />
                        </button>
                    )}

                    <div className="w-px h-4 md:h-6 bg-slate-200 dark:bg-neutral-700 mx-1.5 md:mx-2 hidden sm:block" />
                    <div className="pr-1 hidden sm:block">
                        <div className="w-7 md:w-8 h-7 md:h-8 rounded-full bg-cameroon-red text-white flex items-center justify-center text-xs font-bold border-2 border-white dark:border-neutral-900 shadow-sm ring-2 ring-red-100 dark:ring-red-900/20">
                            A
                        </div>
                    </div>
                </motion.div>

                {/* Autocomplete Dropdown */}
                <AnimatePresence>
                    {(placeSearchResults.length > 0 || (placeSearchQuery.length >= 3 && !isPlaceSearching && placeSearchResults.length === 0)) && (
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="pointer-events-auto bg-white/90 dark:bg-black/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-white/10 overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar"
                        >
                            {placeSearchResults.length > 0 ? (
                                <div className="py-2">
                                    <div className="px-4 py-2 text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider flex items-center justify-between">
                                        <span>Meilleurs résultats</span>
                                        <span className="text-[9px] bg-slate-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-slate-500">Nominatim</span>
                                    </div>
                                    {placeSearchResults.map((place, i) => (
                                        <div
                                            key={place.place_id || i}
                                            onClick={() => {
                                                setFlyToLocation({
                                                    lat: parseFloat(place.lat),
                                                    lng: parseFloat(place.lon),
                                                    label: place.display_name.split(',')[0]
                                                });
                                                setPlaceSearchQuery(place.display_name.split(',')[0]);
                                                setPlaceSearchResults([]);
                                            }}
                                            className="px-4 py-3 hover:bg-cameroon-green/5 dark:hover:bg-white/5 cursor-pointer flex items-start gap-3 transition-colors border-b border-slate-50 dark:border-white/5 last:border-0 group"
                                        >
                                            <div className="mt-0.5 w-6 h-6 rounded-full bg-slate-50 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-cameroon-green group-hover:text-white transition-colors text-slate-400">
                                                <MapPin size={12} className="group-hover:text-white transition-colors" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-bold text-slate-700 dark:text-neutral-200 group-hover:text-cameroon-green transition-colors">
                                                    {place.display_name.split(',')[0]}
                                                </div>
                                                <div className="text-[10px] text-slate-500 dark:text-neutral-500 line-clamp-1">
                                                    {place.display_name}
                                                </div>
                                            </div>
                                            <div className="text-[9px] font-mono text-slate-300 dark:text-neutral-600 self-center">
                                                {place.type}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center flex flex-col items-center gap-2 text-slate-400 dark:text-neutral-500">
                                    <MapPin size={24} className="opacity-20" />
                                    <p className="text-xs font-medium">Aucun lieu trouvé pour "{placeSearchQuery}"</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
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
                        indicator={selectedIndicator}
                        basemap={basemap}
                        adminLevel={analysisLevel}
                        flyToLocation={flyToLocation}
                        regionsGeoJSON={regionsGeoJSON.data}
                        adminLayers={adminLayersData}
                        layerConfig={layers}
                        activeTheme={activeTheme}
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
                        className="absolute bottom-20 left-2 md:bottom-8 md:left-4 z-[1000]"
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
                        selectedIndicator={selectedIndicator}
                    />
                </div>
            )}
        </div>

      </main>
    </div>
  );
};

