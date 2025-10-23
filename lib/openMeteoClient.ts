import { GridPoint } from './gridGenerator';

export interface SoilDataPoint {
  lat: number;
  lon: number;
  value: number;
  timestamp: string;
}

export type LayerType = 'moisture' | 'temperature';

export async function fetchSoilData(
  point: GridPoint,
  layer: LayerType
): Promise<SoilDataPoint | null> {
  try {
    const parameter = layer === 'moisture' 
      ? 'soil_moisture_10_to_40cm'
      : 'soil_temperature_10_to_40cm';
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${point.lat}&longitude=${point.lon}&hourly=${parameter}&forecast_days=1`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Failed to fetch data for ${point.lat}, ${point.lon}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.hourly || !data.hourly[parameter] || data.hourly[parameter].length === 0) {
      console.warn(`No data available for ${point.lat}, ${point.lon}`);
      return null;
    }
    
    // Get the most recent non-null value
    const values = data.hourly[parameter];
    const times = data.hourly.time;
    
    let latestValue = null;
    let latestTime = null;
    
    for (let i = values.length - 1; i >= 0; i--) {
      if (values[i] !== null && values[i] !== undefined) {
        latestValue = values[i];
        latestTime = times[i];
        break;
      }
    }
    
    if (latestValue === null) {
      console.warn(`No valid data found for ${point.lat}, ${point.lon}`);
      return null;
    }
    
    // CRITICAL: Log raw API values and check data format
    if (Math.random() < 0.05) { // Log 5% of requests to avoid spam
      console.log(`🌐 Raw API value for ${point.lat},${point.lon}: ${latestValue} (${parameter})`);
    }
    
    // Handle data format conversion for moisture
    let processedValue = latestValue;
    if (parameter.includes('moisture')) {
      // Open-Meteo returns soil moisture as m³/m³ (volumetric water content)
      // Typical range: 0.0 to 0.5 (0% to 50%)
      
      if (latestValue >= 0 && latestValue <= 1) {
        // Convert m³/m³ to percentage
        processedValue = latestValue * 100;
        
        if (Math.random() < 0.05) {
          console.log(`🔄 Converting moisture: ${latestValue} m³/m³ → ${processedValue}%`);
        }
      } else {
        // Value might already be in percentage or different unit
        console.warn(`⚠️ Unexpected moisture value format: ${latestValue} for ${point.lat},${point.lon}`);
      }
    }
    
    return {
      lat: point.lat,
      lon: point.lon,
      value: processedValue,
      timestamp: latestTime || new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error fetching data for ${point.lat}, ${point.lon}:`, error);
    return null;
  }
}

export interface ForecastDataPoint {
  lat: number;
  lon: number;
  value: number;
  date: string;
  time: string;
}

export interface SoilForecastResult {
  lat: number;
  lon: number;
  forecast: ForecastDataPoint[];
}

/**
 * Fetch soil forecast data for multiple days
 */
export async function fetchSoilForecast(
  point: GridPoint,
  layer: LayerType,
  forecastDays: number = 7
): Promise<SoilForecastResult | null> {
  try {
    const parameter = layer === 'moisture' 
      ? 'soil_moisture_10_to_40cm'
      : 'soil_temperature_10_to_40cm';
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${point.lat}&longitude=${point.lon}&hourly=${parameter}&forecast_days=${forecastDays}&timezone=Asia/Almaty`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`Failed to fetch forecast for ${point.lat}, ${point.lon}: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.hourly || !data.hourly[parameter]) {
      console.warn(`No forecast data available for ${point.lat}, ${point.lon}`);
      return null;
    }
    
    // Group by day (take noon value for each day as representative)
    const dailyData: ForecastDataPoint[] = [];
    const times = data.hourly.time;
    const values = data.hourly[parameter];
    
    for (let i = 0; i < times.length; i += 24) {
      // Take value at 12:00 (noon) for each day
      const noonIndex = i + 12;
      if (noonIndex < values.length && values[noonIndex] !== null) {
        let processedValue = values[noonIndex];
        
        // Handle data format conversion for moisture
        if (parameter.includes('moisture')) {
          if (processedValue >= 0 && processedValue <= 1) {
            processedValue = processedValue * 100; // Convert to percentage
          }
        }
        
        dailyData.push({
          lat: point.lat,
          lon: point.lon,
          date: times[noonIndex].split('T')[0], // YYYY-MM-DD
          time: times[noonIndex],
          value: processedValue
        });
      }
    }
    
    return {
      lat: point.lat,
      lon: point.lon,
      forecast: dailyData
    };
    
  } catch (error) {
    console.error(`Error fetching forecast for ${point.lat}, ${point.lon}:`, error);
    return null;
  }
}

export async function fetchAllSoilData(
  points: GridPoint[],
  layer: LayerType
): Promise<SoilDataPoint[]> {
  console.log(`Fetching ${layer} data for ${points.length} points...`);
  
  const promises = points.map(point => fetchSoilData(point, layer));
  const results = await Promise.all(promises);
  
  const validResults = results.filter((result): result is SoilDataPoint => result !== null);
  
  console.log(`Successfully fetched ${validResults.length}/${points.length} data points`);
  
  return validResults;
}