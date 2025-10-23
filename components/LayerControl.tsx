'use client';

import { LayerType } from '@/types/soilData';

interface LayerControlProps {
  currentLayer: LayerType;
  onChange: (layer: LayerType) => void;
  showBoundary: boolean;
  onBoundaryToggle: (show: boolean) => void;
}

export default function LayerControl({ currentLayer, onChange, showBoundary, onBoundaryToggle }: LayerControlProps) {
  return (
    <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-2 border">
      <div className="flex flex-col gap-2">
        {/* Layer selection */}
        <div className="pb-2 border-b border-gray-200">
          <p className="text-xs text-gray-500 mb-2 text-center">Data Layer</p>
          <button
            onClick={() => onChange('moisture')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors mb-1 w-full ${
              currentLayer === 'moisture'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="text-lg">💧</span>
            <span className="font-medium">Soil Moisture</span>
          </button>
          
          <button
            onClick={() => onChange('temperature')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors w-full ${
              currentLayer === 'temperature'
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="text-lg">🌡️</span>
            <span className="font-medium">Soil Temperature</span>
          </button>
        </div>

        {/* Display options */}
        <div>
          <p className="text-xs text-gray-500 mb-2 text-center">Display Options</p>
          
          <button
            onClick={() => onBoundaryToggle(!showBoundary)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors w-full ${
              showBoundary
                ? 'bg-gray-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className="text-sm">{showBoundary ? '🗺️' : '⬜'}</span>
            <span className="text-sm font-medium">{showBoundary ? 'Hide Border' : 'Show Border'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}