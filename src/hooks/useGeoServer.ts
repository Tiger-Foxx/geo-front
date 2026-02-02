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
    console.log('%c[useGeoServerFilters] 🚀 Démarrage chargement filtres...', 'color: #8B5CF6; font-weight: bold;');
    setLoading(true);
    setError(null);

    try {
      const startTime = performance.now();
      
      // Fetch all in parallel for performance
      console.log('%c[useGeoServerFilters] ⏳ Requêtes parallèles en cours...', 'color: #3B82F6;');
      
      const [
        productsData,
        filieresData,
        indicatorsData,
        agriYears,
        elevageYears,
        pecheYears,
        // DEBUG: Échantillon complet pour voir la vraie structure
        agriSample
      ] = await Promise.all([
        GeoServerAPI.agriculture.getProducts(),
        GeoServerAPI.elevage.getFilieres(),
        GeoServerAPI.agriculture.getIndicators(),
        GeoServerAPI.agriculture.getYearRange(),
        GeoServerAPI.elevage.getYearRange(),
        GeoServerAPI.peche.getYearRange(),
        GeoServerAPI.agriculture.getAllData(5) // 5 premiers enregistrements
      ]);

      const duration = Math.round(performance.now() - startTime);
      
      // LOG DÉTAILLÉ DES RÉSULTATS
      console.log('%c[useGeoServerFilters] ✅ Filtres chargés en ' + duration + 'ms', 'color: #10B981; font-weight: bold;');
      
      // ⚠️ DEBUG CRITIQUE: Voir la vraie structure des données agriculture
      console.groupCollapsed('%c[useGeoServerFilters] 🔬 STRUCTURE RÉELLE v_prod_agriculture', 'color: #EF4444; font-weight: bold; font-size: 14px;');
      if (agriSample.features?.length > 0) {
        console.log('Colonnes disponibles:', Object.keys(agriSample.features[0].properties));
        console.log('Premier enregistrement complet:');
        console.table([agriSample.features[0].properties]);
        console.log('5 premiers enregistrements:');
        console.table(agriSample.features.map(f => f.properties));
      } else {
        console.warn('⚠️ Aucune donnée retournée!');
      }
      console.groupEnd();
      
      // ⚠️ LOG NON-COLLAPSED POUR DEBUG IMMÉDIAT
      console.log('%c[useGeoServerFilters] 🎯 VALEURS RÉELLES:', 'color: #EF4444; font-weight: bold; font-size: 16px;');
      console.log('  📊 Produits (premiers 5):', productsData.slice(0, 5));
      console.log('  📈 Indicateurs:', indicatorsData);
      console.log('  📅 Années Agriculture:', agriYears);
      if (agriSample.features?.length > 0) {
        const sample = agriSample.features[0].properties;
        console.log('  🔍 Exemple complet:', sample);
      }
      
      console.groupCollapsed('%c[useGeoServerFilters] 📊 PRODUITS AGRICOLES', 'color: #F59E0B; font-weight: bold;');
      console.log('Total:', productsData.length);
      console.table(productsData.map((p, i) => ({ index: i, product: p })));
      console.groupEnd();
      
      console.groupCollapsed('%c[useGeoServerFilters] 🐄 FILIÈRES ÉLEVAGE', 'color: #EC4899; font-weight: bold;');
      console.log('Total:', filieresData.length);
      console.table(filieresData.map((f, i) => ({ index: i, filiere: f })));
      console.groupEnd();
      
      console.groupCollapsed('%c[useGeoServerFilters] 📈 INDICATEURS', 'color: #06B6D4; font-weight: bold;');
      console.table(indicatorsData);
      console.groupEnd();
      
      console.groupCollapsed('%c[useGeoServerFilters] 📅 PLAGES TEMPORELLES', 'color: #8B5CF6; font-weight: bold;');
      console.log('Agriculture:', agriYears);
      console.log('Élevage:', elevageYears);
      console.log('Pêche:', pecheYears);
      console.groupEnd();

      setProducts(productsData);
      setFilieres(filieresData);
      setIndicators(indicatorsData);
      setAgriYearRange(agriYears);
      setElevageYearRange(elevageYears);
      setPecheYearRange(pecheYears);
      
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to fetch filters');
      setError(err);
      console.error('%c[useGeoServerFilters] ❌ ERREUR:', 'color: #EF4444; font-weight: bold;', err.message);
      console.error('Détails:', e);
      console.log('%c[useGeoServerFilters] ℹ️ Fallback vers données MOCK activé', 'color: #F59E0B;');
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

interface UsePecheDataParams {
  year?: number;
  enabled?: boolean;
}

export function usePecheData({ year = 2021, enabled = true }: UsePecheDataParams = {}): UsePecheDataResult {
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
    if (!enabled) return;
    
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
  }, [year, enabled]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { national, infraRegional, prodDepartement, refetch: fetchAll };
}

// ───────────────────────────────────────────────────────────────────────────────
// HOOK: Données Admin (GeoJSON pour Leaflet)
// ───────────────────────────────────────────────────────────────────────────────

export type AdminLevel = 'regions' | 'departements' | 'arrondissements' | 'chefsLieuxDep' | 'chefsLieuxArrond';

export function useAdminGeoJSON(level: AdminLevel) {
  const [state, setState] = useState<AsyncState<GeoJSON.FeatureCollection>>({
    data: null,
    loading: false,
    error: null
  });

  useEffect(() => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    // Sélectionner la bonne fonction de fetch selon le niveau
    const fetchFn = (() => {
      switch (level) {
        case 'regions': return GeoServerAPI.admin.getRegions;
        case 'departements': return GeoServerAPI.admin.getDepartements;
        case 'arrondissements': return GeoServerAPI.admin.getArrondissements;
        case 'chefsLieuxDep': return GeoServerAPI.admin.getChefsLieuxDep;
        case 'chefsLieuxArrond': return GeoServerAPI.admin.getChefsLieuxArrond;
      }
    })();

    fetchFn()
      .then(wfsData => {
        // DEBUG: Afficher les noms de régions pour vérifier le mapping
        console.groupCollapsed('%c[useAdminGeoJSON] 🗺️ ' + level.toUpperCase() + ' CHARGÉS', 'color: #8B5CF6; font-weight: bold; font-size: 14px;');
        console.log('Total:', wfsData.features.length);
        
        if (wfsData.features.length > 0) {
          const firstProps = wfsData.features[0].properties;
          console.log('Colonnes disponibles:', Object.keys(firstProps));
          
          // Extraire les noms pour comparaison
          const names = wfsData.features.map(f => {
            const p = f.properties;
            return {
              adm1_name: p.adm1_name,
              adm1_name1: p.adm1_name1,
              adm1_ref_name1: p.adm1_ref_name1,
              name: p.name,
              nom_region: p.nom_region
            };
          });
          console.table(names);
        }
        console.groupEnd();
        
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
