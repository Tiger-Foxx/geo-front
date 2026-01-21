import { MapContainer as LeafletMap, TileLayer, Polygon, Popup, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { DataPoint } from '../../data/mockData';
import { useMemo } from 'react';

// Corrections for default icon issues in React-Leaflet
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapContainerProps {
  data: DataPoint[];
  year: number;
  product: string;
  indicator: string;
  basemap?: BasemapType;
}

export type BasemapType = 'light' | 'dark' | 'satellite' | 'terrain' | 'osm';

const BASEMAP_URLS = {
    light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    terrain: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer/tile/{z}/{y}/{x}",
    osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
};

// Placeholder for Cameroon Departments GeoJSON (Simplified)
// In a real app, this would be fetched from a .geojson file
const MOCK_GEOJSON_DEPARTMENTS = [
  { name: 'Mfoundi', coords: [[3.84, 11.50], [3.90, 11.50], [3.90, 11.55], [3.84, 11.55]] }, // Yaoundé area
  { name: 'Wouri', coords: [[4.05, 9.70], [4.10, 9.70], [4.10, 9.75], [4.05, 9.75]] }, // Douala area
  // Add more conceptual squares for demo purposes if needed
];

export const MapContainer = ({ data, year, product, indicator, basemap = 'osm' }: MapContainerProps) => {
  const center: [number, number] = [7.3697, 12.3547]; // Cameroon Center
  const zoom = 6;

  // Memoize data aggregation for the current view
  const departmentValues = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach(d => {
      if (d.season_year === year && d.product === product && d.indicator === indicator) {
        map.set(d.department, d.value ?? 0);
      }
    });
    return map;
  }, [data, year, product, indicator]);

  const getColor = (val: number) => {
      // Simple threshold-based coloring for demo
      return val > 5000 ? '#056B32' :
             val > 1000 ? '#4C9A2A' :
             val > 500  ? '#8FBC8F' :
             val > 0    ? '#FFCD00' :
                          '#FFFFFF';
  };

  return (
    <LeafletMap center={center} zoom={zoom} scrollWheelZoom={true} zoomControl={false} className="h-full w-full z-0" style={{ background: '#f8fafc' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url={BASEMAP_URLS[basemap]} 
      />
      
      <ZoomControl position="bottomright" />
      
      {/* 
        This is where we would map through the real GeoJSON features.
        For now, we don't have the polygons, so we just show the base map.
        I've added a few dummy polygons to demonstrate logic.
      */}
      {MOCK_GEOJSON_DEPARTMENTS.map((dept, idx) => {
         const val = departmentValues.get(dept.name) || 0;
         return (
          <Polygon 
            key={idx} 
            pathOptions={{ 
                fillColor: getColor(val), 
                fillOpacity: 0.7, 
                weight: 1, 
                opacity: 1, 
                color: 'white' 
            }} 
            positions={dept.coords as [number, number][]}
          >
            <Popup>
              <div className="text-center">
                <h3 className="font-bold text-gray-800">{dept.name}</h3>
                <p className="text-sm text-gray-600">
                  {val.toLocaleString()} {indicator === 'Yield' ? 'mt/ha' : 'tonnes'}
                </p>
              </div>
            </Popup>
          </Polygon>
         )
      })}
    </LeafletMap>
  );
};
