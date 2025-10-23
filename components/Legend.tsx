'use client';

import { LayerType } from '@/types/soilData';
import { getMoistureColorScale, getTemperatureColorScale } from '@/lib/colorScales';

interface LegendProps {
  layer: LayerType;
}

export default function Legend({ layer }: LegendProps) {
  const colorScale = layer === 'moisture' ? getMoistureColorScale() : getTemperatureColorScale();
  const title = layer === 'moisture' ? 'Soil Moisture' : 'Soil Temperature';
  const icon = layer === 'moisture' ? '💧' : '🌡️';

  return (
    <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg p-4 border min-w-48">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{icon}</span>
        <h3 className="font-bold text-gray-800">{title}</h3>
      </div>
      
      <div className="space-y-2">
        {colorScale.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div
              className="w-6 h-4 rounded border border-gray-300"
              style={{ backgroundColor: item.color }}
            ></div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-700">{item.label}</div>
              <div className="text-xs text-gray-500">{item.range}</div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-3 pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Data from Open-Meteo API
        </p>
      </div>
    </div>
  );
}