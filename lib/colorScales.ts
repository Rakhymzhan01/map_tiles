export function getMoistureColor(value: number): string {
  if (value < 10) return '#8B4513'; // Dark brown - Very dry
  if (value < 20) return '#D2691E'; // Brown - Dry
  if (value < 30) return '#F4A460'; // Sandy - Normal
  if (value < 40) return '#90EE90'; // Light green - Moist
  return '#4169E1'; // Blue - Very moist
}

export function getTemperatureColor(value: number): string {
  if (value < 0) return '#0000FF';   // Blue - Freezing
  if (value < 10) return '#87CEEB';  // Light blue - Cold
  if (value < 20) return '#90EE90';  // Green - Cool
  if (value < 30) return '#FFD700';  // Yellow - Warm
  return '#FF4500'; // Red - Hot
}

export function getMoistureColorScale(): Array<{color: string, label: string, range: string}> {
  return [
    { color: '#8B4513', label: 'Very Dry', range: '< 10%' },
    { color: '#FFFF00', label: 'Dry', range: '10-20%' },
    { color: '#00FF00', label: 'Normal', range: '20-30%' },
    { color: '#87CEEB', label: 'Moist', range: '30-40%' },
    { color: '#4169E1', label: 'Very Moist', range: '> 40%' }
  ];
}

export function getTemperatureColorScale(): Array<{color: string, label: string, range: string}> {
  return [
    { color: '#0000FF', label: 'Freezing', range: '< 0°C' },
    { color: '#87CEEB', label: 'Cold', range: '0-10°C' },
    { color: '#90EE90', label: 'Cool', range: '10-20°C' },
    { color: '#FFD700', label: 'Warm', range: '20-30°C' },
    { color: '#FF4500', label: 'Hot', range: '> 30°C' }
  ];
}