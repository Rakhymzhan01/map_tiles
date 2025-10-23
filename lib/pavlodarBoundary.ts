// North Kazakhstan Oblast administrative boundary (simplified polygon)
// Based on actual Kazakhstan administrative boundaries
export const northKazakhstanBoundary = {
  type: "Feature" as const,
  properties: {
    name: "North Kazakhstan Oblast",
    name_en: "North Kazakhstan Region", 
    name_kz: "Солтүстік Қазақстан облысы"
  },
  geometry: {
    type: "Polygon" as const,
    coordinates: [[
      // Approximate boundary coordinates for North Kazakhstan Oblast
      [66.5, 55.0],  // Northwest
      [67.8, 55.2],  // North-northwest
      [69.2, 55.1],  // North
      [70.5, 54.9],  // Northeast
      [71.8, 54.5],  // Far northeast
      [72.0, 54.0],  // East-northeast
      [71.8, 53.2],  // East
      [71.3, 52.5],  // Southeast
      [70.5, 52.0],  // South-southeast
      [69.2, 51.8],  // South
      [67.8, 51.9],  // South-southwest
      [66.8, 52.2],  // Southwest
      [66.2, 52.8],  // West-southwest
      [66.0, 53.5],  // West
      [66.1, 54.2],  // Northwest-west
      [66.3, 54.7],  // Northwest
      [66.5, 55.0]   // Close polygon
    ]]
  }
};

// Keep the old name for backward compatibility but export the new boundary
export const pavlodarBoundary = northKazakhstanBoundary;

// Helper function to check if a point is inside the North Kazakhstan Oblast boundary
export function isPointInNorthKazakhstanOblast(lat: number, lon: number): boolean {
  const point: [number, number] = [lon, lat]; // Note: GeoJSON uses [lon, lat] format
  const polygon = northKazakhstanBoundary.geometry.coordinates[0] as [number, number][];
  
  return isPointInPolygon(point, polygon);
}

// Backward compatibility
export const isPointInPavlodarOblast = isPointInNorthKazakhstanOblast;

// Ray-casting algorithm to determine if point is inside polygon
function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  const [x, y] = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
}

// Get bounding box of North Kazakhstan Oblast
export function getNorthKazakhstanBounds() {
  const coords = northKazakhstanBoundary.geometry.coordinates[0] as [number, number][];
  
  let minLat = Infinity, maxLat = -Infinity;
  let minLon = Infinity, maxLon = -Infinity;
  
  coords.forEach(([lon, lat]) => {
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
  });
  
  return {
    latMin: minLat,
    latMax: maxLat,
    lonMin: minLon,
    lonMax: maxLon
  };
}

// Generate grid points only inside North Kazakhstan Oblast
export function generateNorthKazakhstanGridFiltered(step: number = 0.3): Array<{lat: number, lon: number}> {
  const bounds = getNorthKazakhstanBounds();
  const grid: Array<{lat: number, lon: number}> = [];
  
  // Create a denser grid with smaller step
  for (let lat = bounds.latMin; lat <= bounds.latMax; lat += step) {
    for (let lon = bounds.lonMin; lon <= bounds.lonMax; lon += step) {
      // Only include points that are inside the actual boundary
      if (isPointInNorthKazakhstanOblast(lat, lon)) {
        grid.push({
          lat: Math.round(lat * 1000) / 1000, // Round to 3 decimal places
          lon: Math.round(lon * 1000) / 1000
        });
      }
    }
  }
  
  console.log(`Generated ${grid.length} grid points inside North Kazakhstan Oblast (step: ${step}°)`);
  return grid;
}

// Backward compatibility functions
export const getPavlodarBounds = getNorthKazakhstanBounds;
export const generatePavlodarGridFiltered = generateNorthKazakhstanGridFiltered;