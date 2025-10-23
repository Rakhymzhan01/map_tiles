import fs from 'fs';
import path from 'path';

/**
 * Get North Kazakhstan Oblast boundary from local GeoJSON file
 * Loads from the complete Kazakhstan regions file and extracts the specific region
 */
export async function fetchNorthKazakhstanBoundary() {
  try {
    console.log('🗺️ Loading North Kazakhstan boundary from local GeoJSON file...');
    
    // Read the GeoJSON file directly from the filesystem (server-side)
    const filePath = path.join(process.cwd(), 'public', 'geoBoundaries-KAZ-ADM1.geojson');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const allRegions = JSON.parse(fileContent);
    
    console.log(`📥 Loaded ${allRegions.features.length} Kazakhstan regions`);
    
    // Find North Kazakhstan Region
    const northKazakhstan = allRegions.features.find((feature: any) => {
      return feature.properties.shapeName === "North Kazakhstan Region";
    });
    
    if (!northKazakhstan) {
      console.log('Available regions:');
      allRegions.features.forEach((f: any) => {
        console.log(`- ${f.properties.shapeName} (ISO: ${f.properties.shapeISO})`);
      });
      throw new Error('North Kazakhstan Region not found in GeoJSON file');
    }
    
    // Create proper boundary object
    const boundary = {
      type: "Feature" as const,
      properties: {
        name: "North Kazakhstan Region",
        nameEn: "North Kazakhstan Region",
        nameRu: "Северо-Казахстанская область", 
        nameKk: "Солтүстік Қазақстан облысы",
        iso: northKazakhstan.properties.shapeISO,
        adminLevel: 4,
        center: [69.2, 54.5],
        source: "geoBoundaries/OpenStreetMap",
        originalId: northKazakhstan.properties.shapeID
      },
      geometry: northKazakhstan.geometry
    };
    
    console.log(`✅ North Kazakhstan boundary loaded successfully!`);
    console.log(`📍 ISO: ${boundary.properties.iso}`);
    console.log(`📍 Boundary points: ${boundary.geometry.coordinates[0].length}`);
    console.log(`📍 Source: ${boundary.properties.source}`);
    
    return boundary;
    
  } catch (error) {
    console.error('❌ Failed to load boundary from local GeoJSON:', error);
    console.log('📦 Using fallback simple boundary');
    return getSimpleBoundary();
  }
}

/**
 * Fetch North Kazakhstan Oblast boundary from OpenStreetMap Overpass API
 * @deprecated Use fetchNorthKazakhstanBoundary() with static boundaries instead
 */
export async function fetchNorthKazakhstanBoundaryFromOSM() {
  // Overpass API query for North Kazakhstan Oblast
  const overpassQuery = `
    [out:json][timeout:60];
    (
      relation["name:en"~"North Kazakhstan","ISO3166-1"="KZ"]["admin_level"="4"];
      relation["name"~"Солтүстік Қазақстан"]["admin_level"="4"];
      relation["name"~"Северо-Казахстанская"]["admin_level"="4"];
    );
    out geom;
  `;
  
  const overpassUrl = 'https://overpass-api.de/api/interpreter';
  
  try {
    console.log('🌍 Fetching North Kazakhstan boundary from OpenStreetMap...');
    
    const response = await fetch(overpassUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(overpassQuery)}`
    });
    
    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Convert OSM data to GeoJSON
    if (data.elements && data.elements.length > 0) {
      const relation = data.elements[0];
      
      // Extract coordinates from OSM relation members
      const outerCoordinates: number[][] = [];
      
      if (relation.members) {
        for (const member of relation.members) {
          if (member.type === 'way' && member.role === 'outer' && member.geometry) {
            const wayCoords = member.geometry.map((point: any) => [point.lon, point.lat]);
            outerCoordinates.push(...wayCoords);
          }
        }
      }
      
      if (outerCoordinates.length > 0) {
        // Close polygon if not already closed
        const firstPoint = outerCoordinates[0];
        const lastPoint = outerCoordinates[outerCoordinates.length - 1];
        if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
          outerCoordinates.push(firstPoint);
        }
        
        console.log(`✅ OSM Boundary created with ${outerCoordinates.length} points`);
        
        return {
          type: 'Feature',
          properties: {
            name: 'North Kazakhstan Region',
            nameRu: 'Северо-Казахстанская область',
            nameKk: 'Солтүстік Қазақстан облысы',
            center: 'Petropavl',
            source: 'OpenStreetMap API'
          },
          geometry: {
            type: 'Polygon',
            coordinates: [outerCoordinates]
          }
        };
      }
    }
    
    throw new Error('No valid boundary data found in OSM response');
    
  } catch (error) {
    console.error('❌ Failed to fetch boundary from OSM:', error);
    console.log('📦 Using static boundary fallback');
    return fetchNorthKazakhstanBoundary();
  }
}

/**
 * Simplified boundary as fallback
 */
function getSimpleBoundary() {
  return {
    type: 'Feature',
    properties: {
      name: 'North Kazakhstan Region (Simplified)',
      nameRu: 'Северо-Казахстанская область',
      source: 'Fallback'
    },
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [68.0, 55.5],
        [73.0, 55.5], 
        [73.0, 53.0],
        [68.0, 53.0],
        [68.0, 55.5]
      ]]
    }
  };
}

/**
 * Alternative: Load boundary from static file
 */
export async function loadStaticBoundary() {
  try {
    const response = await fetch('/boundaries/north-kazakhstan.geojson');
    if (!response.ok) {
      throw new Error(`Failed to load static boundary: ${response.status}`);
    }
    const geojson = await response.json();
    console.log('📁 Loaded boundary from static file');
    return geojson;
  } catch (error) {
    console.error('❌ Failed to load static boundary:', error);
    return getSimpleBoundary();
  }
}