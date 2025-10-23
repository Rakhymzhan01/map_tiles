'use client';

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { LayerType, SoilDataPoint } from '@/types/soilData';
import { idwInterpolate } from '@/lib/idwInterpolation';

interface MapEventHandlerProps {
  data: SoilDataPoint[];
  layer: LayerType;
  onCursorUpdate: (info: {lat: number, lon: number, value: number | null} | null) => void;
}

export default function MapEventHandler({ data, layer, onCursorUpdate }: MapEventHandlerProps) {
  const map = useMap();

  useEffect(() => {
    if (!map || data.length === 0) return;

    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lon = e.latlng.lng;
      
      // Calculate interpolated value at cursor position
      const value = idwInterpolate(lat, lon, data, 2, 1.5);
      
      onCursorUpdate({ lat, lon, value });
    };

    const handleMouseOut = () => {
      onCursorUpdate(null);
    };

    // Add event listeners
    map.on('mousemove', handleMouseMove);
    map.on('mouseout', handleMouseOut);

    return () => {
      // Cleanup
      map.off('mousemove', handleMouseMove);
      map.off('mouseout', handleMouseOut);
    };
  }, [map, data, layer, onCursorUpdate]);

  return null; // This component doesn't render anything
}