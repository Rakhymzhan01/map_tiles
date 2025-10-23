# Pavlodar Soil Data Visualization

Interactive map showing real-time soil moisture and temperature data for Pavlodar region, Kazakhstan.

## Features

- 🗺️ Interactive Leaflet map centered on Pavlodar region
- 💧 Soil moisture layer (0-100% volumetric water content)
- 🌡️ Soil temperature layer (-10°C to 40°C)
- 🎯 ~100 data points on a 0.5° grid (~50km spacing)
- 🔄 Auto-refresh every hour with caching
- 📊 Color-coded visualization with legend
- 📱 Responsive design

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- Leaflet.js + react-leaflet
- Tailwind CSS
- Open-Meteo API (free, no API key needed)

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Data Source

Data is fetched from the Open-Meteo API:
- **Endpoint:** `https://api.open-meteo.com/v1/forecast`
- **Parameters:** 
  - `soil_moisture_10_to_40cm` (0-100%)
  - `soil_temperature_10_to_40cm` (-10°C to 40°C)
- **Depth:** 10-40cm below surface
- **Update frequency:** Hourly
- **Cache duration:** 1 hour

## Project Structure

```
├── app/
│   ├── api/soil-data/route.ts    # API endpoint with caching
│   ├── page.tsx                  # Main page
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── components/
│   ├── Map.tsx                   # Leaflet map component
│   ├── LayerControl.tsx          # Layer switcher
│   └── Legend.tsx                # Color scale legend
├── lib/
│   ├── gridGenerator.ts          # Generate coordinate grid
│   ├── openMeteoClient.ts        # API client
│   ├── colorScales.ts            # Color functions
│   └── cache.ts                  # Caching system
└── types/
    └── soilData.ts               # TypeScript interfaces
```

## Performance

- **First load:** 10-30 seconds (fetches ~100 API calls)
- **Subsequent loads:** <1 second (cached)
- **Cache duration:** 1 hour
- **API rate limit:** 10,000 requests/day

## Color Scales

### Soil Moisture (0-100%)
- < 10%: Dark brown (Very dry)
- 10-20%: Brown (Dry)
- 20-30%: Sandy (Normal)
- 30-40%: Light green (Moist)
- > 40%: Blue (Very moist)

### Soil Temperature (-10°C to 40°C)
- < 0°C: Blue (Freezing)
- 0-10°C: Light blue (Cold)
- 10-20°C: Green (Cool)
- 20-30°C: Yellow (Warm)
- > 30°C: Red (Hot)

## Deployment

Build the application:
```bash
npm run build
npm start
```

The app is ready for deployment on any platform that supports Next.js.