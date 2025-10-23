import { NextRequest, NextResponse } from 'next/server';
import { generatePavlodarGrid } from '@/lib/gridGenerator';
import { fetchAllSoilData, fetchSoilForecast, LayerType } from '@/lib/openMeteoClient';
import { fetchNorthKazakhstanBoundary } from '@/lib/fetchBoundary';
import { cache } from '@/lib/cache';
import { SoilDataApiResponse } from '@/types/soilData';

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
      
      // Load North Kazakhstan Oblast boundary
      const boundary = await fetchNorthKazakhstanBoundary();
      
      // Generate grid points inside North Kazakhstan Oblast
      const gridPoints = generatePavlodarGrid(0.2, boundary);
      console.log(`Generated ${gridPoints.length} grid points for forecast`);
      
      // Fetch forecast for all grid points
      const forecastPromises = gridPoints.map(point => 
        fetchSoilForecast(point, layer, forecastDays)
      );
      
      const forecastData = await Promise.all(forecastPromises);
      
      // Extract data for selected day and prepare response
      const validForecasts = forecastData.filter(f => f !== null);
      const soilData = validForecasts
        .filter(forecast => forecast!.forecast[selectedDay])
        .map(forecast => ({
          lat: forecast!.lat,
          lon: forecast!.lon,
          value: forecast!.forecast[selectedDay].value,
          timestamp: forecast!.forecast[selectedDay].time,
          date: forecast!.forecast[selectedDay].date,
          allDays: forecast!.forecast // Include all days for trend calculation
        }));
      
      // Get available dates from first forecast
      const dates = validForecasts[0]?.forecast.map(f => f.date) || [];
      
      const response = {
        data: soilData,
        layer,
        timestamp: new Date().toISOString(),
        totalPoints: gridPoints.length,
        validPoints: soilData.length,
        forecast: {
          totalDays: forecastDays,
          selectedDay: selectedDay,
          dates: dates
        }
      };
      
      console.log(`Successfully fetched forecast: ${soilData.length} points for day ${selectedDay}`);
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