'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import LayerControl from '@/components/LayerControl';
import Legend from '@/components/Legend';
import TimeSlider from '@/components/TimeSlider';
import { LayerType } from '@/types/soilData';

// Dynamically import Map component to avoid SSR issues with Leaflet
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-lg text-gray-600">Loading map...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const [currentLayer, setCurrentLayer] = useState<LayerType>('moisture');
  const [showBoundary, setShowBoundary] = useState(true);
  const [currentDay, setCurrentDay] = useState(0);
  const [forecastDays, setForecastDays] = useState(7);
  const [dates, setDates] = useState<string[]>([]);
  const [precipitationData, setPrecipitationData] = useState<number[]>([]);
  const [precipitationStats, setPrecipitationStats] = useState<any>(null);
  const [mapKey, setMapKey] = useState(0); // Force map re-render when forecast changes

  // Reset to day 0 when changing forecast length or layer
  useEffect(() => {
    setCurrentDay(0);
    setMapKey(prev => prev + 1); // Force map refresh
  }, [forecastDays, currentLayer]);

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* Header */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white rounded-lg shadow-lg px-6 py-3 border">
        <h1 className="text-xl font-bold text-gray-800 text-center">
          🇰🇿 North Kazakhstan Oblast Soil Forecast
        </h1>
        <p className="text-sm text-gray-600 text-center">
          Real-time data + {forecastDays}-day forecast • IDW interpolation
        </p>
      </div>

      {/* Forecast Days Selector */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg px-4 py-2 border">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Прогноз на:
        </label>
        <select 
          value={forecastDays}
          onChange={(e) => {
            setForecastDays(parseInt(e.target.value));
          }}
          className="block w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={3}>3 дня</option>
          <option value={7}>7 дней</option>
          <option value={14}>14 дней</option>
          <option value={16}>16 дней</option>
        </select>
      </div>

      {/* Map */}
      <Map 
        key={mapKey}
        layer={currentLayer} 
        showBoundary={showBoundary}
        forecastDays={forecastDays}
        selectedDay={currentDay}
        onDatesUpdate={setDates}
        onPrecipitationUpdate={(precipitation, stats) => {
          setPrecipitationData(precipitation);
          setPrecipitationStats(stats);
        }}
      />

      {/* Layer Control */}
      <LayerControl
        currentLayer={currentLayer}
        onChange={setCurrentLayer}
        showBoundary={showBoundary}
        onBoundaryToggle={setShowBoundary}
      />

      {/* Legend */}
      <Legend layer={currentLayer} />

      {/* Time Slider - only show if we have forecast dates */}
      {dates.length > 1 && (
        <TimeSlider
          dates={dates}
          currentDay={currentDay}
          onChange={setCurrentDay}
          onPlayPause={() => {}} // Dummy function since we don't use it
          isPlaying={false}
          precipitationData={precipitationData}
          precipitationStats={precipitationStats}
        />
      )}

      {/* Weather Explanation Panel - only show for moisture layer */}
      {currentLayer === 'moisture' && precipitationStats && (
        <div className="absolute top-100 right-4 z-10 bg-white rounded-lg shadow-lg px-4 py-3 border max-w-64">
          <div className="text-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🌧️</span>
              <strong className="text-gray-800">Прогноз осадков</strong>
            </div>
            
            <div className="space-y-1 text-xs text-gray-600">
              <p>Всего дождя: <strong>{precipitationStats.totalRain.toFixed(1)} мм</strong></p>
              <p>Дождливых дней: <strong>{precipitationStats.rainyDays}/{forecastDays}</strong></p>
              
              {precipitationStats.totalRain < 5 ? (
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                  <p className="text-blue-700">
                    <strong>ℹ️ Стабильный прогноз</strong><br/>
                    Влажность почвы изменяется медленно при малом количестве осадков.
                  </p>
                </div>
              ) : (
                <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                  <p className="text-green-700">
                    <strong>🌱 Рост влажности</strong><br/>
                    Ожидается увеличение влажности после дождей.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="absolute bottom-4 right-4 z-10 bg-white rounded-lg shadow-lg px-4 py-2 border">
        <div className="text-xs text-gray-600 text-center">
          <p>🎨 Canvas IDW Heat Map (smooth gradients)</p>
          <p>📅 Day {currentDay + 1}/{dates.length || 1} • {dates.length > 1 ? 'Forecast' : 'Current'}</p>
          <p>🎯 Adaptive normalization • Dynamic resolution</p>
          <p>Data: Hourly • Depth: 10-40cm • Open-Meteo API</p>
          <p>🖱️ Click anywhere for details</p>
          {showBoundary && <p>🗺️ Oblast boundary shown</p>}
        </div>
      </div>
    </main>
  );
}