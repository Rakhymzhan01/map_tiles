'use client';

import { GeoJSON } from 'react-leaflet';
import { pavlodarBoundary } from '@/lib/pavlodarBoundary';

interface PavlodarBoundaryProps {
  showBoundary?: boolean;
}

export default function PavlodarBoundary({ showBoundary = true }: PavlodarBoundaryProps) {
  if (!showBoundary) return null;

  const boundaryStyle = {
    fillOpacity: 0,      // Transparent fill
    weight: 2,           // Border width
    color: '#333333',    // Dark gray border
    dashArray: '8, 4',   // Dashed line pattern
    opacity: 0.7,        // Border opacity
  };

  return (
    <GeoJSON
      data={pavlodarBoundary}
      style={boundaryStyle}
      interactive={false}
    />
  );
}