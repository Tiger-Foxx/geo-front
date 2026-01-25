// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA - STRUCTURE MULTISCALAIRE ALIGNÉE SUR LE RAPPORT TECHNIQUE
// ═══════════════════════════════════════════════════════════════════════════════

// ───────────────────────────────────────────────────────────────────────────────
// 1. RÉFÉRENTIEL GÉOGRAPHIQUE (SOCLE)
// ───────────────────────────────────────────────────────────────────────────────

export const REGIONS = [
  'Adamaoua', 'Centre', 'Est', 'Extreme-Nord', 'Littoral',
  'Nord', 'Nord-Ouest', 'Ouest', 'Sud', 'Sud-Ouest'
] as const;

export const REGIONS_DEPARTMENTS: Record<string, string[]> = {
  'Adamaoua': ['Djerem', 'Faro-et-Deo', 'Mayo-Banyo', 'Mbere', 'Vina'],
  'Centre': ['Haute-Sanaga', 'Lekie', 'Mbam-et-Inoubou', 'Mbam-et-Kim', 'Mefou-et-Afamba', 'Mefou-et-Akono', 'Mfoundi', 'Nyong-et-Kelle', 'Nyong-et-Mfoumou', 'Nyong-et-Soo'],
  'Est': ['Boumba-et-Ngoko', 'Haut-Nyong', 'Kadey', 'Lom-et-Djerem'],
  'Extreme-Nord': ['Diamare', 'Logone-et-Chari', 'Mayo-Danay', 'Mayo-Kani', 'Mayo-Sava', 'Mayo-Tsanaga'],
  'Littoral': ['Moungo', 'Nkam', 'Sanaga-Maritime', 'Wouri'],
  'Nord': ['Benoue', 'Faro', 'Mayo-Louti', 'Mayo-Rey'],
  'Nord-Ouest': ['Boyo', 'Bui', 'Donga-Mantung', 'Menchum', 'Mezam', 'Momo', 'Ngo-Ketunjia'],
  'Ouest': ['Bamboutos', 'Haut-Nkam', 'Hauts-Plateaux', 'Koung-Khi', 'Menoua', 'Mifi', 'Nde', 'Noun'],
  'Sud': ['Dja-et-Lobo', 'Mvila', 'Ocean', 'Vallee-du-Ntem'],
  'Sud-Ouest': ['Fako', 'Koupe-Manengouba', 'Lebialem', 'Manyu', 'Meme', 'Ndian']
};

export interface ChefLieu {
  name: string;
  type: 'departement' | 'arrondissement';
  x_coord: number;
  y_coord: number;
  adm_name: string;
}

export const CHEFS_LIEUX_DEPARTEMENTS: ChefLieu[] = [
  { name: 'Yaoundé', type: 'departement', x_coord: 11.5021, y_coord: 3.8480, adm_name: 'Mfoundi' },
  { name: 'Douala', type: 'departement', x_coord: 9.7679, y_coord: 4.0511, adm_name: 'Wouri' },
  { name: 'Garoua', type: 'departement', x_coord: 13.4000, y_coord: 9.3000, adm_name: 'Benoue' },
  { name: 'Maroua', type: 'departement', x_coord: 14.3208, y_coord: 10.5930, adm_name: 'Diamare' },
  { name: 'Bafoussam', type: 'departement', x_coord: 10.4176, y_coord: 5.4778, adm_name: 'Mifi' },
  { name: 'Bamenda', type: 'departement', x_coord: 10.1591, y_coord: 5.9631, adm_name: 'Mezam' },
  { name: 'Ngaoundéré', type: 'departement', x_coord: 13.5784, y_coord: 7.3190, adm_name: 'Vina' },
  { name: 'Bertoua', type: 'departement', x_coord: 13.6769, y_coord: 4.5773, adm_name: 'Lom-et-Djerem' },
  { name: 'Ebolowa', type: 'departement', x_coord: 11.1500, y_coord: 2.9000, adm_name: 'Mvila' },
  { name: 'Buéa', type: 'departement', x_coord: 9.2435, y_coord: 4.1550, adm_name: 'Fako' },
];

// ───────────────────────────────────────────────────────────────────────────────
// 2. AGRICULTURE - Granularité Départementale (1998-2022)
// ───────────────────────────────────────────────────────────────────────────────

export const CROPS = [
  'Maïs', 'Sorgho', 'Riz', 'Manioc', 'Igname', 'Patate douce', 'Pomme de terre',
  'Haricot', 'Arachide', 'Cacao', 'Café', 'Coton', 'Banane Plantain',
  'Huile de palme', 'Tomate', 'Oignon'
] as const;

export const AGRI_INDICATORS = ['Production', 'Area Planted', 'Yield'] as const;
export const AGRI_UNITS: Record<typeof AGRI_INDICATORS[number], string> = {
  'Production': 'tonnes',
  'Area Planted': 'ha',
  'Yield': 'kg/ha'
};

export interface AgriData {
  fnid: string;
  region: string;
  departement: string;
  product: string;
  indicator: typeof AGRI_INDICATORS[number];
  annee: number; // 1998-2022
  valeur: number;
  unite: string;
}

// ───────────────────────────────────────────────────────────────────────────────
// 3. PÊCHE - Structure Multiscalaire
// ───────────────────────────────────────────────────────────────────────────────

// A. National (2015-2021) - Évolution temporelle
export interface PecheNational {
  annee: number;
  prod_industrielle: number;
  prod_continentale: number;
  prod_artisanale: number;
  aquaculture: number;
  prod_totale: number;
  taux_croissance: number;
}

// B. Régional (2021) - Infrastructures
export const PECHE_INFRA_TYPES = ['etangs', 'fumoirs', 'halls_vente', 'bacs', 'cages'] as const;
export interface PecheRegionalInfra {
  region: string;
  annee: 2021;
  etangs: number;
  fumoirs: number;
  halls_vente: number;
  bacs: number;
  cages: number;
}

// C. Départemental (2021) - Production
export interface PecheDepartementalProd {
  region: string;
  departement: string;
  annee: 2021;
  valeur: number;
  unite: 'tonnes';
}

// ───────────────────────────────────────────────────────────────────────────────
// 4. ÉLEVAGE - Régional & National
// ───────────────────────────────────────────────────────────────────────────────

export const LIVESTOCK_FILIERES = ['Bovins', 'Ovins', 'Caprins', 'Porcins', 'Volailles'] as const;

// A. Régional (2020-2021)
export interface ElevageRegional {
  region: string;
  annee: 2020 | 2021;
  filiere: typeof LIVESTOCK_FILIERES[number];
  effectif: number;
}

// B. National (2015-2021) - Historique
export interface ElevageNational {
  annee: number;
  filiere: typeof LIVESTOCK_FILIERES[number];
  effectif: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATA STORE - Base de données Mock
// ═══════════════════════════════════════════════════════════════════════════════

export const MOCK_DB = {
  agriculture: [] as AgriData[],
  peche: {
    national: [] as PecheNational[],
    regional: [] as PecheRegionalInfra[],
    departemental: [] as PecheDepartementalProd[]
  },
  elevage: {
    national: [] as ElevageNational[],
    regional: [] as ElevageRegional[]
  }
};

// ───────────────────────────────────────────────────────────────────────────────
// GÉNÉRATION DES DONNÉES
// ───────────────────────────────────────────────────────────────────────────────

// 1. AGRICULTURE (32 160 entrées théoriques : 58 dép × 16 crops × 25 ans × ~3 indicators)
for (let annee = 1998; annee <= 2022; annee++) {
  Object.entries(REGIONS_DEPARTMENTS).forEach(([region, depts]) => {
    depts.forEach(dept => {
      CROPS.forEach(crop => {
        const fnid = `CM-${region.substring(0, 3).toUpperCase()}-${dept.substring(0, 3).toUpperCase()}-${annee}`;
        const baseProd = Math.random() * 5000 + 500 + (annee - 1998) * 20;
        const baseArea = baseProd / (Math.random() * 2 + 1);
        
        MOCK_DB.agriculture.push(
          { fnid, region, departement: dept, product: crop, indicator: 'Production', annee, valeur: parseFloat(baseProd.toFixed(1)), unite: 'tonnes' },
          { fnid, region, departement: dept, product: crop, indicator: 'Area Planted', annee, valeur: parseFloat(baseArea.toFixed(1)), unite: 'ha' },
          { fnid, region, departement: dept, product: crop, indicator: 'Yield', annee, valeur: parseFloat((baseProd / baseArea * 1000).toFixed(2)), unite: 'kg/ha' }
        );
      });
    });
  });
}

// 2. PÊCHE NATIONAL (2015-2021)
for (let annee = 2015; annee <= 2021; annee++) {
  const base = 180000 + (annee - 2015) * 8000 + Math.random() * 5000;
  MOCK_DB.peche.national.push({
    annee,
    prod_industrielle: parseFloat((base * 0.12).toFixed(1)),
    prod_continentale: parseFloat((base * 0.38).toFixed(1)),
    prod_artisanale: parseFloat((base * 0.42).toFixed(1)),
    aquaculture: parseFloat((base * 0.08).toFixed(1)),
    prod_totale: parseFloat(base.toFixed(1)),
    taux_croissance: parseFloat(((Math.random() * 6 - 1)).toFixed(2))
  });
}

// 3. PÊCHE RÉGIONAL - Infrastructures (2021 uniquement)
REGIONS.forEach(region => {
  const isCoastal = ['Littoral', 'Sud', 'Sud-Ouest'].includes(region);
  MOCK_DB.peche.regional.push({
    region,
    annee: 2021,
    etangs: Math.floor(Math.random() * (isCoastal ? 300 : 100) + 20),
    fumoirs: Math.floor(Math.random() * (isCoastal ? 80 : 20) + 5),
    halls_vente: Math.floor(Math.random() * (isCoastal ? 15 : 5) + 1),
    bacs: Math.floor(Math.random() * (isCoastal ? 50 : 10) + 2),
    cages: Math.floor(Math.random() * (isCoastal ? 150 : 30) + 5)
  });
});

// 4. PÊCHE DÉPARTEMENTAL - Production (2021 uniquement)
Object.entries(REGIONS_DEPARTMENTS).forEach(([region, depts]) => {
  const isCoastal = ['Littoral', 'Sud', 'Sud-Ouest'].includes(region);
  depts.forEach(dept => {
    MOCK_DB.peche.departemental.push({
      region,
      departement: dept,
      annee: 2021,
      valeur: parseFloat((Math.random() * (isCoastal ? 15000 : 800) + 50).toFixed(1)),
      unite: 'tonnes'
    });
  });
});

// 5. ÉLEVAGE NATIONAL (2015-2021)
for (let annee = 2015; annee <= 2021; annee++) {
  LIVESTOCK_FILIERES.forEach(filiere => {
    const baseEffectif = filiere === 'Volailles' ? 50000000 : filiere === 'Bovins' ? 7000000 : 5000000;
    MOCK_DB.elevage.national.push({
      annee,
      filiere,
      effectif: Math.floor(baseEffectif * (1 + (annee - 2015) * 0.02) + Math.random() * baseEffectif * 0.05)
    });
  });
}

// 6. ÉLEVAGE RÉGIONAL (2020-2021 uniquement)
([2020, 2021] as const).forEach(annee => {
  REGIONS.forEach(region => {
    LIVESTOCK_FILIERES.forEach(filiere => {
      const isNorth = ['Adamaoua', 'Nord', 'Extreme-Nord'].includes(region);
      const baseEffectif = filiere === 'Volailles' ? 5000000 : filiere === 'Bovins' && isNorth ? 1500000 : 400000;
      MOCK_DB.elevage.regional.push({
        region,
        annee,
        filiere,
        effectif: Math.floor(baseEffectif + Math.random() * baseEffectif * 0.2)
      });
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/** Récupère les données agricoles filtrées */
export const getAgriData = (filters: { product?: string; indicator?: typeof AGRI_INDICATORS[number]; annee?: number; region?: string }) => {
  return MOCK_DB.agriculture.filter(d => 
    (!filters.product || d.product === filters.product) &&
    (!filters.indicator || d.indicator === filters.indicator) &&
    (!filters.annee || d.annee === filters.annee) &&
    (!filters.region || d.region === filters.region)
  );
};

/** Agrège les données agricoles par région (somme des départements) */
export const getAgriByRegion = (product: string, indicator: typeof AGRI_INDICATORS[number], annee: number) => {
  const data = getAgriData({ product, indicator, annee });
  const byRegion = new Map<string, number>();
  
  data.forEach(d => {
    const current = byRegion.get(d.region) || 0;
    byRegion.set(d.region, current + d.valeur);
  });
  
  return Array.from(byRegion.entries()).map(([region, valeur]) => ({ region, valeur }));
};

/** Récupère les données d'élevage régional */
export const getElevageRegional = (filiere: typeof LIVESTOCK_FILIERES[number], annee: 2020 | 2021) => {
  return MOCK_DB.elevage.regional.filter(d => d.filiere === filiere && d.annee === annee);
};

/** Récupère l'évolution nationale d'une filière d'élevage */
export const getElevageNationalTrend = (filiere: typeof LIVESTOCK_FILIERES[number]) => {
  return MOCK_DB.elevage.national.filter(d => d.filiere === filiere).sort((a, b) => a.annee - b.annee);
};

// ═══════════════════════════════════════════════════════════════════════════════
// LEGACY COMPATIBILITY - Pour ne pas casser les composants existants
// ═══════════════════════════════════════════════════════════════════════════════

export interface DataPoint {
  fnid: string;
  region: string;
  department: string;
  product: string;
  season_year: number;
  indicator: string;
  value: number | null;
  unit: string;
  status: 'confirmed' | 'estimated' | 'unavailable';
  granularity: 'national' | 'regional' | 'departmental';
}

/** Génère les données au format legacy pour compatibilité */
export const generateMockData = (): DataPoint[] => {
  return MOCK_DB.agriculture.map(d => ({
    fnid: d.fnid,
    region: d.region,
    department: d.departement,
    product: d.product,
    season_year: d.annee,
    indicator: d.indicator,
    value: d.valeur,
    unit: d.unite,
    status: 'confirmed' as const,
    granularity: 'departmental' as const
  }));
};

export const LIVESTOCK = LIVESTOCK_FILIERES;
export const FISHERIES = ['Pêche Artisanale', 'Pêche Continentale', 'Pêche Industrielle', 'Aquaculture'] as const;
export const FISH_INFRASTRUCTURE = PECHE_INFRA_TYPES;
