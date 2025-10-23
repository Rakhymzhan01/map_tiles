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
    { color: '#5C3317', label: 'Очень сухо', range: '0-5%' },
    { color: '#8B4513', label: 'Сухо', range: '6-10%' },
    { color: '#D2691E', label: 'Сухо', range: '11-15%' },
    { color: '#FF8C00', label: 'Немного сухо', range: '16-20%' },
    { color: '#FFD700', label: 'Нормально', range: '21-25%' },
    { color: '#9ACD32', label: 'Нормально', range: '26-30%' },
    { color: '#32CD32', label: 'Влажно', range: '31-35%' },
    { color: '#00CC66', label: 'Влажно', range: '36-40%' },
    { color: '#00CED1', label: 'Очень влажно', range: '41-45%' },
    { color: '#4169E1', label: 'Очень влажно', range: '46-50%' },
    { color: '#0000FF', label: 'Насыщено', range: '50%+' }
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