import { MapContainer as LeafletMap, TileLayer, GeoJSON, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-fullscreen/dist/leaflet.fullscreen.css';
import type { DataPoint } from '../../data/mockData';
import { useMemo, useEffect, useState, useCallback } from 'react';
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
}

const BASEMAP_URLS: Record<BasemapType, string> = {
    light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    terrain: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}",
    osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
};

// Cameroon Regions GeoJSON
const CAMEROON_REGIONS_GEOJSON = {
  type: "FeatureCollection",
  features: [
    { type: "Feature", properties: { name: "Centre", code: "CE", capital: "Yaoundé" }, geometry: { type: "Polygon", coordinates: [[[11.0, 3.0], [13.0, 3.0], [13.0, 5.5], [11.0, 5.5], [11.0, 3.0]]] }},
    { type: "Feature", properties: { name: "Littoral", code: "LT", capital: "Douala" }, geometry: { type: "Polygon", coordinates: [[[9.0, 3.5], [10.5, 3.5], [10.5, 5.0], [9.0, 5.0], [9.0, 3.5]]] }},
    { type: "Feature", properties: { name: "Ouest", code: "OU", capital: "Bafoussam" }, geometry: { type: "Polygon", coordinates: [[[9.5, 5.0], [11.0, 5.0], [11.0, 6.5], [9.5, 6.5], [9.5, 5.0]]] }},
    { type: "Feature", properties: { name: "Sud-Ouest", code: "SW", capital: "Buéa" }, geometry: { type: "Polygon", coordinates: [[[8.5, 4.0], [9.5, 4.0], [9.5, 6.0], [8.5, 6.0], [8.5, 4.0]]] }},
    { type: "Feature", properties: { name: "Nord-Ouest", code: "NW", capital: "Bamenda" }, geometry: { type: "Polygon", coordinates: [[[9.5, 5.5], [11.0, 5.5], [11.0, 7.0], [9.5, 7.0], [9.5, 5.5]]] }},
    { type: "Feature", properties: { name: "Adamaoua", code: "AD", capital: "Ngaoundéré" }, geometry: { type: "Polygon", coordinates: [[[11.0, 6.0], [15.0, 6.0], [15.0, 8.0], [11.0, 8.0], [11.0, 6.0]]] }},
    { type: "Feature", properties: { name: "Nord", code: "NO", capital: "Garoua" }, geometry: { type: "Polygon", coordinates: [[[12.0, 8.0], [15.5, 8.0], [15.5, 10.5], [12.0, 10.5], [12.0, 8.0]]] }},
    { type: "Feature", properties: { name: "Extreme-Nord", code: "EN", capital: "Maroua" }, geometry: { type: "Polygon", coordinates: [[[13.5, 10.0], [15.5, 10.0], [15.5, 13.0], [13.5, 13.0], [13.5, 10.0]]] }},
    { type: "Feature", properties: { name: "Est", code: "ES", capital: "Bertoua" }, geometry: { type: "Polygon", coordinates: [[[13.0, 2.0], [16.5, 2.0], [16.5, 6.0], [13.0, 6.0], [13.0, 2.0]]] }},
    { type: "Feature", properties: { name: "Sud", code: "SU", capital: "Ebolowa" }, geometry: { type: "Polygon", coordinates: [[[9.5, 2.0], [12.5, 2.0], [12.5, 3.5], [9.5, 3.5], [9.5, 2.0]]] }},
  ]
} as any;

// Dynamic color scale
const getColorScale = (value: number | null, min: number, max: number, isDark: boolean): string => {
  if (value === null) return isDark ? '#374151' : '#E5E7EB';
  if (value === 0) return isDark ? '#1F2937' : '#F9FAFB';
  
  const normalized = Math.min(1, Math.max(0, (value - min) / (max - min || 1)));
  const colors = [
    { r: 255, g: 205, b: 0 },
    { r: 76, g: 154, b: 42 },
    { r: 5, g: 107, b: 50 },
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

export const MapContainer = ({ data, year, product, indicator, basemap = 'osm', adminLevel = 'region', flyToLocation, onFeatureClick, onMapReady }: MapContainerProps) => {
  const center: [number, number] = [7.3697, 12.3547];
  const zoom = 6;
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMapLoading, setIsMapLoading] = useState(true);
  
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
    setIsMapLoading(true);
    const timer = setTimeout(() => setIsMapLoading(false), 400);
    return () => clearTimeout(timer);
  }, [year, product, indicator]);
  
  const isDark = useMemo(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  }, []);

  // Aggregate data
  const aggregatedData = useMemo(() => {
    const map = new Map<string, { value: number | null; status: string; count: number }>();
    
    data.forEach(d => {
      if (d.season_year === year && d.product === product && d.indicator === indicator) {
        const key = adminLevel === 'department' ? d.department : d.region;
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
    
    return map;
  }, [data, year, product, indicator, adminLevel]);

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

  // GeoJSON style
  const getFeatureStyle = useCallback((feature: any) => {
    const featureName = feature.properties.name;
    const featureInfo = aggregatedData.get(featureName);
    const value = featureInfo?.value ?? null;
    
    return {
      fillColor: getColorScale(value, min, max, isDark),
      fillOpacity: 0.7,
      weight: 1.5,
      opacity: 1,
      color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)',
      dashArray: featureInfo?.status === 'unavailable' ? '4, 4' : undefined,
    };
  }, [aggregatedData, min, max, isDark]);

  // Event handlers
  const onEachFeature = useCallback((feature: any, layer: L.Layer) => {
    layer.on({
      mouseover: (e: L.LeafletMouseEvent) => {
        const featureInfo = aggregatedData.get(feature.properties.name);
        setTooltipData({
          name: feature.properties.name,
          capital: feature.properties.capital,
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
  }, [aggregatedData, getFeatureStyle, onFeatureClick]);

  return (
    <>
      <div className="relative h-full w-full isolate">
        
        {/* Elegant Map Loading Indicator */}
        {isMapLoading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-2 px-4 py-2 bg-white/90 dark:bg-black/90 backdrop-blur-md rounded-full border border-slate-200/50 dark:border-white/10 shadow-lg">
            <div className="loader-spinner" style={{ width: 14, height: 14, borderWidth: 1.5 }} />
            <span className="text-[10px] font-semibold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
              Actualisation...
            </span>
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
          
          <GeoJSON 
            key={`${year}-${product}-${indicator}-${basemap}`}
            data={CAMEROON_REGIONS_GEOJSON}
            style={getFeatureStyle}
            onEachFeature={onEachFeature}
          />
        </LeafletMap>
        
        {/* Legend */}
        <div className="absolute bottom-24 right-4 z-1000 glass-panel p-4 rounded-xl shadow-lg border border-white/50 dark:border-white/10">
          <h4 className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-widest mb-3">
            {indicator} ({year})
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-slate-400">0</span>
            <div className="h-2 w-28 rounded-full bg-gradient-to-r from-cameroon-yellow via-green-500 to-cameroon-green shadow-inner" />
            <span className="text-[9px] font-mono text-slate-400">{max.toLocaleString('fr-FR')}</span>
          </div>
          <div className="flex gap-3 mt-3 pt-2 border-t border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded border-2 border-dashed border-slate-300 dark:border-neutral-600 bg-slate-100 dark:bg-neutral-800" />
              <span className="text-[9px] text-slate-500 dark:text-neutral-400">Indispo.</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700" />
              <span className="text-[9px] text-slate-500 dark:text-neutral-400">0</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Cursor-following Tooltip (rendered outside map container for proper z-index) */}
      <CursorTooltip data={tooltipData} mousePos={mousePos} unit={unit} year={year} />
    </>
  );
};
