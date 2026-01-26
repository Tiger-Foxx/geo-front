// ═══════════════════════════════════════════════════════════════════════════════
// HOOKS GEOSERVER - State management pour données backend
// ═══════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import GeoServerAPI, { 
  LAYERS, 
  type WFSFeatureCollection,
  type AgricultureProperties,
  type ElevageRegionalProperties,
  type PecheNationalProperties,
  type PecheInfraRegionalProperties,
  type PecheProdDepartementProperties
} from '../services/geoserver';

// ───────────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────────

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseGeoServerFiltersResult {
  products: string[];
  filieres: string[];
  indicators: string[];
  agriYearRange: { min: number; max: number; years: number[] };
  elevageYearRange: { min: number; max: number; years: number[] };
  pecheYearRange: { min: number; max: number; years: number[] };
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

// ───────────────────────────────────────────────────────────────────────────────
// HOOK: Chargement dynamique des filtres
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Charge tous les filtres disponibles depuis GeoServer
 * (produits, filières, plages d'années)
 */
export function useGeoServerFilters(): UseGeoServerFiltersResult {
  const [products, setProducts] = useState<string[]>([]);
  const [filieres, setFilieres] = useState<string[]>([]);
  const [indicators, setIndicators] = useState<string[]>([]);
  const [agriYearRange, setAgriYearRange] = useState({ min: 1998, max: 2022, years: [] as number[] });
  const [elevageYearRange, setElevageYearRange] = useState({ min: 2015, max: 2021, years: [] as number[] });
  const [pecheYearRange, setPecheYearRange] = useState({ min: 2015, max: 2021, years: [] as number[] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFilters = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all in parallel for performance
      const [
        productsData,
        filieresData,
        indicatorsData,
        agriYears,
        elevageYears,
        pecheYears
      ] = await Promise.all([
        GeoServerAPI.agriculture.getProducts(),
        GeoServerAPI.elevage.getFilieres(),
        GeoServerAPI.agriculture.getIndicators(),
        GeoServerAPI.agriculture.getYearRange(),
        GeoServerAPI.elevage.getYearRange(),
        GeoServerAPI.peche.getYearRange()
      ]);

      setProducts(productsData);
      setFilieres(filieresData);
      setIndicators(indicatorsData);
      setAgriYearRange(agriYears);
      setElevageYearRange(elevageYears);
      setPecheYearRange(pecheYears);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch filters'));
      console.error('[GeoServer] Filter fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  return {
    products,
    filieres,
    indicators,
    agriYearRange,
    elevageYearRange,
    pecheYearRange,
    loading,
    error,
    refetch: fetchFilters
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// HOOK: Données Agriculture
// ───────────────────────────────────────────────────────────────────────────────

interface UseAgricultureDataProps {
  product: string;
  indicator: string;
  year: number;
  enabled?: boolean;
}

export function useAgricultureData({ product, indicator, year, enabled = true }: UseAgricultureDataProps) {
  const [state, setState] = useState<AsyncState<WFSFeatureCollection<AgricultureProperties>>>({
    data: null,
    loading: false,
    error: null
  });

  useEffect(() => {
    if (!enabled || !product || !indicator) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    GeoServerAPI.agriculture.getData(product, indicator, year)
      .then(data => setState({ data, loading: false, error: null }))
      .catch(error => setState({ data: null, loading: false, error }));
  }, [product, indicator, year, enabled]);

  return state;
}

// ───────────────────────────────────────────────────────────────────────────────
// HOOK: Données Élevage
// ───────────────────────────────────────────────────────────────────────────────

interface UseElevageDataProps {
  filiere?: string;
  year?: number;
  level: 'national' | 'regional';
  enabled?: boolean;
}

export function useElevageData({ filiere, year, level, enabled = true }: UseElevageDataProps) {
  const [state, setState] = useState<AsyncState<WFSFeatureCollection<ElevageRegionalProperties>>>({
    data: null,
    loading: false,
    error: null
  });

  useEffect(() => {
    if (!enabled) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    const fetchFn = level === 'national' 
      ? GeoServerAPI.elevage.getNationalData 
      : GeoServerAPI.elevage.getRegionalData;

    fetchFn(filiere, year)
      .then(data => setState({ data, loading: false, error: null }))
      .catch(error => setState({ data: null, loading: false, error }));
  }, [filiere, year, level, enabled]);

  return state;
}

// ───────────────────────────────────────────────────────────────────────────────
// HOOK: Données Pêche (multiscalaire)
// ───────────────────────────────────────────────────────────────────────────────

interface UsePecheDataResult {
  national: AsyncState<WFSFeatureCollection<PecheNationalProperties>>;
  infraRegional: AsyncState<WFSFeatureCollection<PecheInfraRegionalProperties>>;
  prodDepartement: AsyncState<WFSFeatureCollection<PecheProdDepartementProperties>>;
  refetch: () => void;
}

export function usePecheData(year: number = 2021): UsePecheDataResult {
  const [national, setNational] = useState<AsyncState<WFSFeatureCollection<PecheNationalProperties>>>({
    data: null,
    loading: false,
    error: null
  });
  const [infraRegional, setInfraRegional] = useState<AsyncState<WFSFeatureCollection<PecheInfraRegionalProperties>>>({
    data: null,
    loading: false,
    error: null
  });
  const [prodDepartement, setProdDepartement] = useState<AsyncState<WFSFeatureCollection<PecheProdDepartementProperties>>>({
    data: null,
    loading: false,
    error: null
  });

  const fetchAll = useCallback(async () => {
    // National data (all years for evolution)
    setNational(prev => ({ ...prev, loading: true }));
    GeoServerAPI.peche.getNationalData()
      .then(data => setNational({ data, loading: false, error: null }))
      .catch(error => setNational({ data: null, loading: false, error }));

    // Infra régional (filtered by year)
    setInfraRegional(prev => ({ ...prev, loading: true }));
    GeoServerAPI.peche.getInfraRegional(year)
      .then(data => setInfraRegional({ data, loading: false, error: null }))
      .catch(error => setInfraRegional({ data: null, loading: false, error }));

    // Prod départemental (filtered by year)
    setProdDepartement(prev => ({ ...prev, loading: true }));
    GeoServerAPI.peche.getProdDepartement(year)
      .then(data => setProdDepartement({ data, loading: false, error: null }))
      .catch(error => setProdDepartement({ data: null, loading: false, error }));
  }, [year]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { national, infraRegional, prodDepartement, refetch: fetchAll };
}

// ───────────────────────────────────────────────────────────────────────────────
// HOOK: Données Admin (GeoJSON pour Leaflet)
// ───────────────────────────────────────────────────────────────────────────────

export function useAdminGeoJSON(level: 'regions' | 'departements' | 'arrondissements') {
  const [state, setState] = useState<AsyncState<GeoJSON.FeatureCollection>>({
    data: null,
    loading: false,
    error: null
  });

  useEffect(() => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    const fetchFn = level === 'regions' 
      ? GeoServerAPI.admin.getRegions
      : level === 'departements'
      ? GeoServerAPI.admin.getDepartements
      : GeoServerAPI.admin.getArrondissements;

    fetchFn()
      .then(wfsData => {
        // Convert WFS to standard GeoJSON
        const geoJSON: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: wfsData.features.map(f => ({
            type: 'Feature' as const,
            id: f.id,
            geometry: f.geometry as GeoJSON.Geometry,
            properties: f.properties
          }))
        };
        setState({ data: geoJSON, loading: false, error: null });
      })
      .catch(error => setState({ data: null, loading: false, error }));
  }, [level]);

  return state;
}

// ───────────────────────────────────────────────────────────────────────────────
// HOOK: GetFeatureInfo (click sur la carte)
// ───────────────────────────────────────────────────────────────────────────────

import { buildGetFeatureInfoUrl } from '../services/geoserver';

interface UseFeatureInfoResult {
  fetchInfo: (
    layer: string,
    latlng: { lat: number; lng: number },
    map: L.Map,
    cqlFilter?: string
  ) => Promise<any>;
  loading: boolean;
  error: Error | null;
}

export function useFeatureInfo(): UseFeatureInfoResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchInfo = useCallback(async (
    layer: string,
    latlng: { lat: number; lng: number },
    map: L.Map,
    cqlFilter?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const bounds = map.getBounds();
      const size = map.getSize();
      const point = map.latLngToContainerPoint(latlng);
      
      const bbox: [number, number, number, number] = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth()
      ];

      const url = buildGetFeatureInfoUrl(
        layer,
        bbox,
        point.x,
        point.y,
        size.x,
        size.y,
        { cqlFilter }
      );

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      return data.features?.[0]?.properties || null;
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch feature info');
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchInfo, loading, error };
}

// ───────────────────────────────────────────────────────────────────────────────
// HOOK: Connection Status
// ───────────────────────────────────────────────────────────────────────────────

export function useGeoServerStatus() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      const start = Date.now();
      try {
        // Simple capabilities check
        await fetch(
          `${LAYERS.admin.regions.replace('geoportal:', '')}?service=WFS&version=2.0.0&request=GetCapabilities`,
          { method: 'HEAD', mode: 'no-cors' }
        );
        setLatency(Date.now() - start);
        setStatus('online');
      } catch {
        setStatus('offline');
        setLatency(null);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30s
    
    return () => clearInterval(interval);
  }, []);

  return { status, latency };
}
