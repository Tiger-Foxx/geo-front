export interface DataPoint {
  fnid: string;
  region: string;
  department: string;
  product: string;
  season_year: number;
  indicator: string;
  value: number | null; // null = Indisponible, 0 = Pas de production
  unit: string;
  status: 'confirmed' | 'estimated' | 'unavailable';
  granularity: 'national' | 'regional' | 'departmental';
}

export const REGIONS_DEPARTMENTS: Record<string, string[]> = {
  'Adamaoua': ['Djerem', 'Faro-et-Deo', 'Mayo-Banyo', 'Mbere', 'Vina'],
  'Centre': ['Haute-Sanaga', 'Lekie', 'Mbam-et-Inoubou', 'Mbam-et-Kim', 'Mefou-et-Afamba', 'Mefou-et-Akono', 'Mfoundi', 'Nyong-et-Kelle', 'Nyong-et-Mfoumou', 'Nyong-et-SoO'],
  'Est': ['Boumba-et-Ngoko', 'Haut-Nyong', 'Kadey', 'Lom-et-Djerem'],
  'Extreme-Nord': ['Diamare', 'Logone-et-Chari', 'Mayo-Danay', 'Mayo-Kani', 'Mayo-Sava', 'Mayo-Tsanaga'],
  'Littoral': ['Moungo', 'Nkam', 'Sanaga-Maritime', 'Wouri'],
  'Nord': ['Benoue', 'Faro', 'Mayo-Louti', 'Mayo-Rey'],
  'Nord-Ouest': ['Boyo', 'Bui', 'Donga-Mantung', 'Menchum', 'Mezam', 'Momo', 'Ngo-Ketunjia'],
  'Ouest': ['Bamboutos', 'Haut-Nkam', 'Hauts-Plateaux', 'Koung-Khi', 'Menoua', 'Mifi', 'Nde', 'Noun'],
  'Sud': ['Dja-et-Lobo', 'Mvila', 'Ocean', 'Vallee-du-Ntem'],
  'Sud-Ouest': ['Fako', 'Koupe-Manengouba', 'Lebialem', 'Manyu', 'Meme', 'Ndian']
};

export const REGIONS = Object.keys(REGIONS_DEPARTMENTS);

export const CROPS = ['Maïs', 'Manioc', 'Cacao', 'Café', 'Banane Plantain', 'Sorgho', 'Riz', 'Haricot', 'Arachide', 'Igname', 'Patate douce', 'Pomme de terre', 'Coton', 'Hévéa', 'Palmier à huile', 'Agrumes', 'Tomate', 'Oignon', 'Ail', 'Piment', 'Gombo', 'Ananas', 'Avocat'];
export const LIVESTOCK = ['Bovins', 'Ovins', 'Caprins', 'Porcins', 'Volailles'];
export const FISHERIES = ['Pêche Artisanale Maritime', 'Pêche Continentale', 'Pêche Industrielle', 'Pisciculture'];
export const FISH_INFRASTRUCTURE = ['Débarcadères', 'Halls de vente', 'Fumoirs', 'Etangs actifs', 'Cages', 'Bacs'];

// Year ranges based on actual data availability
const YEARS_AGRI = Array.from({ length: 25 }, (_, i) => 1998 + i); // 1998 - 2022
const YEARS_LIVESTOCK_NATIONAL = Array.from({ length: 7 }, (_, i) => 2015 + i); // 2015 - 2021
const YEARS_LIVESTOCK_REGIONAL = [2020, 2021]; // Regional data only for these
const YEARS_PECHE = [2021]; // Only 2021

export const generateMockData = (): DataPoint[] => {
  const data: DataPoint[] = [];

  Object.entries(REGIONS_DEPARTMENTS).forEach(([region, depts]) => {
    depts.forEach(dept => {
      const fnid = `CM-${region.substring(0, 2).toUpperCase()}-${dept.substring(0, 3).toUpperCase()}`;

      // === AGRICULTURE (Departmental, 1998-2022) ===
      YEARS_AGRI.forEach(year => {
        CROPS.forEach(crop => {
          // Simulate occasional null values (data gaps)
          const hasData = Math.random() > 0.02;
          // Simulate occasional zero (no production in that zone)
          const isZero = hasData && Math.random() > 0.95;
          
          const baseValue = (year - 1998) * 15 + Math.random() * 300;
          
          data.push({
            fnid, region, department: dept, product: crop, season_year: year,
            indicator: 'Production',
            value: !hasData ? null : isZero ? 0 : baseValue,
            unit: 'tonnes',
            status: !hasData ? 'unavailable' : 'confirmed',
            granularity: 'departmental'
          });
          
          data.push({
            fnid, region, department: dept, product: crop, season_year: year,
            indicator: 'Surface Cultivée',
            value: !hasData ? null : isZero ? 0 : baseValue / 2,
            unit: 'ha',
            status: !hasData ? 'unavailable' : 'confirmed',
            granularity: 'departmental'
          });
        });
      });

      // === ELEVAGE (Regional only for 2020-2021) ===
      YEARS_LIVESTOCK_REGIONAL.forEach(year => {
        LIVESTOCK.forEach(animal => {
          // All depts in a region get the same value (regional data)
          const regionalValue = Math.floor(Math.random() * 500000) + 10000;
          
          data.push({
            fnid, region, department: dept, product: animal, season_year: year,
            indicator: 'Effectif',
            value: regionalValue,
            unit: 'têtes',
            status: 'confirmed',
            granularity: 'regional' // Important: data is regional
          });
        });
      });
      
      // Elevage for years 2015-2019: only National data exists, so mark as unavailable at dept level
      YEARS_LIVESTOCK_NATIONAL.filter(y => y < 2020).forEach(year => {
        LIVESTOCK.forEach(animal => {
          data.push({
            fnid, region, department: dept, product: animal, season_year: year,
            indicator: 'Effectif',
            value: null, // No departmental/regional data
            unit: 'têtes',
            status: 'unavailable',
            granularity: 'departmental'
          });
        });
      });

      // === PECHE (2021 only, departmental) ===
      YEARS_PECHE.forEach(year => {
        FISHERIES.forEach(type => {
          const hasData = Math.random() > 0.1;
          const isZero = hasData && Math.random() > 0.8;
          
          data.push({
            fnid, region, department: dept, product: type, season_year: year,
            indicator: 'Production',
            value: !hasData ? null : isZero ? 0 : Math.random() * 500,
            unit: 'tonnes',
            status: !hasData ? 'unavailable' : 'confirmed',
            granularity: 'departmental'
          });
        });

        // Infrastructure (Regional level)
        FISH_INFRASTRUCTURE.forEach(infra => {
          data.push({
            fnid, region, department: dept, product: 'Infrastructure', season_year: year,
            indicator: infra,
            value: Math.floor(Math.random() * 10),
            unit: 'unités',
            status: 'confirmed',
            granularity: 'regional'
          });
        });
      });
    });
  });

  return data;
};
