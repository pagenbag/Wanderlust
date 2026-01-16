import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

// NOTE: leaflet CSS is loaded in index.html. Importing it here breaks browser-native ESM.

interface MapLocation {
  lat: number;
  lng: number;
  title: string;
  type: 'activity' | 'accommodation' | 'meal';
  day: number;
  time?: string;
}

interface LeafletMapProps {
  locations: MapLocation[];
  days: number; // Total number of days
}

const LeafletMap: React.FC<LeafletMapProps> = ({ locations, days }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');

  // Fix: Invalidate size to ensure map renders correctly when modal opens or container resizes
  useEffect(() => {
    const timer = setTimeout(() => {
        if (mapInstance.current) {
            mapInstance.current.invalidateSize();
        }
    }, 200); // Increased delay slightly to ensure DOM is ready
    return () => clearTimeout(timer);
  }, [locations]); // Also invalidate when locations change (often implies modal open)

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize Map
    if (!mapInstance.current) {
      mapInstance.current = L.map(mapContainer.current).setView([0, 0], 2);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstance.current);

      markersRef.current = L.layerGroup().addTo(mapInstance.current);
    }

    const map = mapInstance.current;
    const markersLayer = markersRef.current;

    // Clear existing
    markersLayer?.clearLayers();
    if (polylineRef.current) {
        polylineRef.current.remove();
    }

    // Filter locations
    const visibleLocations = locations.filter(loc => 
        selectedDay === 'all' || loc.day === selectedDay
    );

    // Custom Icons
    const getIcon = (type: string, day: number) => {
       const color = type === 'accommodation' ? '#ef4444' : type === 'meal' ? '#f97316' : '#6366f1'; // Tailwind colors
       return L.divIcon({
         className: 'custom-icon',
         html: `
            <div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                <span style="color: white; font-weight: bold; font-size: 14px;">${day}</span>
            </div>
            <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid ${color}; margin: -2px auto 0;"></div>
         `,
         iconSize: [30, 40],
         iconAnchor: [15, 40],
         popupAnchor: [0, -40]
       });
    };

    const latLngs: L.LatLngExpression[] = [];
    const bounds = L.latLngBounds([]);

    visibleLocations.forEach(loc => {
      if(loc.lat && loc.lng) {
          const marker = L.marker([loc.lat, loc.lng], { icon: getIcon(loc.type, loc.day) })
            .bindPopup(`
                <div class="text-slate-900 font-sans">
                    <strong class="block text-sm mb-1">${loc.title}</strong>
                    <span class="text-xs text-slate-500 uppercase font-bold">${loc.type} • Day ${loc.day}</span>
                    ${loc.time ? `<div class="text-xs mt-1 text-slate-600">${loc.time}</div>` : ''}
                </div>
            `);
          
          markersLayer?.addLayer(marker);
          latLngs.push([loc.lat, loc.lng]);
          bounds.extend([loc.lat, loc.lng]);
      }
    });

    // Draw route line
    if (latLngs.length > 1) {
        polylineRef.current = L.polyline(latLngs, {
            color: '#6366f1', // Indigo-500
            weight: 3,
            opacity: 0.7,
            dashArray: '5, 10',
            lineCap: 'round'
        }).addTo(map);
    }

    // Fit bounds
    if (latLngs.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }

  }, [locations, selectedDay]);

  return (
      <div className="flex h-full w-full">
          {/* Day Selector Sidebar */}
          <div className="w-48 bg-slate-900 border-r border-slate-700 flex flex-col p-2 overflow-y-auto">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Filter Days</h4>
              <button 
                onClick={() => setSelectedDay('all')}
                className={`text-left px-3 py-2 rounded-lg text-sm mb-1 transition ${selectedDay === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
              >
                  All Days
              </button>
              {Array.from({ length: days }, (_, i) => i + 1).map(day => (
                  <button 
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`text-left px-3 py-2 rounded-lg text-sm mb-1 transition ${selectedDay === day ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                  >
                      Day {day}
                  </button>
              ))}
          </div>

          {/* Map Container */}
          <div className="flex-grow relative z-0">
             <div ref={mapContainer} className="w-full h-full bg-slate-100" />
          </div>
      </div>
  );
};

export default LeafletMap;