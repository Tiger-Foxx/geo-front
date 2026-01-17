export interface DataPoint {
  fnid: string; // Region + Department Code (e.g., "CM-CE-MFOU")
  region: string;
  department: string;
  product: string;
  season_year: number;
  indicator: 'Production' | 'Area harvested' | 'Yield';
  value: number;
  unit: string;
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
export const FISHERIES = ['Pêche Artisanale Maritime', 'Pêche Artisanale Continentale', 'Pisciculture'];

const YEARS = Array.from({ length: 43 }, (_, i) => 1980 + i); // 1980 - 2022

export const generateMockData = (): DataPoint[] => {
  const data: DataPoint[] = [];

  Object.entries(REGIONS_DEPARTMENTS).forEach(([region, depts]) => {
    depts.forEach(dept => {
      const fnid = `CM-${region.substring(0, 2).toUpperCase()}-${dept.substring(0, 3).toUpperCase()}`;
      
      YEARS.forEach(year => {
        // Agriculture
        CROPS.forEach(crop => {
           // Simulate realistic data with some randomness but consistent trends
           const baseValue = (year - 1980) * 10 + Math.random() * 100;
           
           data.push({
             fnid, region, department: dept, product: crop, season_year: year,
             indicator: 'Production', value: baseValue * 5, unit: 'mt'
           });
           data.push({
             fnid, region, department: dept, product: crop, season_year: year,
             indicator: 'Area harvested', value: baseValue * 2, unit: 'ha'
           });
           data.push({
             fnid, region, department: dept, product: crop, season_year: year,
             indicator: 'Yield', value: (baseValue * 5) / (baseValue * 2 || 1), unit: 'mt/ha'
           });
        });

        // Livestock
        LIVESTOCK.forEach(animal => {
           data.push({
             fnid, region, department: dept, product: animal, season_year: year,
             indicator: 'Production', value: Math.floor(Math.random() * 5000) + 1000, unit: 'têtes'
           });
        });
      });
    });
  });

  return data;
};
