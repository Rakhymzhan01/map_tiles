'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import LayerControl from '@/components/LayerControl';
import Legend from '@/components/Legend';
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

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* Header */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white rounded-lg shadow-lg px-6 py-3 border">
        <h1 className="text-xl font-bold text-gray-800 text-center">
          🇰🇿 North Kazakhstan Oblast Soil Data
        </h1>
        <p className="text-sm text-gray-600 text-center">
          Canvas IDW interpolation • Smooth continuous gradients
        </p>
      </div>

      {/* Map */}
      <Map 
        layer={currentLayer} 
        showBoundary={showBoundary}
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

      {/* Footer Info */}
      <div className="absolute bottom-4 right-4 z-10 bg-white rounded-lg shadow-lg px-4 py-2 border">
        <div className="text-xs text-gray-600 text-center">
          <p>🎨 Canvas IDW Heat Map (smooth gradients)</p>
          <p>🏙️ City names visible underneath</p>
          <p>🎯 Adaptive normalization • Dynamic resolution</p>
          <p>Data: Hourly • Depth: 10-40cm</p>
          <p>🖱️ Click anywhere for details</p>
          {showBoundary && <p>🗺️ Oblast boundary shown</p>}
        </div>
      </div>
    </main>
  );
}