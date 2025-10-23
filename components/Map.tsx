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
}

interface DataStats {
  min: number;
  max: number;
  average: number;
  uniqueCount: number;
}

export default function Map({ layer, showBoundary = true }: MapProps) {
  const [data, setData] = useState<SoilDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataStats, setDataStats] = useState<DataStats | null>(null);
  const [cursorInfo, setCursorInfo] = useState<{lat: number, lon: number, value: number | null} | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/soil-data?layer=${layer}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: SoilDataApiResponse = await response.json();
      setData(result.data);
      
      // Calculate and set data statistics for debugging
      const values = result.data.map(d => d.value);
      const stats = {
        min: Math.min(...values),
        max: Math.max(...values),
        average: values.reduce((a, b) => a + b, 0) / values.length,
        uniqueCount: new Set(values).size
      };
      setDataStats(stats);
      
      console.log(`📊 ${layer} data loaded:`, stats);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every hour
    const interval = setInterval(fetchData, 3600000);
    
    return () => clearInterval(interval);
  }, [layer]);

  const getColor = (value: number): string => {
    return layer === 'moisture' ? getOldMoistureColor(value) : getOldTemperatureColor(value);
  };

  const formatValue = (value: number): string => {
    return layer === 'moisture' ? `${value.toFixed(1)}%` : `${value.toFixed(1)}°C`;
  };

  const getLayerName = (): string => {
    return layer === 'moisture' ? 'Soil Moisture' : 'Soil Temperature';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Loading {getLayerName().toLowerCase()} data...</p>
          <p className="text-sm text-gray-500">This may take 10-30 seconds for the first load</p>
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
      
      {/* Pavlodar Oblast boundary */}
      <PavlodarBoundary showBoundary={showBoundary} />
      
      {/* Canvas heat map layer */}
      {data.length > 0 && (
        <CanvasHeatMap data={data} layer={layer} />
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
              <p className="text-sm text-gray-600">
                Coordinates: {point.lat.toFixed(1)}°N, {point.lon.toFixed(1)}°E
              </p>
              <p className="text-xs text-gray-500">
                Updated: {new Date(point.timestamp).toLocaleString()}
              </p>
            </div>
          </Popup>
        </CircleMarker>
      ))}
      </MapContainer>
    </div>
  );
}