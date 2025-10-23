/**
 * Geographic utility functions for polygon operations
 */

/**
 * Check if a point is inside a polygon using ray casting algorithm
 * More accurate than simple bounding box check
 */
export function isPointInPolygon(
  point: [number, number], 
  polygon: number[][][]
): boolean {
  if (!polygon || !polygon[0] || polygon[0].length < 3) {
    return false;
  }
  
  const [lon, lat] = point;
  const coords = polygon[0]; // First ring (outer boundary)
  
  let inside = false;
  
  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const [xi, yi] = coords[i];
    const [xj, yj] = coords[j];
    
    // Ray casting algorithm
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Check if a point is inside any of multiple polygons (for combined regions)
 */
export function isPointInAnyPolygon(
  point: [number, number], 
  boundaries: any
): boolean {
  // Handle FeatureCollection (multiple regions)
  if (boundaries && boundaries.type === 'FeatureCollection' && boundaries.features) {
    return boundaries.features.some((feature: any) => {
      if (feature.geometry && feature.geometry.coordinates) {
        return isPointInPolygon(point, feature.geometry.coordinates);
      }
      return false;
    });
  }
  
  // Handle single Feature
  if (boundaries && boundaries.geometry && boundaries.geometry.coordinates) {
    return isPointInPolygon(point, boundaries.geometry.coordinates);
  }
  
  return false;
}

/**
 * Check if a point is inside a specific feature (single region)
 */
export function isPointInFeature(
  point: [number, number], 
  feature: any
): boolean {
  if (feature && feature.geometry && feature.geometry.coordinates) {
    return isPointInPolygon(point, feature.geometry.coordinates);
  }
  return false;
}

/**
 * Get bounding box from polygon for optimization
 */
export function getBoundingBox(polygon: number[][][]): {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
} {
  if (!polygon || !polygon[0] || polygon[0].length === 0) {
    return { minLat: 51.8, maxLat: 55.2, minLon: 66.0, maxLon: 72.0 };
  }
  
  const coords = polygon[0];
  
  let minLon = Infinity, maxLon = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;
  
  coords.forEach(([lon, lat]) => {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  });
  
  return { minLat, maxLat, minLon, maxLon };
}

/**
 * Calculate polygon area (for validation)
 */
export function calculatePolygonArea(polygon: number[][][]): number {
  if (!polygon || !polygon[0] || polygon[0].length < 3) {
    return 0;
  }
  
  const coords = polygon[0];
  let area = 0;
  
  for (let i = 0; i < coords.length - 1; i++) {
    const [x1, y1] = coords[i];
    const [x2, y2] = coords[i + 1];
    area += (x1 * y2 - x2 * y1);
  }
  
  return Math.abs(area) / 2;
}

/**
 * Simplify polygon by removing unnecessary points (Douglas-Peucker)
 */
export function simplifyPolygon(
  polygon: number[][][], 
  tolerance: number = 0.01
): number[][][] {
  if (!polygon || !polygon[0] || polygon[0].length < 3) {
    return polygon;
  }
  
  function distanceToSegment(point: number[], start: number[], end: number[]): number {
    const [px, py] = point;
    const [sx, sy] = start;
    const [ex, ey] = end;
    
    const A = px - sx;
    const B = py - sy;
    const C = ex - sx;
    const D = ey - sy;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) return Math.sqrt(A * A + B * B);
    
    const param = dot / lenSq;
    
    let xx, yy;
    if (param < 0) {
      xx = sx;
      yy = sy;
    } else if (param > 1) {
      xx = ex;
      yy = ey;
    } else {
      xx = sx + param * C;
      yy = sy + param * D;
    }
    
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  function douglasPeucker(points: number[][], tolerance: number): number[][] {
    if (points.length <= 2) return points;
    
    let maxDist = 0;
    let maxIndex = 0;
    
    for (let i = 1; i < points.length - 1; i++) {
      const dist = distanceToSegment(points[i], points[0], points[points.length - 1]);
      if (dist > maxDist) {
        maxDist = dist;
        maxIndex = i;
      }
    }
    
    if (maxDist > tolerance) {
      const left = douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
      const right = douglasPeucker(points.slice(maxIndex), tolerance);
      return left.slice(0, -1).concat(right);
    } else {
      return [points[0], points[points.length - 1]];
    }
  }
  
  const simplified = douglasPeucker(polygon[0], tolerance);
  return [simplified];
}

/**
 * Validate polygon geometry
 */
export function validatePolygon(polygon: number[][][]): boolean {
  if (!polygon || !Array.isArray(polygon) || polygon.length === 0) {
    return false;
  }
  
  const coords = polygon[0];
  if (!coords || !Array.isArray(coords) || coords.length < 4) {
    return false;
  }
  
  // Check if polygon is closed
  const first = coords[0];
  const last = coords[coords.length - 1];
  const isClosed = first[0] === last[0] && first[1] === last[1];
  
  if (!isClosed) {
    console.warn('⚠️ Polygon is not properly closed');
  }
  
  // Check for valid coordinates
  for (const [lon, lat] of coords) {
    if (typeof lon !== 'number' || typeof lat !== 'number') {
      return false;
    }
    if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      return false;
    }
  }
  
  return true;
}