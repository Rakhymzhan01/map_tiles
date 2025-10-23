import { NextRequest, NextResponse } from 'next/server';
import { generatePavlodarGrid } from '@/lib/gridGenerator';
import { fetchAllSoilData, LayerType } from '@/lib/openMeteoClient';
import { cache } from '@/lib/cache';
import { SoilDataApiResponse } from '@/types/soilData';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const layer = searchParams.get('layer') as LayerType;
    
    if (!layer || (layer !== 'moisture' && layer !== 'temperature')) {
      return NextResponse.json(
        { error: 'Invalid layer. Must be "moisture" or "temperature"' },
        { status: 400 }
      );
    }
    
    const cacheKey = `soil-data-${layer}`;
    
    // Check cache first
    const cachedData = cache.get<SoilDataApiResponse>(cacheKey);
    if (cachedData) {
      console.log(`Returning cached data for ${layer}`);
      return NextResponse.json(cachedData);
    }
    
    console.log(`Fetching fresh data for ${layer}...`);
    
    // Generate grid points
    const gridPoints = generatePavlodarGrid();
    console.log(`Generated ${gridPoints.length} grid points`);
    
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