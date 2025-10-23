import { isPointInAnyPolygon, isPointInFeature } from './geoUtils';

export interface GridPoint {
  lat: number;
  lon: number;
}

// Grid density levels
export const GRID_DENSITY = {
  LOW: 0.5,        // ~55 km between points (~25 points)
  MEDIUM: 0.3,     // ~33 km between points (~70 points) 
  HIGH: 0.2,       // ~22 km between points (~150 points)
  VERY_HIGH: 0.15, // ~17 km between points (~270 points)
  ULTRA_HIGH: 0.1  // ~11 km between points (~600 points)
} as const;

// Enhanced grid generation for North Kazakhstan Oblast only
export function generatePavlodarGrid(step: number = 0.2, boundary?: any): GridPoint[] {
  const grid: GridPoint[] = [];
  
  if (!boundary) {
    console.log('⚠️ No boundary provided, using fallback grid generation');
    return generateFallbackGrid(step);
  }
  
  // North Kazakhstan Oblast bounding box
  const latMin = 51.8;  // Southern border
  const latMax = 55.2;  // Northern border  
  const lonMin = 66.0;  // Western border
  const lonMax = 72.0;  // Eastern border
  
  console.log(`🗺️ Generating grid for North Kazakhstan Oblast with step: ${step}°`);
  console.log(`📍 Bounding box: lat[${latMin}, ${latMax}], lon[${lonMin}, ${lonMax}]`);
  
  let totalChecked = 0;
  let insideBoundary = 0;
  
  for (let lat = latMin; lat <= latMax; lat += step) {
    for (let lon = lonMin; lon <= lonMax; lon += step) {
      totalChecked++;
      
      // Check if point is inside North Kazakhstan Oblast
      if (isPointInAnyPolygon([lon, lat], boundary)) {
        insideBoundary++;
        grid.push({
          lat: Math.round(lat * 100) / 100,
          lon: Math.round(lon * 100) / 100
        });
      }
    }
  }
  
  console.log(`✅ Grid generation complete for North Kazakhstan Oblast:`);
  console.log(`   - Grid step: ${step}° (~${(step * 111).toFixed(1)} km)`);
  console.log(`   - Total points checked: ${totalChecked}`);
  console.log(`   - Points inside boundary: ${insideBoundary}`);
  console.log(`   - Efficiency: ${((insideBoundary / totalChecked) * 100).toFixed(1)}%`);
  console.log(`   - Point density: ~${(insideBoundary / 98000).toFixed(3)} points/km²`);
  console.log(`   - Average distance between points: ~${(step * 111).toFixed(1)} km`);
  
  return grid;
}

// Fallback grid for when boundary is not available
function generateFallbackGrid(step: number = 0.3): GridPoint[] {
  const grid: GridPoint[] = [];
  
  // North Kazakhstan Oblast approximate bounds
  const latMin = 51.8;
  const latMax = 55.2;
  const lonMin = 66.0;
  const lonMax = 72.0;
  
  for (let lat = latMin; lat <= latMax; lat += step) {
    for (let lon = lonMin; lon <= lonMax; lon += step) {
      grid.push({
        lat: Math.round(lat * 100) / 100,
        lon: Math.round(lon * 100) / 100
      });
    }
  }
  
  console.log(`📦 Generated fallback grid for North Kazakhstan Oblast with ${grid.length} points`);
  return grid;
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