export interface DataPoint {
  fnid: string;
  region: string;
  department: string;
  product: string;
  season_year: number;
  indicator: string;
  value: number | null;
  unit: string;
  status: 'confirmed' | 'estimated' | 'missing';
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

export const CROPS = ['Maïs', 'Manioc', 'Cacao', 'Café', 'Banane Plantain', 'Sorgho', 'Riz', 'Haricot', 'Arachide', 'Igname', 'Patate douce', 'Pomme de terre', 'Coton', 'Hévéa', 'Palmier à huile', 'Agrumes', 'Tomate', 'Oignon', 'Ail', 'Piment', 'Gombo', 'Ananas', 'Avocat'];
export const LIVESTOCK = ['Bovins', 'Ovins', 'Caprins', 'Porcins', 'Volailles'];
export const FISHERIES = ['Pêche Artisanale Maritime', 'Pêche Artisanale Continentale', 'Pêche Industrielle', 'Pisciculture'];
export const INFRASTRUCTURES = ['Débarcadères', 'Marchés à poisson', 'Stations aquacoles', 'Usines de glace'];

// Specific year ranges based on data availability
const YEARS_AGRI = Array.from({ length: 25 }, (_, i) => 1998 + i); // 1998 - 2022
const YEARS_LIVESTOCK = Array.from({ length: 7 }, (_, i) => 2015 + i); // 2015 - 2021
const YEARS_FISHERIES = [2021]; // Mainly 2021 for departmental data

export const generateMockData = (): DataPoint[] => {
  const data: DataPoint[] = [];

  Object.entries(REGIONS_DEPARTMENTS).forEach(([region, depts]) => {
    depts.forEach(dept => {
      const fnid = `CM-${region.substring(0, 2).toUpperCase()}-${dept.substring(0, 3).toUpperCase()}`;

      // --- AGRICULTURE (Departmental, 1998-2022) ---
      YEARS_AGRI.forEach(year => {
        CROPS.forEach(crop => {
          const isMissing = Math.random() > 0.98;
          const baseValue = (year - 1998) * 15 + Math.random() * 200;
          
          ['Production', 'Surface Cultivée', 'Rendement'].forEach(ind => {
             let unit = ind === 'Production' ? 'tonnes' : ind === 'Surface Cultivée' ? 'ha' : 't/ha';
             let val = baseValue;
             if (ind === 'Surface Cultivée') val = baseValue / 2;
             if (ind === 'Rendement') val = (baseValue / (baseValue / 2 || 1));

             data.push({
               fnid, region, department: dept, product: crop, season_year: year,
               indicator: ind, 
               value: isMissing ? null : val, 
               unit, 
               status: isMissing ? 'missing' : 'confirmed',
               granularity: 'departmental'
             });
          });
        });
      });

      // --- LIVESTOCK (Regional mostly, 2015-2021) ---
      YEARS_LIVESTOCK.forEach(year => {
        LIVESTOCK.forEach(animal => {
          // Data is Regional. We simulate this by giving all depts in a region the same "regional average" or marking as regional
          const isRegionalDataOnly = year >= 2020; 
          const status = isRegionalDataOnly ? 'confirmed' : 'estimated'; 
          
          data.push({
            fnid, region, department: dept, product: animal, season_year: year,
            indicator: 'Effectif', 
            value: Math.floor(Math.random() * 10000) + 500, 
            unit: 'têtes',
            status,
            granularity: 'regional'
          });
        });
      });

      // --- FISHERIES (Departmental 2021, Regional Infrastructures) ---
      YEARS_FISHERIES.forEach(year => {
         FISHERIES.forEach(type => {
            data.push({
               fnid, region, department: dept, product: type, season_year: year,
               indicator: 'Production',
               value: Math.random() * 500,
               unit: 'tonnes',
               status: 'confirmed',
               granularity: 'departmental'
            });
         });

         // Infrastructure (2021 only)
         INFRASTRUCTURES.forEach(infra => {
             data.push({
                 fnid, region, department: dept, product: 'Infrastructure', season_year: year,
                 indicator: infra,
                 value: Math.floor(Math.random() * 5),
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
