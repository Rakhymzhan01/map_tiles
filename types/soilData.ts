export interface SoilDataPoint {
  lat: number;
  lon: number;
  value: number;
  timestamp: string;
}

export interface GridPoint {
  lat: number;
  lon: number;
}

export type LayerType = 'moisture' | 'temperature';

export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  hourly: {
    time: string[];
    soil_moisture_10_to_40cm?: number[];
    soil_temperature_10_to_40cm?: number[];
  };
}

export interface ColorScaleItem {
  color: string;
  label: string;
  range: string;
}

export interface SoilDataApiResponse {
  data: SoilDataPoint[];
  layer: LayerType;
  timestamp: string;
  totalPoints: number;
  validPoints: number;
}