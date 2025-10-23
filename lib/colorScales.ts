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
    // Freezing range (high contrast blues/purples)
    { color: '#191970', label: 'Мороз', range: '< -7°C' },
    { color: '#00008B', label: 'Очень холодно', range: '-7 до -4°C' },
    { color: '#0000CD', label: 'Холодно', range: '-4 до -1°C' },
    { color: '#0000FF', label: 'Холодно', range: '-1 до 2°C' },
    
    // Cold range (blues to cyan)
    { color: '#1E90FF', label: 'Прохладно', range: '3-5°C' },
    { color: '#00BFFF', label: 'Прохладно', range: '6-8°C' },
    { color: '#00FFFF', label: 'Прохладно', range: '9-11°C' },
    
    // Cool range (cyan to green)
    { color: '#40E0D0', label: 'Умеренно', range: '12-14°C' },
    { color: '#00FF7F', label: 'Комфортно', range: '15-17°C' },
    { color: '#32CD32', label: 'Комфортно', range: '18-20°C' },
    
    // Moderate range (greens to yellow-green)
    { color: '#7FFF00', label: 'Тепло', range: '21-23°C' },
    { color: '#9ACD32', label: 'Тепло', range: '24-26°C' },
    { color: '#ADFF2F', label: 'Тепло', range: '27-29°C' },
    
    // Warm range (yellows)
    { color: '#FFFF00', label: 'Жарко', range: '30-32°C' },
    { color: '#FFD700', label: 'Жарко', range: '33-35°C' },
    
    // Hot range (oranges)
    { color: '#FFA500', label: 'Очень жарко', range: '36-38°C' },
    { color: '#FF8C00', label: 'Очень жарко', range: '39-41°C' },
    
    // Very hot range (reds)
    { color: '#FF4500', label: 'Экстремально', range: '42-44°C' },
    { color: '#FF0000', label: 'Экстремально', range: '45-47°C' },
    { color: '#B22222', label: 'Опасно', range: '> 47°C' }
  ];
}