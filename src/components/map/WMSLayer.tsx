// ═══════════════════════════════════════════════════════════════════════════════
// WMS LAYER COMPONENT - Intégration native GeoServer
// ═══════════════════════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { WMS_URL, LAYERS, CQL } from '../../services/geoserver';

interface WMSLayerProps {
  layer: string;
  visible?: boolean;
  opacity?: number;
  cqlFilter?: string;
  zIndex?: number;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Composant WMS Layer pour Leaflet
 * Charge une couche WMS depuis GeoServer avec support CQL_FILTER
 */
export const WMSLayer = ({ 
  layer, 
  visible = true, 
  opacity = 0.8, 
  cqlFilter,
  zIndex = 100,
  onLoad,
  onError 
}: WMSLayerProps) => {
  const map = useMap();

  useEffect(() => {
    if (!visible) return;

    const wmsParams: L.WMSOptions = {
      layers: layer,
      format: 'image/png',
      transparent: true,
      version: '1.1.1',
      opacity,
      ...(cqlFilter && { CQL_FILTER: cqlFilter }),
    };

    const wmsLayer = L.tileLayer.wms(WMS_URL, wmsParams);
    
    wmsLayer.on('load', () => {
      onLoad?.();
    });

    wmsLayer.on('tileerror', (e) => {
      onError?.(new Error(`WMS Tile Error: ${e.tile}`));
    });

    wmsLayer.setZIndex(zIndex);
    wmsLayer.addTo(map);

    return () => {
      map.removeLayer(wmsLayer);
    };
  }, [map, layer, visible, opacity, cqlFilter, zIndex, onLoad, onError]);

  return null;
};

// ───────────────────────────────────────────────────────────────────────────────
// COUCHES ADMINISTRATIVES PRÉ-CONFIGURÉES
// ───────────────────────────────────────────────────────────────────────────────

interface AdminLayerProps {
  visible?: boolean;
  opacity?: number;
}

export const RegionsLayer = ({ visible = true, opacity = 0.6 }: AdminLayerProps) => (
  <WMSLayer 
    layer={LAYERS.admin.regions} 
    visible={visible} 
    opacity={opacity}
    zIndex={100}
  />
);

export const DepartementsLayer = ({ visible = true, opacity = 0.6 }: AdminLayerProps) => (
  <WMSLayer 
    layer={LAYERS.admin.departements} 
    visible={visible} 
    opacity={opacity}
    zIndex={110}
  />
);

export const ArrondissementsLayer = ({ visible = true, opacity = 0.5 }: AdminLayerProps) => (
  <WMSLayer 
    layer={LAYERS.admin.arrondissements} 
    visible={visible} 
    opacity={opacity}
    zIndex={120}
  />
);

export const ChefsLieuxDepLayer = ({ visible = true, opacity = 1 }: AdminLayerProps) => (
  <WMSLayer 
    layer={LAYERS.admin.chefsLieuxDep} 
    visible={visible} 
    opacity={opacity}
    zIndex={200}
  />
);

// ───────────────────────────────────────────────────────────────────────────────
// COUCHES THÉMATIQUES PRÉ-CONFIGURÉES
// ───────────────────────────────────────────────────────────────────────────────

interface AgriLayerProps {
  visible?: boolean;
  product: string;
  indicator: string;
  year: number;
  opacity?: number;
}

export const AgricultureLayer = ({ 
  visible = true, 
  product, 
  indicator, 
  year,
  opacity = 0.75 
}: AgriLayerProps) => (
  <WMSLayer 
    layer={LAYERS.thematic.agriculture} 
    visible={visible} 
    opacity={opacity}
    cqlFilter={CQL.agriculture(product, indicator, year)}
    zIndex={150}
  />
);

interface ElevageLayerProps {
  visible?: boolean;
  filiere: string;
  year: number;
  opacity?: number;
}

export const ElevageLayer = ({ 
  visible = true, 
  filiere, 
  year,
  opacity = 0.75 
}: ElevageLayerProps) => (
  <WMSLayer 
    layer={LAYERS.thematic.elevageRegional} 
    visible={visible} 
    opacity={opacity}
    cqlFilter={CQL.elevage(filiere, year)}
    zIndex={150}
  />
);

interface PecheLayerProps {
  visible?: boolean;
  year?: number;
  opacity?: number;
}

export const PecheDepartementLayer = ({ 
  visible = true, 
  year = 2021,
  opacity = 0.75 
}: PecheLayerProps) => (
  <WMSLayer 
    layer={LAYERS.thematic.pecheProdDepartement} 
    visible={visible} 
    opacity={opacity}
    cqlFilter={CQL.year(year)}
    zIndex={150}
  />
);

export const PecheInfraLayer = ({ 
  visible = true, 
  year = 2021,
  opacity = 0.75 
}: PecheLayerProps) => (
  <WMSLayer 
    layer={LAYERS.thematic.pecheInfraRegional} 
    visible={visible} 
    opacity={opacity}
    cqlFilter={CQL.year(year)}
    zIndex={150}
  />
);

export default WMSLayer;
