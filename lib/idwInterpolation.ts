/**
 * IDW (Inverse Distance Weighting) Interpolation
 * Calculates interpolated value at a point based on nearby data points
 */
export function idwInterpolate(
  targetLat: number,
  targetLon: number,
  dataPoints: Array<{ lat: number; lon: number; value: number }>,
  power: number = 2,
  maxDistance: number = 2.0 // degrees
): number | null {
  let weightSum = 0;
  let valueSum = 0;
  let hasNearbyPoints = false;

  for (const point of dataPoints) {
    const distance = Math.sqrt(
      Math.pow(targetLat - point.lat, 2) + 
      Math.pow(targetLon - point.lon, 2)
    );

    // Skip if too far away
    if (distance > maxDistance) continue;

    hasNearbyPoints = true;

    // If exactly on a data point, return its value
    if (distance < 0.001) {
      return point.value;
    }

    // Calculate weight: 1 / distance^power
    const weight = 1 / Math.pow(distance, power);
    weightSum += weight;
    valueSum += weight * point.value;
  }

  if (!hasNearbyPoints || weightSum === 0) {
    return null; // No nearby data
  }

  return valueSum / weightSum;
}

/**
 * Get smooth gradient color for moisture (raw percentage values 0-100%)
 */
export function getMoistureColor(value: number): { r: number; g: number; b: number } {
  // Enhanced color stops with better contrast for 5% intervals
  const colorStops = [
    { value: 0,  r: 92,  g: 51,  b: 23 },   // 0%:   Dark brown #5C3317 (Очень сухо)
    { value: 5,  r: 139, g: 69,  b: 19 },   // 5%:   Saddle brown #8B4513 (Сухо)
    { value: 10, r: 210, g: 105, b: 30 },   // 10%:  Chocolate #D2691E (Сухо)
    { value: 15, r: 255, g: 140, b: 0 },    // 15%:  Dark orange #FF8C00 (Немного сухо)
    { value: 20, r: 255, g: 215, b: 0 },    // 20%:  Gold #FFD700 (Нормально)
    { value: 25, r: 154, g: 205, b: 50 },   // 25%:  Yellow-green #9ACD32 (Нормально)
    { value: 30, r: 50,  g: 205, b: 50 },   // 30%:  Lime green #32CD32 (Влажно)
    { value: 35, r: 0,   g: 204, b: 102 },  // 35%:  Green #00CC66 (Влажно)
    { value: 40, r: 0,   g: 206, b: 209 },  // 40%:  Turquoise #00CED1 (Очень влажно)
    { value: 45, r: 65,  g: 105, b: 225 },  // 45%:  Royal blue #4169E1 (Очень влажно)
    { value: 50, r: 0,   g: 0,   b: 255 },  // 50%:  Blue #0000FF (Насыщено)
    { value: 60, r: 0,   g: 0,   b: 139 },  // 60%:  Dark blue #00008B (Переувлажнено)
    { value: 100, r: 0,  g: 0,   b: 100 }   // 100%: Navy #000064 (Экстремально влажно)
  ];

  // Clamp value to reasonable moisture range
  const clampedValue = Math.max(0, Math.min(100, value));

  // Find surrounding color stops
  let lowerStop = colorStops[0];
  let upperStop = colorStops[colorStops.length - 1];

  for (let i = 0; i < colorStops.length - 1; i++) {
    if (clampedValue >= colorStops[i].value && clampedValue <= colorStops[i + 1].value) {
      lowerStop = colorStops[i];
      upperStop = colorStops[i + 1];
      break;
    }
  }

  // Calculate interpolation factor
  const range = upperStop.value - lowerStop.value;
  const factor = range === 0 ? 0 : (clampedValue - lowerStop.value) / range;

  // Interpolate RGB values
  return {
    r: Math.round(lowerStop.r + factor * (upperStop.r - lowerStop.r)),
    g: Math.round(lowerStop.g + factor * (upperStop.g - lowerStop.g)),
    b: Math.round(lowerStop.b + factor * (upperStop.b - lowerStop.b))
  };
}

/**
 * Get smooth gradient color for temperature (-10 to 40°C)
 */
export function getTemperatureColor(value: number): { r: number; g: number; b: number } {
  const colorStops = [
    { value: -10, r: 0, g: 0, b: 255 },      // -10°C: Blue #0000FF
    { value: 0, r: 135, g: 206, b: 235 },    // 0°C: Sky blue #87CEEB
    { value: 10, r: 144, g: 238, b: 144 },   // 10°C: Light green #90EE90
    { value: 20, r: 255, g: 255, b: 0 },     // 20°C: Yellow #FFFF00
    { value: 30, r: 255, g: 140, b: 0 },     // 30°C: Dark orange #FF8C00
    { value: 40, r: 255, g: 69, b: 0 }       // 40°C: Red-orange #FF4500
  ];

  const clampedValue = Math.max(-10, Math.min(40, value));

  let lowerStop = colorStops[0];
  let upperStop = colorStops[colorStops.length - 1];

  for (let i = 0; i < colorStops.length - 1; i++) {
    if (clampedValue >= colorStops[i].value && clampedValue <= colorStops[i + 1].value) {
      lowerStop = colorStops[i];
      upperStop = colorStops[i + 1];
      break;
    }
  }

  const range = upperStop.value - lowerStop.value;
  const factor = range === 0 ? 0 : (clampedValue - lowerStop.value) / range;

  return {
    r: Math.round(lowerStop.r + factor * (upperStop.r - lowerStop.r)),
    g: Math.round(lowerStop.g + factor * (upperStop.g - lowerStop.g)),
    b: Math.round(lowerStop.b + factor * (upperStop.b - lowerStop.b))
  };
}

/**
 * Interpolate between two colors
 */
export function interpolateColorRange(color1: string, color2: string, factor: number): string {
  factor = Math.max(0, Math.min(1, factor)); // Clamp to 0-1
  
  const c1 = parseInt(color1.slice(1), 16);
  const c2 = parseInt(color2.slice(1), 16);
  
  const r1 = (c1 >> 16) & 0xff;
  const g1 = (c1 >> 8) & 0xff;
  const b1 = c1 & 0xff;
  
  const r2 = (c2 >> 16) & 0xff;
  const g2 = (c2 >> 8) & 0xff;
  const b2 = c2 & 0xff;
  
  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));
  
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * Check if point is inside North Kazakhstan Oblast boundary (simplified)
 */
export function isPointInBounds(lat: number, lon: number): boolean {
  // North Kazakhstan Oblast approximate bounds
  return lat >= 51.8 && lat <= 55.2 && lon >= 66.0 && lon <= 72.0;
}

/**
 * Get optimal resolution based on zoom level
 */
export function getOptimalResolution(zoomLevel: number): number {
  if (zoomLevel <= 6) return 8;  // Low zoom - fast rendering
  if (zoomLevel <= 8) return 6;  // Medium zoom - balanced
  if (zoomLevel <= 10) return 4; // High zoom - better quality
  return 3; // Very high zoom - highest quality
}