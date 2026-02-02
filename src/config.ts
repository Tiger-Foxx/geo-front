// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION GLOBALE - Switch Mock/Backend
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Mode de fonctionnement de l'application
 * - 'mock': Utilise les données mockées locales (développement sans backend)
 * - 'geoserver': Utilise le backend GeoServer PostGIS
 */
export const DATA_MODE: 'mock' | 'geoserver' = 'geoserver';

/**
 * Configuration GeoServer
 */
export const GEOSERVER = {
  baseUrl: 'https://clnode321.clemson.cloudlab.us/geoserver',
  workspace: 'geoportal',
  timeout: 25000, // 25 secondes
};

/**
 * Active/Désactive les logs de debug API
 */
export const DEBUG_API = import.meta.env.DEV;

/**
 * Fallback automatique vers les données mock si GeoServer est inaccessible
 */
export const FALLBACK_TO_MOCK = true;
