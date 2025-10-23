import { NextRequest, NextResponse } from 'next/server';
import { generatePavlodarGrid } from '@/lib/gridGenerator';
import { fetchAllSoilData, fetchSoilForecast, LayerType } from '@/lib/openMeteoClient';
import { fetchNorthKazakhstanBoundary } from '@/lib/fetchBoundary';
import { cache } from '@/lib/cache';
import { SoilDataApiResponse } from '@/types/soilData';

// Add delay helper at the top of the file
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const layer = searchParams.get('layer') as LayerType;
    const forecastDays = parseInt(searchParams.get('days') || '1');
    const selectedDay = parseInt(searchParams.get('day') || '0'); // 0 = today
    
    if (!layer || (layer !== 'moisture' && layer !== 'temperature')) {
      return NextResponse.json(
        { error: 'Invalid layer. Must be "moisture" or "temperature"' },
        { status: 400 }
      );
    }
    
    // Check if this is a forecast request (more than 1 day or specific day selected)
    const isForecast = forecastDays > 1 || selectedDay > 0;
    
    if (isForecast) {
      console.log(`📅 Fetching ${forecastDays}-day forecast (showing day ${selectedDay}) for ${layer}`);
      
      // Cache key for forecast data
      const forecastCacheKey = `forecast-${layer}-${forecastDays}d`;
      
      // Check cache for forecast data (cache for 2 hours since forecasts don't change frequently)
      let forecastData = cache.get(forecastCacheKey);
      
      if (!forecastData) {
        // Load North Kazakhstan Oblast boundary
        const boundary = await fetchNorthKazakhstanBoundary();
        
        // Generate grid points inside North Kazakhstan Oblast - keep 0.3° step for full coverage
        const gridPoints = generatePavlodarGrid(0.3, boundary);
        console.log(`📍 Generated ${gridPoints.length} grid points for forecast`);
        
        const parameter = layer === 'moisture' 
          ? 'soil_moisture_10_to_40cm' 
          : 'soil_temperature_10_to_40cm';
        
        // BATCH PROCESSING CONFIGURATION
        const BATCH_SIZE = 10;  // 10 requests per batch
        const DELAY_MS = 1100;  // 1.1 second delay between batches
        
        const allForecastData = [];
        const totalBatches = Math.ceil(gridPoints.length / BATCH_SIZE);
        
        console.log(`🔄 Processing ${totalBatches} batches of ${BATCH_SIZE} points each...`);
        
        // Process in batches
        for (let i = 0; i < gridPoints.length; i += BATCH_SIZE) {
          const batch = gridPoints.slice(i, i + BATCH_SIZE);
          const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
          
          console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} points)`);
          
          // Fetch all points in current batch simultaneously
          const batchPromises = batch.map(point => 
            fetchSoilForecast(point, layer, forecastDays)
          );
          
          const batchResults = await Promise.all(batchPromises);
          allForecastData.push(...batchResults);
          
          // Add delay between batches (except after last batch)
          if (i + BATCH_SIZE < gridPoints.length) {
            console.log(`⏳ Waiting ${DELAY_MS}ms before next batch...`);
            await delay(DELAY_MS);
          }
        }
        
        const successCount = allForecastData.filter(f => f !== null).length;
        console.log(`✅ Successfully fetched ${successCount}/${gridPoints.length} forecast points`);
        
        // Cache the full forecast data
        forecastData = allForecastData;
        cache.set(forecastCacheKey, forecastData, 7200000); // 2 hours in ms
      } else {
        console.log(`📋 Using cached forecast data for ${layer}`);
      }
      
      // Extract data for selected day and prepare response
      const soilData = forecastData
        .filter((forecast: any) => forecast.forecast[selectedDay])
        .map((forecast: any, index: number) => {
          const dayData = forecast.forecast[selectedDay];
          
          // Log first few points to verify correct day selection
          if (index < 3) {
            console.log(`\n🔍 Point ${index} (${forecast.lat.toFixed(1)},${forecast.lon.toFixed(1)}):`);
            console.log(`  Selected day ${selectedDay}: ${dayData?.value?.toFixed(2)} (${dayData?.date})`);
            console.log(`  All days available: ${forecast.forecast.length}`);
            console.log(`  All values: [${forecast.forecast.map((d: any) => d.value?.toFixed(1)).join(', ')}]`);
            
            // Verify if all days have same value (potential bug indicator)
            const allValues = forecast.forecast.map((d: any) => d.value);
            const uniqueValues = new Set(allValues);
            if (uniqueValues.size === 1) {
              console.log(`  ⚠️ WARNING: All ${allValues.length} days have IDENTICAL value: ${allValues[0]}`);
            } else {
              console.log(`  ✅ GOOD: Found ${uniqueValues.size} unique values across ${allValues.length} days`);
            }
          }
          
          return {
            lat: forecast.lat,
            lon: forecast.lon,
            value: dayData?.value || 0,
            timestamp: dayData?.time,
            date: dayData?.date,
            precipitation: dayData?.precipitation || 0, // Add precipitation data
            allDays: forecast.forecast // Include all days for trend calculation
          };
        });
      
      // Get available dates and precipitation data from first forecast
      const dates = forecastData[0]?.forecast.map((f: any) => f.date) || [];
      const precipitationData = forecastData[0]?.forecast.map((f: any) => f.precipitation || 0) || [];
      
      // Calculate precipitation statistics
      const totalRain = precipitationData.reduce((sum: number, p: number) => sum + p, 0);
      const rainyDays = precipitationData.filter((p: number) => p > 0.1).length;
      
      const successCount = forecastData.filter((f: any) => f !== null).length;
      
      const response = {
        data: soilData,
        layer,
        timestamp: new Date().toISOString(),
        totalPoints: forecastData.length,
        validPoints: soilData.length,
        forecast: {
          totalDays: forecastDays,
          selectedDay: selectedDay,
          dates: dates,
          precipitation: precipitationData, // Daily precipitation for all days
          precipitationStats: {
            totalRain: totalRain,
            rainyDays: rainyDays,
            avgDaily: totalRain / forecastDays
          },
          successRate: `${successCount}/${forecastData.length}`,
          coverage: `${Math.round((successCount / forecastData.length) * 100)}%`
        }
      };
      
      // Debug: Log sample values for the selected day to verify different data
      const sampleValues = soilData.slice(0, 5).map(d => ({
        coords: `${d.lat.toFixed(1)},${d.lon.toFixed(1)}`,
        value: d.value.toFixed(1),
        date: d.date
      }));
      
      console.log(`📊 Day ${selectedDay} sample values:`, sampleValues);
      console.log(`✅ Successfully prepared forecast: ${soilData.length} points for day ${selectedDay}`);
      console.log(`📈 Success rate: ${successCount}/${forecastData.length} (${Math.round((successCount / forecastData.length) * 100)}%)`);
      return NextResponse.json(response);
    }
    
    // Original single-day logic (for backward compatibility)
    const cacheKey = `soil-data-${layer}`;
    
    // Check cache first
    const cachedData = cache.get<SoilDataApiResponse>(cacheKey);
    if (cachedData) {
      console.log(`Returning cached data for ${layer}`);
      return NextResponse.json(cachedData);
    }
    
    console.log(`Fetching fresh data for ${layer}...`);
    
    // Load North Kazakhstan Oblast boundary
    const boundary = await fetchNorthKazakhstanBoundary();
    
    // Generate grid points inside North Kazakhstan Oblast with higher density
    const gridPoints = generatePavlodarGrid(0.2, boundary);
    console.log(`Generated ${gridPoints.length} grid points for North Kazakhstan Oblast`);
    
    // Fetch data from Open-Meteo API
    const soilData = await fetchAllSoilData(gridPoints, layer);
    
    // CRITICAL: Log actual data statistics for debugging
    const values = soilData.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const avgValue = values.reduce((a, b) => a + b, 0) / values.length;
    const uniqueValues = new Set(values);
    
    console.log(`\n🔍 DEBUGGING ${layer.toUpperCase()} DATA:`);
    console.log(`📊 Total points: ${soilData.length}`);
    console.log(`📊 Min value: ${minValue}`);
    console.log(`📊 Max value: ${maxValue}`);
    console.log(`📊 Average: ${avgValue.toFixed(3)}`);
    console.log(`📊 Unique values: ${uniqueValues.size}`);
    console.log(`📊 Sample values (first 10):`, values.slice(0, 10));
    
    // Check for data quality issues
    if (uniqueValues.size === 1) {
      console.error('⚠️ WARNING: All data points have the SAME value!');
    }
    if (uniqueValues.size < 5) {
      console.warn('⚠️ WARNING: Very low data variability!');
    }
    
    const response: SoilDataApiResponse = {
      data: soilData,
      layer,
      timestamp: new Date().toISOString(),
      totalPoints: gridPoints.length,
      validPoints: soilData.length
    };
    
    // Cache the response for 1 hour
    cache.set(cacheKey, response);
    
    console.log(`Successfully fetched and cached ${soilData.length} data points for ${layer}`);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error in soil-data API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}