import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Polygon, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const reasonColors = {
  weather: '#3B82F6',
  accident: '#EF4444',
  construction: '#F59E0B',
  event: '#8B5CF6',
  emergency: '#DC2626',
  other: '#6B7280'
};

const clearedColor = '#9CA3AF';

function FitBounds({ shutdowns }) {
  const map = useMap();
  
  useEffect(() => {
    if (shutdowns.length > 0) {
      const bounds = [];
      shutdowns.forEach(s => {
        if (s.center_lat && s.center_lng) {
          bounds.push([s.center_lat, s.center_lng]);
        }
        if (s.coordinates && s.coordinates.length > 0) {
          s.coordinates.forEach(coord => bounds.push(coord));
        }
      });
      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
      }
    }
  }, [shutdowns, map]);
  
  return null;
}

export default function ShutdownMap({ shutdowns, onSelectShutdown, selectedId }) {
  const filteredShutdowns = shutdowns.filter(s => s.status === 'active');

  const getColor = (shutdown) => {
    if (shutdown.status === 'cleared') return clearedColor;
    return reasonColors[shutdown.reason] || reasonColors.other;
  };

  const renderShutdown = (shutdown) => {
    const color = getColor(shutdown);
    const opacity = shutdown.status === 'cleared' ? 0.3 : 0.5;
    const isSelected = selectedId === shutdown.id;
    const weight = isSelected ? 4 : 2;

    const popupContent = (
      <div className="min-w-[200px]">
        <h3 className="font-semibold text-sm">{shutdown.title}</h3>
        <p className="text-xs text-gray-600 capitalize mt-1">{shutdown.reason}</p>
        {shutdown.radius_km && (
          <p className="text-xs text-gray-500">{shutdown.radius_km}km radius</p>
        )}
        <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
          shutdown.status === 'active' 
            ? 'bg-red-100 text-red-700' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {shutdown.status}
        </span>
      </div>
    );

    switch (shutdown.geometry_type) {
      case 'circle':
        return (
          <Circle
            key={shutdown.id}
            center={[shutdown.center_lat, shutdown.center_lng]}
            radius={shutdown.radius_km * 1000}
            pathOptions={{ 
              color, 
              fillColor: color, 
              fillOpacity: opacity,
              weight 
            }}
            eventHandlers={{
              click: () => onSelectShutdown(shutdown)
            }}
          >
            <Popup>{popupContent}</Popup>
          </Circle>
        );
      
      case 'point':
        return (
          <Marker
            key={shutdown.id}
            position={[shutdown.center_lat, shutdown.center_lng]}
            eventHandlers={{
              click: () => onSelectShutdown(shutdown)
            }}
          >
            <Popup>{popupContent}</Popup>
          </Marker>
        );
      
      case 'polygon':
        return (
          <Polygon
            key={shutdown.id}
            positions={shutdown.coordinates || []}
            pathOptions={{ 
              color, 
              fillColor: color, 
              fillOpacity: opacity,
              weight 
            }}
            eventHandlers={{
              click: () => onSelectShutdown(shutdown)
            }}
          >
            <Popup>{popupContent}</Popup>
          </Polygon>
        );
      
      case 'line':
        return (
          <Polyline
            key={shutdown.id}
            positions={shutdown.coordinates || []}
            pathOptions={{ 
              color, 
              weight: weight + 2 
            }}
            eventHandlers={{
              click: () => onSelectShutdown(shutdown)
            }}
          >
            <Popup>{popupContent}</Popup>
          </Polyline>
        );
      
      default:
        return null;
    }
  };

  return (
    <MapContainer
      center={[56.1304, -106.3468]}
      zoom={4}
      className="h-full w-full"
      style={{ background: '#E5E7EB' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds shutdowns={filteredShutdowns} />
      {filteredShutdowns.map(renderShutdown)}
    </MapContainer>
  );
}