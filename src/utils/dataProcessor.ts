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
    aggregation[item.department].total += item.value;
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
