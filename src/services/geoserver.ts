// ═══════════════════════════════════════════════════════════════════════════════
// GEOSERVER SERVICE - CENTRAL API LAYER
// Connexion WMS/WFS au backend PostGIS/GeoServer
// ═══════════════════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ───────────────────────────────────────────────────────────────────────────────

export const GEOSERVER_CONFIG = {
  baseUrl: 'http://130.127.134.108:8080/geoserver',
  workspace: 'geoportal',
  srs: 'EPSG:4326',
  wmsPath: '/geoportal/wms',
  wfsPath: '/geoportal/wfs',
} as const;

// URLs pré-construites
export const WMS_URL = `${GEOSERVER_CONFIG.baseUrl}${GEOSERVER_CONFIG.wmsPath}`;
export const WFS_URL = `${GEOSERVER_CONFIG.baseUrl}${GEOSERVER_CONFIG.wfsPath}`;

// ───────────────────────────────────────────────────────────────────────────────
// CATALOGUE DES COUCHES
// ───────────────────────────────────────────────────────────────────────────────

export const LAYERS = {
  // Référentiels Administratifs (Fonds de carte)
  admin: {
    pays: 'geoportal:ref_pays',
    regions: 'geoportal:ref_regions',
    departements: 'geoportal:ref_departements',
    arrondissements: 'geoportal:ref_arrondissements',
    chefsLieuxDep: 'geoportal:ref_chefs_lieux_dep',
    chefsLieuxArrond: 'geoportal:ref_chefs_lieux_arrond',
  },
  // Vues Thématiques
  thematic: {
    agriculture: 'geoportal:v_prod_agriculture',
    pecheNational: 'geoportal:v_peche_national',
    pecheInfraRegional: 'geoportal:v_peche_infra_regional',
    pecheProdDepartement: 'geoportal:v_peche_prod_departement',
    elevageNational: 'geoportal:v_elevage_national',
    elevageRegional: 'geoportal:v_elevage_regional',
  }
} as const;

// ───────────────────────────────────────────────────────────────────────────────
// TYPES
// ───────────────────────────────────────────────────────────────────────────────

export interface WFSFeature<T = Record<string, any>> {
  type: 'Feature';
  id: string;
  geometry: GeoJSON.Geometry | null;
  properties: T;
}

export interface WFSFeatureCollection<T = Record<string, any>> {
  type: 'FeatureCollection';
  features: WFSFeature<T>[];
  totalFeatures?: number;
  numberMatched?: number;
  numberReturned?: number;
}

// Types spécifiques par couche
export interface AgricultureProperties {
  product: string;
  indicator: string;
  annee: number;
  valeur: number;
  unite: string;
  fnid: string;
  region?: string;
  departement?: string;
}

export interface PecheNationalProperties {
  annee: number;
  prod_industrielle: number;
  prod_continentale: number;
  prod_artisanale: number;
  aquaculture: number;
  prod_totale: number;
  taux_croissance?: number;
}

export interface PecheInfraRegionalProperties {
  nom_region: string;
  annee: number;
  etangs: number;
  fumoirs: number;
  halls_vente: number;
  bacs: number;
  cages: number;
}

export interface PecheProdDepartementProperties {
  nom_dep: string;
  annee: number;
  prod_totale: number;
  note?: string;
}

export interface ElevageRegionalProperties {
  nom_region: string;
  annee: number;
  filiere: string;
  effectif: number;
}

export interface AdminRegionProperties {
  adm1_name1: string;
  [key: string]: any;
}

export interface AdminDepartementProperties {
  adm2_name1: string;
  adm1_name1?: string;
  [key: string]: any;
}

// ───────────────────────────────────────────────────────────────────────────────
// CONSTRUCTEURS D'URL
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Construit une URL WMS pour TileLayer
 */
export function buildWMSUrl(layer: string, options?: {
  cqlFilter?: string;
  styles?: string;
  format?: string;
  transparent?: boolean;
}): string {
  const params = new URLSearchParams({
    service: 'WMS',
    version: '1.1.1',
    request: 'GetMap',
    layers: layer,
    srs: GEOSERVER_CONFIG.srs,
    format: options?.format || 'image/png',
    transparent: String(options?.transparent ?? true),
  });

  if (options?.cqlFilter) {
    params.set('CQL_FILTER', options.cqlFilter);
  }
  if (options?.styles) {
    params.set('styles', options.styles);
  }

  return `${WMS_URL}?${params.toString()}`;
}

/**
 * Construit une URL WFS GetFeature
 */
export function buildWFSUrl(layer: string, options?: {
  cqlFilter?: string;
  propertyName?: string | string[];
  maxFeatures?: number;
  outputFormat?: string;
  sortBy?: string;
}): string {
  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeName: layer,
    outputFormat: options?.outputFormat || 'application/json',
    srsName: GEOSERVER_CONFIG.srs,
  });

  if (options?.cqlFilter) {
    params.set('CQL_FILTER', options.cqlFilter);
  }
  if (options?.propertyName) {
    const props = Array.isArray(options.propertyName) 
      ? options.propertyName.join(',') 
      : options.propertyName;
    params.set('propertyName', props);
  }
  if (options?.maxFeatures) {
    params.set('count', String(options.maxFeatures));
  }
  if (options?.sortBy) {
    params.set('sortBy', options.sortBy);
  }

  return `${WFS_URL}?${params.toString()}`;
}

/**
 * Construit une URL GetFeatureInfo pour les clics sur la carte
 */
export function buildGetFeatureInfoUrl(
  layer: string,
  bbox: [number, number, number, number],
  x: number,
  y: number,
  width: number,
  height: number,
  options?: { cqlFilter?: string }
): string {
  const params = new URLSearchParams({
    service: 'WMS',
    version: '1.1.1',
    request: 'GetFeatureInfo',
    layers: layer,
    query_layers: layer,
    info_format: 'application/json',
    srs: GEOSERVER_CONFIG.srs,
    bbox: bbox.join(','),
    width: String(width),
    height: String(height),
    x: String(Math.round(x)),
    y: String(Math.round(y)),
    feature_count: '10',
  });

  if (options?.cqlFilter) {
    params.set('CQL_FILTER', options.cqlFilter);
  }

  return `${WMS_URL}?${params.toString()}`;
}

// ───────────────────────────────────────────────────────────────────────────────
// FONCTIONS DE REQUÊTE
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Fetch générique WFS avec typage
 */
export async function fetchWFS<T = Record<string, any>>(
  layer: string,
  options?: Parameters<typeof buildWFSUrl>[1]
): Promise<WFSFeatureCollection<T>> {
  const url = buildWFSUrl(layer, options);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`WFS Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Extrait les valeurs uniques d'une propriété (pour les dropdowns dynamiques)
 */
export async function fetchUniqueValues(
  layer: string,
  propertyName: string
): Promise<string[]> {
  const data = await fetchWFS(layer, { propertyName });
  
  const values = new Set<string>();
  data.features.forEach(f => {
    const val = f.properties[propertyName];
    if (val !== null && val !== undefined) {
      values.add(String(val));
    }
  });
  
  return Array.from(values).sort();
}

/**
 * Extrait la plage d'années disponibles
 */
export async function fetchYearRange(layer: string): Promise<{ min: number; max: number; years: number[] }> {
  const data = await fetchWFS(layer, { propertyName: 'annee' });
  
  const years = new Set<number>();
  data.features.forEach(f => {
    const year = f.properties.annee;
    if (typeof year === 'number') {
      years.add(year);
    }
  });
  
  const sorted = Array.from(years).sort((a, b) => a - b);
  return {
    min: sorted[0] || 0,
    max: sorted[sorted.length - 1] || 0,
    years: sorted
  };
}

// ───────────────────────────────────────────────────────────────────────────────
// CQL FILTER BUILDERS
// ───────────────────────────────────────────────────────────────────────────────

export const CQL = {
  /**
   * Filtre par année
   */
  year: (year: number) => `annee=${year}`,

  /**
   * Filtre par produit agricole
   */
  product: (product: string) => `product='${product}'`,

  /**
   * Filtre par filière d'élevage
   */
  filiere: (filiere: string) => `filiere='${filiere}'`,

  /**
   * Filtre par région
   */
  region: (regionName: string) => `nom_region='${regionName}'`,

  /**
   * Filtre par département
   */
  departement: (depName: string) => `nom_dep='${depName}'`,

  /**
   * Filtre par indicateur agricole
   */
  indicator: (indicator: string) => `indicator='${indicator}'`,

  /**
   * Combine plusieurs filtres avec AND
   */
  and: (...filters: string[]) => filters.filter(Boolean).join(' AND '),

  /**
   * Combine plusieurs filtres avec OR
   */
  or: (...filters: string[]) => `(${filters.filter(Boolean).join(' OR ')})`,

  /**
   * Filtre complet Agriculture
   */
  agriculture: (product: string, indicator: string, year: number) => 
    CQL.and(CQL.product(product), CQL.indicator(indicator), CQL.year(year)),

  /**
   * Filtre complet Élevage
   */
  elevage: (filiere: string, year: number) => 
    CQL.and(CQL.filiere(filiere), CQL.year(year)),
};

// ───────────────────────────────────────────────────────────────────────────────
// API MÉTIER PAR SECTEUR
// ───────────────────────────────────────────────────────────────────────────────

export const GeoServerAPI = {
  // ─── RÉFÉRENTIELS ADMIN ─────────────────────────────────────────────────────
  admin: {
    async getRegions() {
      return fetchWFS<AdminRegionProperties>(LAYERS.admin.regions);
    },
    async getDepartements() {
      return fetchWFS<AdminDepartementProperties>(LAYERS.admin.departements);
    },
    async getArrondissements() {
      return fetchWFS(LAYERS.admin.arrondissements);
    },
    async getChefsLieuxDep() {
      return fetchWFS(LAYERS.admin.chefsLieuxDep);
    },
  },

  // ─── AGRICULTURE ────────────────────────────────────────────────────────────
  agriculture: {
    async getProducts(): Promise<string[]> {
      return fetchUniqueValues(LAYERS.thematic.agriculture, 'product');
    },
    async getIndicators(): Promise<string[]> {
      return fetchUniqueValues(LAYERS.thematic.agriculture, 'indicator');
    },
    async getYearRange() {
      return fetchYearRange(LAYERS.thematic.agriculture);
    },
    async getData(product: string, indicator: string, year: number) {
      return fetchWFS<AgricultureProperties>(LAYERS.thematic.agriculture, {
        cqlFilter: CQL.agriculture(product, indicator, year)
      });
    },
    async getDataForRegion(regionName: string, product: string, indicator: string, year: number) {
      return fetchWFS<AgricultureProperties>(LAYERS.thematic.agriculture, {
        cqlFilter: CQL.and(
          `region='${regionName}'`,
          CQL.agriculture(product, indicator, year)
        )
      });
    }
  },

  // ─── PÊCHE ──────────────────────────────────────────────────────────────────
  peche: {
    async getNationalData() {
      return fetchWFS<PecheNationalProperties>(LAYERS.thematic.pecheNational);
    },
    async getNationalDataByYear(year: number) {
      return fetchWFS<PecheNationalProperties>(LAYERS.thematic.pecheNational, {
        cqlFilter: CQL.year(year)
      });
    },
    async getInfraRegional(year: number = 2021) {
      return fetchWFS<PecheInfraRegionalProperties>(LAYERS.thematic.pecheInfraRegional, {
        cqlFilter: CQL.year(year)
      });
    },
    async getProdDepartement(year: number = 2021) {
      return fetchWFS<PecheProdDepartementProperties>(LAYERS.thematic.pecheProdDepartement, {
        cqlFilter: CQL.year(year)
      });
    },
    async getYearRange() {
      return fetchYearRange(LAYERS.thematic.pecheNational);
    }
  },

  // ─── ÉLEVAGE ────────────────────────────────────────────────────────────────
  elevage: {
    async getFilieres(): Promise<string[]> {
      return fetchUniqueValues(LAYERS.thematic.elevageRegional, 'filiere');
    },
    async getNationalData(filiere?: string, year?: number) {
      const filters = [];
      if (filiere) filters.push(CQL.filiere(filiere));
      if (year) filters.push(CQL.year(year));
      
      return fetchWFS<ElevageRegionalProperties>(LAYERS.thematic.elevageNational, {
        cqlFilter: filters.length ? CQL.and(...filters) : undefined
      });
    },
    async getRegionalData(filiere?: string, year?: number) {
      const filters = [];
      if (filiere) filters.push(CQL.filiere(filiere));
      if (year) filters.push(CQL.year(year));
      
      return fetchWFS<ElevageRegionalProperties>(LAYERS.thematic.elevageRegional, {
        cqlFilter: filters.length ? CQL.and(...filters) : undefined
      });
    },
    async getYearRange() {
      return fetchYearRange(LAYERS.thematic.elevageRegional);
    }
  }
};

// ───────────────────────────────────────────────────────────────────────────────
// UTILITAIRES DE TRANSFORMATION
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Transforme un WFS FeatureCollection en GeoJSON standard pour Leaflet
 */
export function toLeafletGeoJSON<T>(wfsData: WFSFeatureCollection<T>): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: wfsData.features.map(f => ({
      type: 'Feature',
      id: f.id,
      geometry: f.geometry,
      properties: f.properties
    })) as GeoJSON.Feature[]
  };
}

/**
 * Agrège les données par région (somme des départements)
 */
export function aggregateByRegion<T extends { region?: string; valeur?: number }>(
  features: WFSFeature<T>[]
): Map<string, number> {
  const regionTotals = new Map<string, number>();
  
  features.forEach(f => {
    const region = f.properties.region;
    const value = f.properties.valeur ?? 0;
    if (region) {
      regionTotals.set(region, (regionTotals.get(region) ?? 0) + value);
    }
  });
  
  return regionTotals;
}

/**
 * Pivote les données (lignes -> colonnes par année)
 */
export function pivotByYear<T extends { annee: number }>(
  features: WFSFeature<T>[],
  valueKey: keyof T,
  groupKey: keyof T
): Map<string, Record<number, any>> {
  const pivoted = new Map<string, Record<number, any>>();
  
  features.forEach(f => {
    const group = String(f.properties[groupKey]);
    const year = f.properties.annee;
    const value = f.properties[valueKey];
    
    if (!pivoted.has(group)) {
      pivoted.set(group, {});
    }
    pivoted.get(group)![year] = value;
  });
  
  return pivoted;
}

export default GeoServerAPI;
