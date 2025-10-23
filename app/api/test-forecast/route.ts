import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const testLat = parseFloat(searchParams.get('lat') || '54.5');
  const testLon = parseFloat(searchParams.get('lon') || '69.2');
  const parameter = searchParams.get('param') || 'soil_moisture_10_to_40cm';
  
  console.log('\n🧪 TESTING FORECAST API');
  console.log(`Testing point: ${testLat}, ${testLon}`);
  console.log(`Parameter: ${parameter}`);
  
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${testLat}&longitude=${testLon}&hourly=${parameter},precipitation&forecast_days=7&timezone=Asia/Almaty`;
    
    console.log(`Fetching: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.hourly || !data.hourly[parameter]) {
      throw new Error('No forecast data available');
    }
    
    const times = data.hourly.time;
    const values = data.hourly[parameter];
    const precipitation = data.hourly.precipitation || [];
    
    // Extract daily values (noon of each day)
    const daily = [];
    for (let day = 0; day < 7; day++) {
      const noonIdx = day * 24 + 12; // Noon of each day
      if (noonIdx < values.length) {
        // Calculate total precipitation for the day
        const dayStart = day * 24;
        const dayEnd = Math.min((day + 1) * 24, precipitation.length);
        const dailyPrecip = precipitation
          .slice(dayStart, dayEnd)
          .reduce((sum, val) => sum + (val || 0), 0);
        
        daily.push({
          day,
          date: times[noonIdx]?.split('T')[0],
          time: times[noonIdx],
          value: values[noonIdx],
          precipitation: dailyPrecip,
          // Also get morning and evening for comparison
          morning: values[day * 24 + 6] || null,
          evening: values[day * 24 + 18] || null
        });
      }
    }
    
    // Check if all values are identical
    const dailyValues = daily.map(d => d.value);
    const uniqueValues = new Set(dailyValues);
    const hasVariation = uniqueValues.size > 1;
    
    // Calculate precipitation statistics
    const precipValues = daily.map(d => d.precipitation);
    const totalRain = precipValues.reduce((sum, p) => sum + p, 0);
    const rainyDays = precipValues.filter(p => p > 0.1).length;
    
    // Calculate statistics
    const stats = {
      totalHours: times.length,
      totalDays: daily.length,
      uniqueNoonValues: uniqueValues.size,
      hasVariation: hasVariation,
      valueRange: {
        min: Math.min(...dailyValues),
        max: Math.max(...dailyValues),
        variation: Math.max(...dailyValues) - Math.min(...dailyValues)
      },
      precipitation: {
        totalRain: totalRain,
        rainyDays: rainyDays,
        avgDaily: totalRain / daily.length,
        values: precipValues
      }
    };
    
    console.log(`📊 Test Results:`);
    console.log(`  Total hours: ${stats.totalHours}`);
    console.log(`  Daily noon values: [${dailyValues.map(v => v?.toFixed(3)).join(', ')}]`);
    console.log(`  Unique values: ${stats.uniqueNoonValues}`);
    console.log(`  Has variation: ${hasVariation ? 'YES' : 'NO'}`);
    console.log(`  Value range: ${stats.valueRange.min.toFixed(3)} - ${stats.valueRange.max.toFixed(3)} (variation: ${stats.valueRange.variation.toFixed(3)})`);
    console.log(`🌧️ Precipitation:`);
    console.log(`  Total rain: ${stats.precipitation.totalRain.toFixed(1)}mm over 7 days`);
    console.log(`  Rainy days: ${stats.precipitation.rainyDays}/7`);
    console.log(`  Daily rain: [${stats.precipitation.values.map(v => v?.toFixed(1)).join(', ')}]mm`);
    
    if (stats.precipitation.totalRain < 5) {
      console.log(`  💡 LOW RAIN → Soil moisture expected to remain stable`);
    } else {
      console.log(`  💡 SIGNIFICANT RAIN → Soil moisture should increase after rain days`);
    }
    
    return NextResponse.json({
      location: { lat: testLat, lon: testLon },
      parameter: parameter,
      stats: stats,
      dailyValues: daily,
      raw: {
        firstDay: {
          times: times.slice(0, 24),
          values: values.slice(0, 24)
        },
        lastDay: {
          times: times.slice(-24),
          values: values.slice(-24)
        }
      }
    });
    
  } catch (error) {
    console.error('Error testing forecast API:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}