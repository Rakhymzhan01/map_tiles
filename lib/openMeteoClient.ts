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
  precipitation: number; // Daily precipitation in mm
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
  forecastDays: number = 7,
  maxRetries: number = 2
): Promise<SoilForecastResult | null> {
  const parameter = layer === 'moisture' 
    ? 'soil_moisture_10_to_40cm'
    : 'soil_temperature_10_to_40cm';
  
  // Add precipitation to all requests to show rain predictions
  const baseUrl = 'https://api.open-meteo.com/v1/forecast';
  const params = new URLSearchParams({
    latitude: point.lat.toString(),
    longitude: point.lon.toString(),
    hourly: `${parameter},precipitation`,
    forecast_days: forecastDays.toString(),
    timezone: 'Asia/Almaty'
  });
  
  const url = `${baseUrl}?${params}`;
  
  // Retry logic for rate limiting and failures
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });
      
      // Handle 429 Rate Limit with retry
      if (response.status === 429) {
        if (attempt < maxRetries) {
          const waitTime = (attempt + 1) * 1000; // 1s, 2s exponential backoff
          console.log(`⚠️ Rate limit (429) for ${point.lat.toFixed(1)},${point.lon.toFixed(1)}. Retrying in ${waitTime}ms... (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue; // Try again
        }
        console.error(`❌ Rate limit exceeded for ${point.lat}, ${point.lon} after ${maxRetries} retries`);
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.hourly || !data.hourly[parameter]) {
        throw new Error('Invalid forecast data structure');
      }
      
      const times = data.hourly.time;
      const values = data.hourly[parameter];
      const precipitation = data.hourly.precipitation || [];
      
      // CRITICAL: Log raw API response for first point only
      if (Math.abs(point.lat - 53.2) < 0.1 && Math.abs(point.lon - 68.5) < 0.1) {
        console.log(`\n🔍 RAW API RESPONSE for point (${point.lat}, ${point.lon}):`);
        console.log(`Parameter: ${parameter}`);
        console.log(`Total hours returned: ${times.length}`);
        console.log('First 5 hours:');
        for (let i = 0; i < Math.min(5, times.length); i++) {
          console.log(`  ${times[i]}: ${values[i]} | rain: ${precipitation[i] || 0}mm`);
        }
        console.log('\nEvery 24 hours (daily samples):');
        for (let i = 0; i < Math.min(forecastDays * 24, times.length); i += 24) {
          const dayNum = Math.floor(i/24);
          console.log(`  Day ${dayNum}: ${times[i]} → ${values[i]} (midnight), ${times[i + 12] || 'N/A'} → ${values[i + 12] || 'N/A'} (noon)`);
        }
      }
    
    // Group by day (take noon value for each day as representative)
    const dailyData: ForecastDataPoint[] = [];
    
    for (let day = 0; day < forecastDays; day++) {
      // Calculate index for noon (12:00) of each day
      const noonIndex = day * 24 + 12;
      
      if (noonIndex < values.length && values[noonIndex] !== null) {
        let processedValue = values[noonIndex];
        
        // Handle data format conversion for moisture
        if (parameter.includes('moisture')) {
          if (processedValue >= 0 && processedValue <= 1) {
            processedValue = processedValue * 100; // Convert to percentage
          }
        }
        
        // Calculate total precipitation for the day (sum all 24 hours)
        const dayStart = day * 24;
        const dayEnd = Math.min((day + 1) * 24, precipitation.length);
        const dailyPrecip = precipitation
          .slice(dayStart, dayEnd)
          .reduce((sum, val) => sum + (val || 0), 0);
        
        dailyData.push({
          lat: point.lat,
          lon: point.lon,
          date: times[noonIndex].split('T')[0], // YYYY-MM-DD
          time: times[noonIndex],
          value: processedValue,
          precipitation: dailyPrecip // Total rain for the day in mm
        });
      }
    }
    
    // Log daily extraction for verification on first point
    if (Math.abs(point.lat - 53.2) < 0.1 && Math.abs(point.lon - 68.5) < 0.1) {
      console.log('\n📊 EXTRACTED DAILY DATA:');
      dailyData.forEach(d => {
        const rainStatus = d.precipitation > 0 ? `☔ ${d.precipitation.toFixed(1)}mm` : '☀️ Без осадков';
        console.log(`  Day ${dailyData.indexOf(d)} (${d.date}): ${d.value.toFixed(2)} | ${rainStatus}`);
      });
      
      // Show precipitation pattern
      console.log('\n🌧️ PRECIPITATION PATTERN:');
      const totalRain = dailyData.reduce((sum, d) => sum + d.precipitation, 0);
      console.log(`  Total rain over ${forecastDays} days: ${totalRain.toFixed(1)}mm`);
      const rainyDays = dailyData.filter(d => d.precipitation > 0.1).length;
      console.log(`  Rainy days: ${rainyDays}/${forecastDays}`);
      
      // Explain soil moisture stability
      if (totalRain < 5) {
        console.log(`  💡 LOW RAIN → Soil moisture expected to remain stable`);
      } else {
        console.log(`  💡 SIGNIFICANT RAIN → Soil moisture should increase after rain days`);
      }
    }
    
      return {
        lat: point.lat,
        lon: point.lon,
        forecast: dailyData
      };
      
    } catch (error) {
      if (attempt === maxRetries) {
        if (error.name === 'TimeoutError') {
          console.error(`⏰ Timeout fetching forecast for ${point.lat}, ${point.lon} after ${maxRetries + 1} attempts`);
        } else {
          console.error(`❌ Failed to fetch forecast for ${point.lat}, ${point.lon} after ${maxRetries + 1} attempts:`, error.message);
        }
        return null;
      }
      // Wait before retry (except for 429 which has its own retry logic)
      if (!error.message?.includes('429')) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  return null;
}

/**
 * Fetch forecasts in batches to avoid overwhelming the API
 */
export async function fetchAllSoilForecasts(
  points: GridPoint[],
  layer: LayerType,
  forecastDays: number = 7
): Promise<SoilForecastResult[]> {
  console.log(`Fetching ${forecastDays}-day forecasts for ${points.length} points...`);
  
  const batchSize = 20; // Fetch 20 points at a time
  const results: SoilForecastResult[] = [];
  
  for (let i = 0; i < points.length; i += batchSize) {
    const batch = points.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(points.length / batchSize)}`);
    
    const batchPromises = batch.map(point => fetchSoilForecast(point, layer, forecastDays));
    const batchResults = await Promise.all(batchPromises);
    
    const validResults = batchResults.filter((result): result is SoilForecastResult => result !== null);
    results.push(...validResults);
    
    // Add a small delay between batches to be nice to the API
    if (i + batchSize < points.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log(`Successfully fetched ${results.length}/${points.length} forecast points`);
  return results;
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