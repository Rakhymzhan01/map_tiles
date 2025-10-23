'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { LayerType, SoilDataPoint } from '@/types/soilData';
import { 
  idwInterpolate, 
  getMoistureColor,
  getTemperatureColor,
  isPointInBounds,
  getOptimalResolution 
} from '@/lib/idwInterpolation';

interface CanvasHeatMapProps {
  data: SoilDataPoint[];
  layer: LayerType;
}

export default function CanvasHeatMap({ data, layer }: CanvasHeatMapProps) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<L.ImageOverlay | null>(null);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const renderHeatMap = () => {
    if (!map || data.length === 0) return;

    // Clear any pending render
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    // Debounce rendering to avoid too frequent updates
    renderTimeoutRef.current = setTimeout(() => {
      performRender();
    }, 100);
  };

  const performRender = () => {
    if (!map || data.length === 0) return;

    const bounds = map.getBounds();
    const zoom = map.getZoom();
    const resolution = getOptimalResolution(zoom);

    // Get map container size
    const size = map.getSize();
    const canvas = document.createElement('canvas');
    canvas.width = size.x;
    canvas.height = size.y;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Get data range for debug logging
    const values = data.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    console.log(`🎨 Rendering Canvas Heat Map - ${layer}: ${minValue.toFixed(2)} - ${maxValue.toFixed(2)}`);

    // Create ImageData for pixel manipulation
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const pixels = imageData.data;

    // Debug counter for logging
    let debugCounter = 0;

    // Render heat map pixel by pixel
    for (let x = 0; x < canvas.width; x += resolution) {
      for (let y = 0; y < canvas.height; y += resolution) {
        // Convert pixel coordinates to geographic coordinates
        const point = map.containerPointToLatLng([x, y]);
        const lat = point.lat;
        const lon = point.lng;

        // Skip points outside North Kazakhstan Oblast
        if (!isPointInBounds(lat, lon)) {
          continue;
        }

        // Calculate interpolated value using IDW
        const interpolatedValue = idwInterpolate(lat, lon, data, 2, 1.5);
        
        if (interpolatedValue === null) continue;

        // Get RGB color based on layer type - using raw values, not normalized
        const rgb = layer === 'moisture' 
          ? getMoistureColor(interpolatedValue)
          : getTemperatureColor(interpolatedValue);

        // Debug logging for color verification (sample some points)
        if (debugCounter % 1000 === 0) {
          console.log(`🎨 Color debug: ${layer} value=${interpolatedValue.toFixed(1)} → rgb(${rgb.r},${rgb.g},${rgb.b})`);
        }
        debugCounter++;

        const r = rgb.r;
        const g = rgb.g;
        const b = rgb.b;
        
        // Calculate opacity based on distance to nearest data point
        const nearestDistance = Math.min(...data.map(d => 
          Math.sqrt(Math.pow(lat - d.lat, 2) + Math.pow(lon - d.lon, 2))
        ));
        const opacity = Math.max(0.3, Math.min(0.8, 1 - nearestDistance * 2));

        // Fill block of pixels for performance
        for (let dx = 0; dx < resolution && x + dx < canvas.width; dx++) {
          for (let dy = 0; dy < resolution && y + dy < canvas.height; dy++) {
            const pixelIndex = ((y + dy) * canvas.width + (x + dx)) * 4;
            pixels[pixelIndex] = r;     // Red
            pixels[pixelIndex + 1] = g; // Green
            pixels[pixelIndex + 2] = b; // Blue
            pixels[pixelIndex + 3] = Math.round(opacity * 255); // Alpha
          }
        }
      }
    }

    // Apply the pixel data to canvas
    ctx.putImageData(imageData, 0, 0);

    // Apply gaussian blur for smoother appearance
    ctx.filter = 'blur(2px)';
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(canvas, 0, 0);

    // Convert canvas to data URL
    const dataURL = canvas.toDataURL();

    // Remove existing overlay
    if (overlayRef.current) {
      map.removeLayer(overlayRef.current);
    }

    // Create new image overlay
    const imageOverlay = L.imageOverlay(dataURL, bounds, {
      opacity: 0.7,
      interactive: false,
      pane: 'overlayPane'
    });

    // Add to map
    imageOverlay.addTo(map);
    overlayRef.current = imageOverlay;

    console.log(`✅ Canvas heat map rendered (${canvas.width}x${canvas.height}, resolution: ${resolution})`);
  };

  // Handle map events
  useEffect(() => {
    if (!map) return;

    const handleMapChange = () => {
      renderHeatMap();
    };

    // Render initial heat map
    renderHeatMap();

    // Listen for map changes
    map.on('zoomend', handleMapChange);
    map.on('moveend', handleMapChange);
    map.on('resize', handleMapChange);

    return () => {
      // Cleanup
      map.off('zoomend', handleMapChange);
      map.off('moveend', handleMapChange);
      map.off('resize', handleMapChange);
      
      if (overlayRef.current) {
        map.removeLayer(overlayRef.current);
      }
      
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [map, data, layer]);

  // Re-render when data or layer changes
  useEffect(() => {
    renderHeatMap();
  }, [data, layer]);

  return null; // This component doesn't render DOM elements directly
}