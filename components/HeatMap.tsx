'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import { SoilDataPoint, LayerType } from '@/types/soilData';
import { convertToHeatData, getHeatMapOptions } from '@/lib/heatMapConfig';

interface HeatMapProps {
  data: SoilDataPoint[];
  layer: LayerType;
}

// Extend Leaflet types for heatLayer
declare module 'leaflet' {
  function heatLayer(
    latlngs: Array<[number, number, number]>,
    options?: any
  ): L.Layer;
}

export default function HeatMap({ data, layer }: HeatMapProps) {
  const map = useMap();
  const heatLayerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    if (!map || data.length === 0) return;

    // Remove existing heat layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    // Convert data to heat map format with debugging
    const heatData = convertToHeatData(data, layer);
    
    // Get heat map options for current layer
    const options = getHeatMapOptions(layer);

    console.log(`Creating heat layer with ${heatData.length} points`);
    console.log('Heat layer options:', options);

    // Create heat layer with enhanced options for zoom stability
    const heatLayer = L.heatLayer(heatData, options);
    
    // Add to map
    heatLayer.addTo(map);
    heatLayerRef.current = heatLayer;

    // Add zoom event handlers for better stability
    const handleZoomEnd = () => {
      if (heatLayerRef.current && 'redraw' in heatLayerRef.current) {
        console.log('Redrawing heat layer after zoom');
        (heatLayerRef.current as any).redraw();
      }
    };

    const handleMoveEnd = () => {
      if (heatLayerRef.current && 'redraw' in heatLayerRef.current) {
        (heatLayerRef.current as any).redraw();
      }
    };

    // Attach event listeners
    map.on('zoomend', handleZoomEnd);
    map.on('moveend', handleMoveEnd);

    // Cleanup function
    return () => {
      // Remove event listeners
      map.off('zoomend', handleZoomEnd);
      map.off('moveend', handleMoveEnd);
      
      // Remove heat layer
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [map, data, layer]);

  return null;
}