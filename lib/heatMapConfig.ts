import { LayerType } from '@/types/soilData';

export interface HeatMapGradient {
  [key: number]: string;
}

export interface HeatMapOptions {
  radius: number;
  blur: number;
  maxZoom: number;
  max: number;
  minOpacity?: number;
  maxOpacity?: number;
  scaleRadius?: boolean;
  useLocalExtrema?: boolean;
  gradient: HeatMapGradient;
}

// Normalize values to 0-1 range for heat map
export function normalizeValue(value: number, layer: LayerType): number {
  let normalized: number;
  
  if (layer === 'moisture') {
    // DYNAMIC: Use the actual data range instead of hardcoded values
    // This will be updated based on real data from the new region
    const actualMin = 5;   // Expanded minimum for North Kazakhstan
    const actualMax = 30;  // Expanded maximum for North Kazakhstan
    
    const clamped = Math.max(actualMin, Math.min(actualMax, value));
    normalized = (clamped - actualMin) / (actualMax - actualMin);
  } else {
    // Temperature: -10°C = 0.0, 40°C = 1.0 (range: 50 degrees)
    const clamped = Math.max(-10, Math.min(40, value));
    normalized = (clamped + 10) / 50;
  }
  
  // Debug logging to verify normalization
  if (Math.random() < 0.1) { // Log 10% of values to avoid spam
    console.log(`${layer} normalization: ${value} → ${normalized.toFixed(3)}`);
  }
  
  return normalized;
}

// Get heat map gradient for moisture layer - CORRECTED MAPPING
export function getMoistureGradient(): HeatMapGradient {
  return {
    // 0.0 = 0% moisture (Very Dry) - BROWN colors
    0.0: '#8B4513',   // 0% - Dark brown (Very Dry)
    0.1: '#A0522D',   // 10% - Sienna
    0.2: '#D2691E',   // 20% - Chocolate (Dry)
    0.3: '#F4A460',   // 30% - Sandy brown (Normal)
    0.4: '#FFD700',   // 40% - Gold (transition)
    0.5: '#90EE90',   // 50% - Light green (Moist)
    0.6: '#00FF00',   // 60% - Green (Very Moist)
    0.7: '#00CED1',   // 70% - Dark turquoise
    0.8: '#4169E1',   // 80% - Royal blue
    // 1.0 = 100% moisture (Extremely Moist) - BLUE colors  
    1.0: '#0000FF'    // 100% - Pure blue (Extremely Moist)
  };
}

// Get heat map gradient for temperature layer - CORRECTED MAPPING
export function getTemperatureGradient(): HeatMapGradient {
  return {
    // 0.0 = -10°C (Freezing) - BLUE colors
    0.0: '#0000FF',   // -10°C - Pure blue (Freezing)
    0.1: '#4169E1',   // -5°C - Royal blue
    0.2: '#1E90FF',   // 0°C - Dodger blue (Cold)
    0.3: '#00CED1',   // 5°C - Dark turquoise
    0.4: '#00FF00',   // 10°C - Green (Cool)
    0.5: '#90EE90',   // 15°C - Light green
    0.6: '#FFFF00',   // 20°C - Yellow (Warm)
    0.7: '#FFD700',   // 25°C - Gold
    0.8: '#FF8C00',   // 30°C - Dark orange (Hot)
    0.9: '#FF4500',   // 35°C - Orange red
    // 1.0 = 40°C (Very Hot) - RED colors
    1.0: '#FF0000'    // 40°C - Pure red (Very Hot)
  };
}

// Get heat map options for specific layer - OPTIMIZED FOR SMOOTH COVERAGE
export function getHeatMapOptions(layer: LayerType): HeatMapOptions {
  const baseOptions: Omit<HeatMapOptions, 'gradient'> = {
    radius: 80,           // INCREASED: Larger radius for smoother coverage
    blur: 50,             // INCREASED: More blur for seamless transitions
    maxZoom: 10,
    max: 1.0,
    minOpacity: 0.4,      // Semi-transparent to show city names
    maxOpacity: 0.7,      // Slightly increased for better visibility
    scaleRadius: true,    // Scale radius with zoom for stability
    useLocalExtrema: false, // Use global min/max, not local
  };

  return {
    ...baseOptions,
    gradient: layer === 'moisture' ? getMoistureGradient() : getTemperatureGradient()
  };
}

// Convert soil data to heat map format with ADAPTIVE normalization
export function convertToHeatData(
  data: Array<{ lat: number; lon: number; value: number }>,
  layer: LayerType
): Array<[number, number, number]> {
  console.log(`Converting ${data.length} points for ${layer} layer`);
  
  // Get actual data range from current dataset
  const values = data.map(d => d.value);
  const dataMin = Math.min(...values);
  const dataMax = Math.max(...values);
  
  console.log(`📊 ACTUAL DATA RANGE: ${dataMin.toFixed(2)} - ${dataMax.toFixed(2)}`);
  
  // Sample some points for debugging
  const samplePoints = data.slice(0, 5);
  console.log('Sample data points:');
  samplePoints.forEach(point => {
    // Use adaptive normalization based on actual data range
    const adaptiveNormalized = (point.value - dataMin) / (dataMax - dataMin);
    console.log(`  ${layer}: ${point.value} → ${adaptiveNormalized.toFixed(3)} (adaptive) (lat: ${point.lat}, lon: ${point.lon})`);
  });
  
  const heatData: Array<[number, number, number]> = data.map(point => {
    // Validate data
    if (point.value === null || point.value === undefined || isNaN(point.value)) {
      console.warn(`Invalid value for point ${point.lat},${point.lon}:`, point.value);
      return [point.lat, point.lon, 0] as [number, number, number]; // Default to 0 for invalid data
    }
    
    // ADAPTIVE NORMALIZATION: Use actual data range instead of fixed range
    const adaptiveNormalized = dataMax > dataMin 
      ? (point.value - dataMin) / (dataMax - dataMin)
      : 0.5; // Default to middle if no variation
    
    // Clamp to 0-1 range
    const clamped = Math.max(0, Math.min(1, adaptiveNormalized));
    
    return [point.lat, point.lon, clamped] as [number, number, number];
  });
  
  // Log normalized range for debugging
  const normalizedValues = heatData.map(([,, value]) => value);
  const minNorm = Math.min(...normalizedValues);
  const maxNorm = Math.max(...normalizedValues);
  console.log(`${layer} normalized range: ${minNorm.toFixed(3)} - ${maxNorm.toFixed(3)}`);
  
  return heatData;
}