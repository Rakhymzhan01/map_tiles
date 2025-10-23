'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LayerType, SoilDataPoint, SoilDataApiResponse } from '@/types/soilData';
import { getMoistureColor as getOldMoistureColor, getTemperatureColor as getOldTemperatureColor } from '@/lib/colorScales';
import { idwInterpolate, getMoistureColor, getTemperatureColor } from '@/lib/idwInterpolation';
import CanvasHeatMap from './CanvasHeatMap';
import PavlodarBoundary from './PavlodarBoundary';
import MapEventHandler from './MapEventHandler';

interface MapProps {
  layer: LayerType;
  showBoundary?: boolean;
  forecastDays?: number;
  selectedDay?: number;
  onDatesUpdate?: (dates: string[]) => void;
  onPrecipitationUpdate?: (precipitation: number[], stats: any) => void;
}

interface DataStats {
  min: number;
  max: number;
  average: number;
  uniqueCount: number;
}

export default function Map({ 
  layer, 
  showBoundary = true, 
  forecastDays = 1, 
  selectedDay = 0,
  onDatesUpdate,
  onPrecipitationUpdate 
}: MapProps) {
  const [data, setData] = useState<SoilDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataStats, setDataStats] = useState<DataStats | null>(null);
  const [cursorInfo, setCursorInfo] = useState<{lat: number, lon: number, value: number | null} | null>(null);
  const [boundary, setBoundary] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build URL with forecast parameters
      const url = forecastDays > 1 || selectedDay > 0 
        ? `/api/soil-data?layer=${layer}&days=${forecastDays}&day=${selectedDay}`
        : `/api/soil-data?layer=${layer}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result.data);
      
      // Update dates if this is a forecast request
      if (result.forecast && onDatesUpdate) {
        onDatesUpdate(result.forecast.dates);
      }
      
      // Update precipitation data if available
      if (result.forecast && onPrecipitationUpdate) {
        onPrecipitationUpdate(
          result.forecast.precipitation || [], 
          result.forecast.precipitationStats || null
        );
      }
      
      // Calculate and set data statistics for debugging
      const values = result.data.map((d: any) => d.value);
      const stats = {
        min: Math.min(...values),
        max: Math.max(...values),
        average: values.reduce((a: number, b: number) => a + b, 0) / values.length,
        uniqueCount: new Set(values).size
      };
      setDataStats(stats);
      
      // Debug: Show sample data values to verify different days have different data
      const sampleData = result.data.slice(0, 3).map((d: any) => ({
        coords: `${d.lat?.toFixed(1)},${d.lon?.toFixed(1)}`,
        value: d.value?.toFixed(1),
        date: d.date || 'current'
      }));
      
      console.log(`📊 ${layer} data loaded (day ${selectedDay}/${forecastDays}):`, stats);
      console.log(`📍 Sample data points:`, sampleData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Load boundary data
  useEffect(() => {
    const loadBoundary = async () => {
      try {
        const response = await fetch('/api/boundary');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        
        if (result.success) {
          setBoundary(result.boundary);
          console.log('🗺️ Boundary loaded:', result.boundary.properties.name);
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error('Failed to load boundary:', error);
      }
    };
    
    loadBoundary();
  }, []);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every hour (but not for forecasts as they don't change that often)
    if (forecastDays <= 1 && selectedDay === 0) {
      const interval = setInterval(fetchData, 3600000);
      return () => clearInterval(interval);
    }
  }, [layer, forecastDays, selectedDay]);

  const getColor = (value: number): string => {
    return layer === 'moisture' ? getOldMoistureColor(value) : getOldTemperatureColor(value);
  };

  const formatValue = (value: number): string => {
    return layer === 'moisture' ? `${value.toFixed(1)}%` : `${value.toFixed(1)}°C`;
  };

  const getLayerName = (): string => {
    return layer === 'moisture' ? 'Soil Moisture' : 'Soil Temperature';
  };

  const calculateTrend = (allDays: any[]): { trend: 'increasing' | 'decreasing' | 'stable', change: number } => {
    if (!allDays || allDays.length < 2) return { trend: 'stable', change: 0 };
    
    const first = allDays[0].value;
    const last = allDays[allDays.length - 1].value;
    const change = last - first;
    
    if (Math.abs(change) < (layer === 'moisture' ? 2 : 1)) return { trend: 'stable', change };
    return { trend: change > 0 ? 'increasing' : 'decreasing', change };
  };

  const getTrendIcon = (trend: 'increasing' | 'decreasing' | 'stable'): string => {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      case 'stable': return '➡️';
    }
  };

  const getTrendText = (trend: 'increasing' | 'decreasing' | 'stable'): string => {
    switch (trend) {
      case 'increasing': return 'Растёт';
      case 'decreasing': return 'Падает';
      case 'stable': return 'Стабильно';
    }
  };

  if (loading) {
    const loadingText = forecastDays > 1 
      ? `Loading ${forecastDays}-day forecast...`
      : `Loading ${getLayerName().toLowerCase()} data...`;
    
    const subText = forecastDays > 1
      ? `Fetching weather data in batches to avoid rate limits (~${Math.ceil(127 / 10) * 1.1} seconds)`
      : "This may take 10-30 seconds for the first load";
    
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">{loadingText}</p>
          <p className="text-sm text-gray-500">{subText}</p>
          {forecastDays > 1 && (
            <div className="mt-2 text-xs text-blue-600">
              Processing {Math.ceil(127 / 10)} batches with delays to respect API limits
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">⚠️ Error</div>
          <p className="text-gray-700">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Debug Stats Panel */}
      {dataStats && (
        <div className="absolute top-20 left-4 z-50 bg-white rounded-lg shadow-lg p-3 border">
          <div className="text-xs font-mono">
            <div className="font-bold text-gray-800 mb-2">🔍 Debug Stats ({layer})</div>
            <div>Min: <span className="font-bold">{dataStats.min.toFixed(2)}</span></div>
            <div>Max: <span className="font-bold">{dataStats.max.toFixed(2)}</span></div>
            <div>Avg: <span className="font-bold">{dataStats.average.toFixed(2)}</span></div>
            <div>Unique: <span className="font-bold">{dataStats.uniqueCount}</span></div>
            <div className={`mt-1 px-2 py-1 rounded text-xs ${
              dataStats.uniqueCount < 5 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }`}>
              {dataStats.uniqueCount < 5 ? '⚠️ Low variability' : '✅ Good variability'}
            </div>
          </div>
        </div>
      )}

      {/* Cursor Value Debug Panel */}
      {cursorInfo && (
        <div className="absolute top-20 right-4 z-50 bg-white rounded-lg shadow-lg p-3 border">
          <div className="text-xs font-mono">
            <div className="font-bold text-gray-800 mb-2">🎯 Cursor Debug</div>
            <div>Lat: <span className="font-bold">{cursorInfo.lat.toFixed(3)}</span></div>
            <div>Lon: <span className="font-bold">{cursorInfo.lon.toFixed(3)}</span></div>
            <div>Value: <span className="font-bold">
              {cursorInfo.value !== null ? `${cursorInfo.value.toFixed(1)}${layer === 'moisture' ? '%' : '°C'}` : 'N/A'}
            </span></div>
            {cursorInfo.value !== null && (
              <div className="mt-1 px-2 py-1 rounded text-xs" style={{
                backgroundColor: layer === 'moisture' ? 
                  `rgb(${getMoistureColor(cursorInfo.value).r}, ${getMoistureColor(cursorInfo.value).g}, ${getMoistureColor(cursorInfo.value).b})` :
                  `rgb(${getTemperatureColor(cursorInfo.value).r}, ${getTemperatureColor(cursorInfo.value).g}, ${getTemperatureColor(cursorInfo.value).b})`,
                color: 'white',
                textShadow: '1px 1px 1px rgba(0,0,0,0.8)'
              }}>
                Expected Color
              </div>
            )}
          </div>
        </div>
      )}

      <MapContainer
        center={[53.5, 69.0]}
        zoom={7}
        minZoom={6}
        maxZoom={10}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Pavlodar Oblast boundary - disabled to remove black dashed line */}
      {/* <PavlodarBoundary showBoundary={showBoundary} /> */}
      
      {/* Canvas heat map layer */}
      {data.length > 0 && (
        <CanvasHeatMap data={data} layer={layer} boundary={boundary} />
      )}

      {/* Mouse event handler for cursor debugging */}
      {data.length > 0 && (
        <MapEventHandler 
          data={data} 
          layer={layer} 
          onCursorUpdate={setCursorInfo}
        />
      )}
      
      {/* Click handler for heat map - invisible large circles for better UX */}
      {data.map((point, index) => (
        <CircleMarker
          key={`click-${point.lat}-${point.lon}-${index}`}
          center={[point.lat, point.lon]}
          radius={20}  // Large invisible area for easier clicking
          fillColor="transparent"
          color="transparent"
          weight={0}
          opacity={0}
          fillOpacity={0}
          interactive={true}
        >
          <Popup>
            <div className="text-center">
              <h3 className="font-bold text-lg">{getLayerName()}</h3>
              <p className="text-2xl font-bold" style={{ color: getColor(point.value) }}>
                {formatValue(point.value)}
              </p>
              
              {/* Show trend if we have forecast data */}
              {(point as any).allDays && (point as any).allDays.length > 1 && (() => {
                const trendInfo = calculateTrend((point as any).allDays);
                return (
                  <div className="mt-2 p-2 bg-gray-50 rounded">
                    <div className="text-sm font-medium">
                      {getTrendIcon(trendInfo.trend)} {getTrendText(trendInfo.trend)}
                    </div>
                    <div className="text-xs text-gray-600">
                      Изменение за {(point as any).allDays.length} дней: {trendInfo.change > 0 ? '+' : ''}{trendInfo.change.toFixed(1)}{layer === 'moisture' ? '%' : '°C'}
                    </div>
                  </div>
                );
              })()}
              
              <p className="text-sm text-gray-600 mt-2">
                Coordinates: {point.lat.toFixed(1)}°N, {point.lon.toFixed(1)}°E
              </p>
              <p className="text-xs text-gray-500">
                {(point as any).date ? `Дата: ${(point as any).date}` : `Updated: ${new Date(point.timestamp).toLocaleString()}`}
              </p>
              
              {/* Show current day info if forecast */}
              {forecastDays > 1 && (
                <p className="text-xs text-blue-600 font-medium">
                  День {selectedDay + 1} из {forecastDays}
                </p>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ))}
      </MapContainer>
    </div>
  );
}