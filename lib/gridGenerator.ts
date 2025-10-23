import { generatePavlodarGridFiltered } from './pavlodarBoundary';

export interface GridPoint {
  lat: number;
  lon: number;
}

// Enhanced grid generation with boundary filtering and higher density
export function generatePavlodarGrid(step: number = 0.3): GridPoint[] {
  // Use the filtered grid that only includes points inside Pavlodar Oblast
  return generatePavlodarGridFiltered(step);
}

// Legacy function for backward compatibility (now uses filtered boundary)
export function generatePavlodarGridLegacy(): GridPoint[] {
  const grid: GridPoint[] = [];
  
  // Old simple rectangular boundaries (kept for reference)
  const latMin = 51.0;
  const latMax = 54.5;
  const lonMin = 75.0;
  const lonMax = 80.0;
  const step = 0.5;
  
  for (let lat = latMin; lat <= latMax; lat += step) {
    for (let lon = lonMin; lon <= lonMax; lon += step) {
      grid.push({
        lat: Math.round(lat * 10) / 10,
        lon: Math.round(lon * 10) / 10
      });
    }
  }
  
  return grid;
}