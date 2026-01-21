import type { DataPoint } from '../data/mockData';

export interface PivotResult {
  [key: string]: string | number;
}

export const filterData = (
  data: DataPoint[],
  filters: {
    product?: string;
    years?: [number, number]; // Range [start, end]
    region?: string;
    department?: string;
    indicator?: string;
  }
) => {
  return data.filter(item => {
    if (filters.product && item.product !== filters.product) return false;
    if (filters.years && (item.season_year < filters.years[0] || item.season_year > filters.years[1])) return false;
    if (filters.region && item.region !== filters.region) return false;
    if (filters.department && item.department !== filters.department) return false;
    if (filters.indicator && item.indicator !== filters.indicator) return false;
    return true;
  });
};

export const aggregateDataByDepartment = (filteredData: DataPoint[]) => {
  const aggregation: Record<string, { total: number; count: number }> = {};

  filteredData.forEach(item => {
    if (!aggregation[item.department]) {
      aggregation[item.department] = { total: 0, count: 0 };
    }
    aggregation[item.department].total += item.value ?? 0;
    aggregation[item.department].count += 1;
  });

  // Calculate mean
  const result: Record<string, number> = {};
  Object.keys(aggregation).forEach(dept => {
    result[dept] = aggregation[dept].total / aggregation[dept].count;
  });

  return result;
};

export const pivotByYear = (data: DataPoint[], indicator: string): any[] => {
    const years = Array.from(new Set(data.map(d => d.season_year))).sort();
    const depts = Array.from(new Set(data.map(d => d.department)));
    
    // Rows: Departments, Cols: Years
    return depts.map(dept => {
        const row: any = { department: dept };
        years.forEach(year => {
            const entry = data.find(d => d.department === dept && d.season_year === year && d.indicator === indicator);
            row[year] = entry ? entry.value : null;
        });
        return row;
    });
}

/**
 * Data Display States:
 * - null/undefined: "Indisponible" (data not collected/available for this cell)
 * - 0: Valid value, means "no production" (gray/white on map)
 * - number > 0: Normal display with color intensity
 */
export type DataState = 'unavailable' | 'zero' | 'hasValue';

export const getDataState = (value: number | null | undefined): DataState => {
    if (value === null || value === undefined) return 'unavailable';
    if (value === 0) return 'zero';
    return 'hasValue';
};

export const formatCellValue = (value: number | null | undefined, unit?: string): string => {
    const state = getDataState(value);
    if (state === 'unavailable') return 'Indisponible';
    if (state === 'zero') return '0';
    return value!.toLocaleString('fr-FR', { maximumFractionDigits: 1 }) + (unit ? ` ${unit}` : '');
};

/**
 * Sector-specific year range constraints based on available data
 */
export const SECTOR_YEAR_RANGES = {
    agriculture: { min: 1998, max: 2022, granularity: 'departement' as const },
    elevage: { 
        national: { min: 2015, max: 2021 },
        regional: { min: 2020, max: 2021 },
        departement: null // Not available
    },
    peche: { min: 2021, max: 2021, granularity: 'departement' as const }
} as const;

export const isYearAvailable = (sector: 'agriculture' | 'elevage' | 'peche', year: number, level: 'national' | 'regional' | 'departement'): boolean => {
    if (sector === 'agriculture') {
        return year >= 1998 && year <= 2022;
    }
    if (sector === 'elevage') {
        if (level === 'national') return year >= 2015 && year <= 2021;
        if (level === 'regional') return year >= 2020 && year <= 2021;
        return false; // departement not available for elevage
    }
    if (sector === 'peche') {
        return year === 2021;
    }
    return false;
};
