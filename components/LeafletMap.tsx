import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Activity, Accommodation } from '../types';

interface LeafletMapProps {
  locations: {
    lat: number;
    lng: number;
    title: string;
    type: 'activity' | 'accommodation' | 'meal';
  }[];
}

const LeafletMap: React.FC<LeafletMapProps> = ({ locations }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapContainer.current).setView([0, 0], 2);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstance.current);
    }

    const map = mapInstance.current;

    // Clear existing layers (except tiles)
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    // Custom Icons
    const getIcon = (type: string) => {
       const color = type === 'accommodation' ? 'red' : type === 'meal' ? 'orange' : 'blue';
       return L.divIcon({
         className: 'custom-icon',
         html: `<span class="material-icons-round" style="color:${color}; font-size: 32px; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">place</span>`,
         iconSize: [32, 32],
         iconAnchor: [16, 32],
         popupAnchor: [0, -32]
       });
    };

    const bounds = L.latLngBounds([]);

    locations.forEach(loc => {
      if(loc.lat && loc.lng) {
          L.marker([loc.lat, loc.lng], { icon: getIcon(loc.type) })
            .addTo(map)
            .bindPopup(`<b>${loc.title}</b><br/>${loc.type}`);
          
          bounds.extend([loc.lat, loc.lng]);
      }
    });

    if (locations.length > 0 && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }

  }, [locations]);

  return <div ref={mapContainer} className="w-full h-full bg-slate-800" />;
};

export default LeafletMap;