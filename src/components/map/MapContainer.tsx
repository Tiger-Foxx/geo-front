import { MapContainer as LeafletMap, TileLayer, GeoJSON, useMap, useMapEvents, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-fullscreen/dist/leaflet.fullscreen.css';
import type { DataPoint } from '../../data/mockData';
import React, { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import L from 'leaflet';
import 'leaflet-fullscreen';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';


// Fix default icon
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export type BasemapType = 'light' | 'dark' | 'satellite' | 'terrain' | 'osm';

// Type pour la configuration des couches
export interface LayerConfig {
  id: string;
  label: string;
  icon: any;
  visible: boolean;
}

// Type pour les données GeoJSON des couches admin
export interface AdminLayersData {
  regions: GeoJSON.FeatureCollection | null;
  departements: GeoJSON.FeatureCollection | null;
  arrondissements: GeoJSON.FeatureCollection | null;
  chefsLieuxDep?: GeoJSON.FeatureCollection | null;
  chefsLieuxArrond?: GeoJSON.FeatureCollection | null;
}

interface MapContainerProps {
  data: DataPoint[];
  year: number;
  product: string;
  indicator: string;
  basemap?: BasemapType;
  adminLevel?: 'region' | 'department' | 'commune';
  flyToLocation?: { lat: number; lng: number; label: string } | null;
  onFeatureClick?: (feature: any) => void;
  onMapReady?: (map: L.Map) => void;
  /** GeoJSON des régions depuis GeoServer (fallback: données statiques) */
  regionsGeoJSON?: GeoJSON.FeatureCollection | null;
  /** Toutes les couches admin GeoServer */
  adminLayers?: AdminLayersData;
  /** Configuration des couches (visibilité, ordre) */
  layerConfig?: LayerConfig[];
  /** Thème actif (overview, agriculture, élevage, pêche) */
  activeTheme?: 'overview' | 'agriculture' | 'elevage' | 'peche';
}

const BASEMAP_URLS: Record<BasemapType, string> = {
    light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    terrain: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}",
    osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
};

// Cameroon Regions GeoJSON removed as it was unused and caused build error


// Dynamic color scale (amber-100 → amber-300 → green-400 → emerald-600)
const getColorScale = (value: number | null, min: number, max: number, isDark: boolean): string => {
  if (value === null) return isDark ? '#374151' : '#E5E7EB';
  if (value === 0) return isDark ? '#1F2937' : '#FEF3C7'; // amber-100 for zero
  
  const normalized = Math.min(1, Math.max(0, (value - min) / (max - min || 1)));
  
  // Gradient: amber-100 → amber-300 → green-400 → emerald-600
  const colors = [
    { r: 254, g: 243, b: 199 }, // amber-100
    { r: 252, g: 211, b: 77 },  // amber-300
    { r: 74, g: 222, b: 128 },  // green-400
    { r: 5, g: 150, b: 105 },   // emerald-600
  ];
  
  const idx = normalized * (colors.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.min(lower + 1, colors.length - 1);
  const t = idx - lower;
  
  const r = Math.round(colors[lower].r + t * (colors[upper].r - colors[lower].r));
  const g = Math.round(colors[lower].g + t * (colors[upper].g - colors[lower].g));
  const b = Math.round(colors[lower].b + t * (colors[upper].b - colors[lower].b));
  
  return `rgb(${r}, ${g}, ${b})`;
};

// Component to handle map updates
const MapUpdater = ({ center, zoom, flyToLocation }: { center: [number, number]; zoom: number; flyToLocation?: { lat: number, lng: number, label: string } | null }) => {
  const map = useMap();
  
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8, easeLinearity: 0.5 });
  }, [center, zoom, map]);

  useEffect(() => {
    if (flyToLocation) {
      map.flyTo([flyToLocation.lat, flyToLocation.lng], 12, { duration: 1.5 });
      L.popup({
        className: 'glass-popup',
        closeButton: true,
        autoClose: true,
        closeOnClick: true,
        offset: [0, -10]
      })
      .setLatLng([flyToLocation.lat, flyToLocation.lng])
      .setContent(`<div class="font-bold text-sm text-center px-1">${flyToLocation.label}</div>`)
      .openOn(map);
    }
  }, [flyToLocation, map]);

  return null;
};

// Fullscreen Control removed to use manual trigger via MapTools

// CURSOR-FOLLOWING TOOLTIP
interface TooltipData {
  name: string;
  capital?: string;
  value: number | null;
  status: string;
}

const CursorTooltip = ({ data, mousePos, unit, year }: { 
  data: TooltipData | null; 
  mousePos: { x: number; y: number };
  unit: string;
  year: number;
}) => {
  if (!data) return null;
  
  // Offset tooltip from cursor
  const offsetX = 20;
  const offsetY = 20;
  
  return (
    <div 
      className="fixed z-[99999] pointer-events-none"
      style={{ 
        left: mousePos.x + offsetX, 
        top: mousePos.y + offsetY,
        transform: 'translate(0, 0)'
      }}
    >
      <div className="glass-panel px-4 py-3 rounded-xl shadow-2xl border border-white/50 dark:border-white/10 backdrop-blur-xl min-w-[180px] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-white/5">
          <div className="w-2.5 h-2.5 rounded-full bg-cameroon-green shadow-sm animate-pulse" />
          <div>
            <h4 className="font-bold text-slate-800 dark:text-white text-sm leading-tight">{data.name}</h4>
            {data.capital && (
              <span className="text-[9px] text-slate-400 dark:text-neutral-500 uppercase tracking-wider">
                {data.capital}
              </span>
            )}
          </div>
        </div>
        
        {/* Value */}
        <div className="flex justify-between items-baseline gap-4">
          <span className="text-[10px] text-slate-400 dark:text-neutral-500 font-medium">{year}</span>
          <span className={`font-mono text-sm font-bold ${
            data.status === 'unavailable' ? 'text-slate-400 italic' 
            : data.value === 0 ? 'text-slate-400' 
            : 'text-cameroon-green'
          }`}>
            {data.status === 'unavailable' ? 'N/A' : data.value === 0 ? '0' : data.value?.toLocaleString('fr-FR')}
            {data.status !== 'unavailable' && data.value !== 0 && (
              <span className="text-[9px] text-slate-400 ml-1 font-normal">{unit}</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
};

// Mouse Position Tracker
const MouseTracker = ({ onMouseMove }: { onMouseMove: (pos: { x: number; y: number }) => void }) => {
  useMapEvents({
    mousemove: (e) => {
      onMouseMove({ x: e.originalEvent.clientX, y: e.originalEvent.clientY });
    }
  });
  return null;
};

export const MapContainer = ({ 
  data, year, product, indicator, basemap = 'osm', adminLevel = 'region', 
  flyToLocation, onFeatureClick, onMapReady, regionsGeoJSON,
  adminLayers, layerConfig, activeTheme = 'overview'
}: MapContainerProps) => {
  const center: [number, number] = [7.3697, 12.3547];
  const zoom = 6;
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [renderKey, setRenderKey] = useState(0); // Force re-render du GeoJSON
  
  // Ref pour éviter les closures stales dans les event handlers Leaflet
  const aggregatedDataRef = useRef<Map<string, { value: number | null; status: string; count: number }>>(new Map());
  
  // Capture map instance
  const MapInstanceCapture = () => {
    const map = useMap();
    useEffect(() => {
        if (onMapReady) onMapReady(map);
        // Map is ready when tiles load
        map.whenReady(() => {
          setTimeout(() => setIsMapLoading(false), 200);
        });
    }, [map]);
    return null;
  };
  
  // Show loading when data changes
  useEffect(() => {
    if (data.length > 0) {
      setIsMapLoading(true);
      const timer = setTimeout(() => setIsMapLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [year, product, indicator, data.length]);
  
  // Loading state pour les données thématiques
  const isDataLoading = useMemo(() => {
    // Si on a des données mais qu'elles ne correspondent pas aux filtres actuels
    return data.length === 0;
  }, [data.length]);
  
  const isDark = useMemo(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  }, []);

  // GeoJSON à afficher (GeoServer uniquement - pas de fallback statique)
  const displayGeoJSON = useMemo(() => {
    if (regionsGeoJSON && regionsGeoJSON.features?.length > 0) {
      console.log('[MapContainer] 🌍 Utilisation GeoJSON GeoServer:', regionsGeoJSON.features.length, 'régions');
      return regionsGeoJSON;
    }
    // Retourne null pour forcer l'attente du chargement
    console.log('[MapContainer] ⏳ En attente des régions GeoServer...');
    return null;
  }, [regionsGeoJSON]);
  
  // Loading state pour les géométries (au moins une couche visible doit être chargée)
  const isGeoJSONLoading = useMemo(() => {
    if (!layerConfig) return !displayGeoJSON;
    
    // Vérifier si au moins une couche visible a ses données
    const visibleLayers = layerConfig.filter(l => l.visible);
    if (visibleLayers.length === 0) return false;
    
    const hasVisibleData = visibleLayers.some(layer => {
      if (layer.id === 'region') return adminLayers?.regions;
      if (layer.id === 'department') return adminLayers?.departements;
      if (layer.id === 'arrondissement') return adminLayers?.arrondissements;
      if (layer.id === 'chefsLieux') return adminLayers?.chefsLieuxDep || adminLayers?.chefsLieuxArrond;
      return false;
    });
    
    return !hasVisibleData;
  }, [layerConfig, adminLayers, displayGeoJSON]);

  // Normalise le nom de région pour la jointure (gère les variantes d'accents, casse, tirets/espaces)
  const normalizeRegionName = useCallback((name: string): string => {
    if (!name) return '';
    return name
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents (é→e, è→e, etc.)
      .toLowerCase()
      .replace(/-/g, ' ')           // Tirets → espaces
      .replace(/_/g, ' ')           // Underscores → espaces
      .replace(/\s+/g, ' ')         // Multiple espaces → un seul
      .replace(/['']/g, "'")        // Apostrophes normalisées
      .trim();
  }, []);

  // Alias pour la normalisation (pas de mapping statique - tout est dynamique)
  const getCanonicalRegionName = normalizeRegionName;

  // Aggregate data
  const aggregatedData = useMemo(() => {
    const map = new Map<string, { value: number | null; status: string; count: number }>();
    
    data.forEach(d => {
      if (d.season_year === year && d.product === product && d.indicator === indicator) {
        const rawKey = adminLevel === 'department' ? d.department : d.region;
        const key = getCanonicalRegionName(rawKey);
        const existing = map.get(key);
        if (!existing) {
          map.set(key, { value: d.value, status: d.status, count: 1 });
        } else {
          if (d.value !== null && existing.value !== null) {
            map.set(key, { 
              value: existing.value + d.value, 
              status: d.status === 'unavailable' ? 'unavailable' : existing.status,
              count: existing.count + 1 
            });
          }
        }
      }
    });
    
    if (map.size > 0) {
      console.log('[MapContainer] 📊 Données agrégées:', map.size, 'zones');
      // DEBUG: Afficher les clés réelles dans aggregatedData
      console.log('[MapContainer] 🔑 Clés agrégées (premières 10):', Array.from(map.keys()).slice(0, 10));
    }
    
    return map;
  }, [data, year, product, indicator, adminLevel, getCanonicalRegionName]);
  
  // Mettre à jour la ref et forcer re-render quand les données changent
  useEffect(() => {
    aggregatedDataRef.current = aggregatedData;
    // Forcer un re-render du GeoJSON pour appliquer les nouveaux styles
    if (aggregatedData.size > 0) {
      setRenderKey(prev => prev + 1);
    }
  }, [aggregatedData]);

  // Debug: vérifier la correspondance des noms avec TOUTES les variantes
  useEffect(() => {
    const targetLayer = adminLevel === 'department' ? adminLayers?.departements : adminLayers?.regions;
    const layerName = adminLevel === 'department' ? 'départements' : 'régions';
    
    if (targetLayer && aggregatedData.size > 0) {
      const features = targetLayer.features;
      if (features) {
        let matchCount = 0;
        const unmatchedFeatures: string[] = [];
        
        features.forEach((f: any) => {
          const props = f.properties;
          const isDepartment = props.adm2_name || props.adm2_name1;
          
          // Toutes les variantes de noms disponibles
          const nameVariants = isDepartment 
            ? [props.adm2_name1, props.adm2_name, props.adm2_name2, props.adm2_name3, props.adm2_ref_name1]
            : [props.adm1_name1, props.adm1_name, props.adm1_name2, props.adm1_name3, props.adm1_ref_name1, props.nom_region];
          
          // Chercher une correspondance avec n'importe quelle variante
          const foundMatch = nameVariants.some(name => {
            if (!name) return false;
            return aggregatedData.has(getCanonicalRegionName(name));
          });
          
          if (foundMatch) {
            matchCount++;
          } else {
            const displayName = nameVariants.find(n => n) || 'Inconnu';
            unmatchedFeatures.push(displayName);
          }
        });
        
        console.log(`[MapContainer] ✅ Jointures ${layerName}: ${matchCount}/${features.length} (${Math.round(matchCount/features.length*100)}%)`);
        
        // DEBUG COMPLET: Comparer les clés des données vs les noms admin
        const dataKeys = Array.from(aggregatedData.keys()).sort();
        const adminNames = features.slice(0, 20).map((f: any) => {
          const p = f.properties;
          return adminLevel === 'department' 
            ? getCanonicalRegionName(p.adm2_name1 || p.adm2_name || '')
            : getCanonicalRegionName(p.adm1_name1 || p.adm1_name || '');
        }).sort();
        
        console.log('[MapContainer] 🔑 Clés données (toutes):', dataKeys);
        console.log('[MapContainer] 🗺️ Noms admin GeoJSON (20 premiers):', adminNames);
        
        // Identifier les non-correspondances exactes
        const missingInData = adminNames.filter(n => !dataKeys.includes(n));
        const missingInAdmin = dataKeys.filter(k => !adminNames.includes(k));
        if (missingInData.length > 0 || missingInAdmin.length > 0) {
          console.log('[MapContainer] ❌ Présents dans admin mais PAS dans données:', missingInData.slice(0, 5));
          console.log('[MapContainer] ❌ Présents dans données mais PAS dans admin:', missingInAdmin);
        }
        
        if (unmatchedFeatures.length > 0 && unmatchedFeatures.length <= 5) {
          console.log('[MapContainer] ⚠️ Sans données:', unmatchedFeatures.join(', '));
        } else if (unmatchedFeatures.length > 5) {
          console.log('[MapContainer] ⚠️ Sans données:', unmatchedFeatures.length, 'features (normal si produit pas cultivé partout)');
        }
      }
    }
  }, [adminLayers, aggregatedData, getCanonicalRegionName, adminLevel]);

  // Min/Max
  const { min, max } = useMemo(() => {
    const values = Array.from(aggregatedData.values())
      .filter(v => v.value !== null && v.value > 0)
      .map(v => v.value as number);
    return {
      min: Math.min(...values, 0),
      max: Math.max(...values, 1)
    };
  }, [aggregatedData]);

  // Unit
  const unit = useMemo(() => {
    const sample = data.find(d => d.product === product && d.indicator === indicator);
    return sample?.unit || 'tonnes';
  }, [data, product, indicator]);

  // Fonction pour trouver la donnée correspondante en essayant TOUTES les variantes de nom
  // Utilise aggregatedDataRef.current pour avoir les données ACTUELLES (évite stale closure)
  const findFeatureData = useCallback((feature: any) => {
    const props = feature.properties;
    const isDepartment = props.adm2_name || props.adm2_name1;
    const currentData = aggregatedDataRef.current; // Données actuelles via ref
    
    // Collecter TOUTES les variantes de noms disponibles (priorité aux noms français avec "1")
    const nameVariants = isDepartment 
      ? [props.adm2_name1, props.adm2_name, props.adm2_name2, props.adm2_name3, props.adm2_ref_name1, props.nom, props.departement]
      : [props.adm1_name1, props.adm1_name, props.adm1_name2, props.adm1_name3, props.adm1_ref_name1, props.nom_region, props.name, props.nom, props.region];
    
    // Essayer chaque variante jusqu'à trouver une correspondance EXACTE
    for (const name of nameVariants) {
      if (!name) continue;
      const canonical = getCanonicalRegionName(name);
      const data = currentData.get(canonical);
      if (data) {
        return { data, displayName: name, canonical };
      }
    }
    
    // Essai supplémentaire: recherche FUZZY sur toutes les clés
    const displayName = nameVariants.find(n => n) || 'Inconnu';
    const normalizedDisplay = getCanonicalRegionName(displayName);
    
    // Chercher correspondance partielle OU avec distance d'édition minimale
    for (const [key, dataValue] of currentData.entries()) {
      // Match partiel bidirectionnel
      if (normalizedDisplay.includes(key) || key.includes(normalizedDisplay)) {
        return { data: dataValue, displayName, canonical: key };
      }
      // Match par début de chaîne (pour gérer "Kadey" vs "Kadéy" etc.)
      if (key.startsWith(normalizedDisplay.substring(0, 4)) || normalizedDisplay.startsWith(key.substring(0, 4))) {
        return { data: dataValue, displayName, canonical: key };
      }
    }
    
    // Pas de correspondance trouvée
    return { data: null, displayName, canonical: normalizedDisplay };
  }, [getCanonicalRegionName]); // Retiré aggregatedData - on utilise la ref

  // GeoJSON style
  const getFeatureStyle = useCallback((feature: any) => {
    const { data: featureInfo } = findFeatureData(feature);
    const value = featureInfo?.value ?? null;
    
    // Style de base pour couches référentielles (sans données thématiques)
    const hasThematicData = aggregatedData.size > 0;
    const baseColor = hasThematicData 
      ? getColorScale(value, min, max, isDark)
      : isDark ? '#1e3a5f' : '#e0f2fe'; // Bleu clair par défaut
    
    return {
      fillColor: baseColor,
      fillOpacity: hasThematicData ? 0.7 : 0.4,
      weight: 1.5,
      opacity: 1,
      color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,80,120,0.5)',
      dashArray: featureInfo?.status === 'unavailable' ? '4, 4' : undefined,
    };
  }, [findFeatureData, min, max, isDark, aggregatedData]);

  // Event handlers
  const onEachFeature = useCallback((feature: any, layer: L.Layer) => {
    layer.on({
      mouseover: (e: L.LeafletMouseEvent) => {
        const { data: featureInfo, displayName, canonical } = findFeatureData(feature);
        const props = feature.properties;
        
        // DEBUG: Afficher les détails du hover
        console.log('[MapContainer] 🖱️ Hover:', {
          displayName,
          canonical,
          found: !!featureInfo,
          value: featureInfo?.value,
          refSize: aggregatedDataRef.current.size,
          refKeys: Array.from(aggregatedDataRef.current.keys()).slice(0, 5)
        });
        
        setTooltipData({
          name: displayName,
          capital: props.capital || props.chef_lieu || props.adm2_ref_name1 || props.adm1_ref_name1,
          value: featureInfo?.value ?? null,
          status: featureInfo?.status || 'unavailable'
        });
        
        const target = e.target as L.Path;
        target.setStyle({
          weight: 3,
          color: '#056B32',
          fillOpacity: 0.9,
        });
        target.bringToFront();
      },
      mouseout: (e: L.LeafletMouseEvent) => {
        setTooltipData(null);
        const target = e.target as L.Path;
        target.setStyle(getFeatureStyle(feature));
      },
      click: () => {
        if (onFeatureClick) onFeatureClick(feature);
      }
    });
  }, [findFeatureData, getFeatureStyle, onFeatureClick, aggregatedData.size]); // aggregatedData.size force la recréation quand les données changent

  return (
    <>
      <div className="relative h-full w-full isolate">
        
        {/* Elegant Map Loading Indicator */}
        {(isMapLoading || isGeoJSONLoading || isDataLoading) && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-slate-50/80 dark:bg-black/80 backdrop-blur-sm transition-opacity duration-300">
            <div className="flex flex-col items-center gap-4 p-8 glass-panel rounded-2xl border border-white/50 dark:border-white/10 shadow-2xl">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-cameroon-green/20 rounded-full" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-cameroon-green rounded-full animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-700 dark:text-white">
                  {isGeoJSONLoading ? 'Chargement des géométries...' : isDataLoading ? 'Chargement des données...' : 'Actualisation...'}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-neutral-500 mt-1">
                  {isGeoJSONLoading ? 'Polygones administratifs' : isDataLoading ? `${product} - ${indicator}` : 'Connexion au serveur'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Message: Sélectionnez un produit (en mode thématique sans sélection) */}
        {activeTheme !== 'overview' && !product && !isMapLoading && !isGeoJSONLoading && (
          <div className="absolute inset-0 z-[999] flex items-center justify-center pointer-events-none">
            <div className="glass-panel rounded-2xl border border-cameroon-green/20 shadow-2xl p-8 text-center max-w-sm mx-4 pointer-events-auto">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cameroon-green/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-cameroon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
                Sélectionnez {activeTheme === 'agriculture' ? 'une culture' : activeTheme === 'elevage' ? 'une filière' : 'un type'}
              </h3>
              <p className="text-sm text-slate-500 dark:text-neutral-400">
                Choisissez dans le panneau latéral pour afficher les données sur la carte
              </p>
            </div>
          </div>
        )}
        
        <LeafletMap 
          center={center} 
          zoom={zoom} 
          scrollWheelZoom={true} 
          zoomControl={false} 
          className="h-full w-full z-0" 
          style={{ background: isDark ? '#0a0a0a' : '#f8fafc' }}
        >
          <MapUpdater center={center} zoom={zoom} flyToLocation={flyToLocation} />
          <MapInstanceCapture />
          <MouseTracker onMouseMove={setMousePos} />
          
          {/* Plugins */}

          
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={BASEMAP_URLS[basemap]} 
          />
          
          {/* COUCHES ADMINISTRATIVES - ordre inverse pour z-index (premier = dessous) */}
          {layerConfig && adminLayers && (
            // Renverser l'ordre pour que le premier de la liste soit au-dessus
            [...layerConfig].reverse().map((layer, idx) => {
              const isThematicLayer = (layer.id === 'region' && adminLevel === 'region')
                || (layer.id === 'department' && adminLevel === 'department');
              const shouldRender = layer.visible || isThematicLayer;
              if (!shouldRender) return null;
              
              // Mapper l'id de couche vers les données GeoJSON
              const layerData = layer.id === 'region' ? adminLayers.regions
                : layer.id === 'department' ? adminLayers.departements
                : layer.id === 'arrondissement' ? adminLayers.arrondissements
                : layer.id === 'chefsLieux' ? (adminLayers.chefsLieuxDep || adminLayers.chefsLieuxArrond)
                : null;
              
              if (!layerData) return null;
              
              // Pour les chefs-lieux (points), utiliser des CircleMarkers
              if (layer.id === 'chefsLieux') {
                return (
                  <React.Fragment key={`layer-chefs-lieux-${idx}`}>
                    {/* Chefs-lieux des départements (préfectures) */}
                    {adminLayers.chefsLieuxDep?.features.map((feature, i) => {
                      const coords = feature.geometry as GeoJSON.Point;
                      if (!coords?.coordinates) return null;
                      const [lng, lat] = coords.coordinates;
                      const name = feature.properties?.name || feature.properties?.nom || 'Préfecture';
                      
                      return (
                        <CircleMarker
                          key={`chef-dep-${i}`}
                          center={[lat, lng]}
                          radius={6}
                          pathOptions={{
                            fillColor: isDark ? '#f59e0b' : '#d97706',
                            fillOpacity: 0.9,
                            color: isDark ? '#fbbf24' : '#b45309',
                            weight: 2
                          }}
                        >
                          <Popup>
                            <div className="text-sm font-medium">{name}</div>
                            <div className="text-xs text-gray-500">Préfecture</div>
                          </Popup>
                        </CircleMarker>
                      );
                    })}
                    {/* Chefs-lieux des arrondissements (sous-préfectures) */}
                    {adminLayers.chefsLieuxArrond?.features.map((feature, i) => {
                      const coords = feature.geometry as GeoJSON.Point;
                      if (!coords?.coordinates) return null;
                      const [lng, lat] = coords.coordinates;
                      const name = feature.properties?.name || feature.properties?.nom || 'Sous-préfecture';
                      
                      return (
                        <CircleMarker
                          key={`chef-arrond-${i}`}
                          center={[lat, lng]}
                          radius={4}
                          pathOptions={{
                            fillColor: isDark ? '#a78bfa' : '#8b5cf6',
                            fillOpacity: 0.8,
                            color: isDark ? '#c4b5fd' : '#7c3aed',
                            weight: 1.5
                          }}
                        >
                          <Popup>
                            <div className="text-sm font-medium">{name}</div>
                            <div className="text-xs text-gray-500">Sous-préfecture</div>
                          </Popup>
                        </CircleMarker>
                      );
                    })}
                  </React.Fragment>
                );
              }
              
              // Style spécifique par couche (polygones)
              const getLayerStyle = (feature: any) => {
                const baseStyle = getFeatureStyle(feature);
                
                // Couleurs par type de couche
                const layerColors: Record<string, { fill: string; stroke: string }> = {
                  region: { fill: isDark ? '#1e40af' : '#3b82f6', stroke: isDark ? '#60a5fa' : '#1d4ed8' },
                  department: { fill: isDark ? '#065f46' : '#10b981', stroke: isDark ? '#34d399' : '#047857' },
                  arrondissement: { fill: isDark ? '#7c3aed' : '#8b5cf6', stroke: isDark ? '#a78bfa' : '#6d28d9' }
                };
                
                const colors = layerColors[layer.id] || layerColors.region;
                
                // Si c'est la couche d'analyse thématique (selon adminLevel), utiliser le style choroplèthe
                if (isThematicLayer && aggregatedData.size > 0) {
                  return baseStyle; // Style choroplèthe
                }
                
                // Sinon, style référentiel simple
                return {
                  fillColor: colors.fill,
                  fillOpacity: 0.15,
                  weight: layer.id === 'region' ? 2 : layer.id === 'department' ? 1.5 : 1,
                  opacity: 0.8,
                  color: colors.stroke,
                };
              };
              
              return (
                <GeoJSON 
                  key={`layer-${layer.id}-${renderKey}-${basemap}-${adminLevel}`}
                  data={layerData as any}
                  style={getLayerStyle}
                  onEachFeature={onEachFeature}
                />
              );
            })
          )}
          
          {/* Fallback: Afficher displayGeoJSON si pas de layerConfig */}
          {!layerConfig && displayGeoJSON && (
            <GeoJSON 
              key={`fallback-${renderKey}-${basemap}-${adminLevel}`}
              data={displayGeoJSON as any}
              style={getFeatureStyle}
              onEachFeature={onEachFeature}
            />
          )}
        </LeafletMap>
        
        {/* Legend */}
        {aggregatedData.size > 0 && (
          <div className="absolute bottom-24 right-4 z-1000 glass-panel p-4 rounded-xl shadow-lg border border-white/50 dark:border-white/10 min-w-[200px]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-widest">
                {indicator}
              </h4>
              <span className="text-[9px] px-1.5 py-0.5 bg-cameroon-green/10 text-cameroon-green rounded font-medium">
                {year}
              </span>
            </div>
            
            {/* Gradient bar */}
            <div className="mb-2">
              <div className="h-3 w-full rounded-md bg-gradient-to-r from-amber-100 via-amber-300 via-30% via-green-400 via-60% to-emerald-600 shadow-inner border border-white/20" />
              <div className="flex justify-between mt-1">
                <span className="text-[9px] font-mono text-slate-400">{min.toLocaleString('fr-FR')}</span>
                <span className="text-[9px] font-mono text-slate-400 font-medium">{Math.round(max/2).toLocaleString('fr-FR')}</span>
                <span className="text-[9px] font-mono text-slate-400">{max.toLocaleString('fr-FR')}</span>
              </div>
            </div>
            
            {/* Unit */}
            <div className="text-[9px] text-slate-500 dark:text-neutral-400 text-center mb-2">
              Unité: <span className="font-medium text-slate-600 dark:text-neutral-300">{unit}</span>
            </div>
            
            {/* Status indicators */}
            <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded border-2 border-dashed border-slate-300 dark:border-neutral-600 bg-slate-100 dark:bg-neutral-800" />
                <span className="text-[9px] text-slate-500 dark:text-neutral-400">Indispo.</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200" />
                <span className="text-[9px] text-slate-500 dark:text-neutral-400">Faible</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-[9px] text-slate-500 dark:text-neutral-400">Élevé</span>
              </div>
            </div>
            
            {/* Data count */}
            <div className="text-[8px] text-slate-400 dark:text-neutral-500 mt-2 text-right">
              {aggregatedData.size} zones avec données
            </div>
          </div>
        )}
      </div>
      
      {/* Cursor-following Tooltip (rendered outside map container for proper z-index) */}
      <CursorTooltip data={tooltipData} mousePos={mousePos} unit={unit} year={year} />
    </>
  );
};
