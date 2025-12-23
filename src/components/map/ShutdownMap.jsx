import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Polygon, Polyline, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const actionColors = {
  shutdown_all: '#EF4444',      // red
  shutdown_b_only: '#A855F7',   // purple
  caution: '#EAB308'            // yellow
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

export default function ShutdownMap({ shutdowns, onSelectShutdown, selectedId, hoveredId }) {
  const shapeRefs = useRef({});

  useEffect(() => {
    if (hoveredId) {
      const ref = shapeRefs.current[hoveredId];
      if (ref) {
        ref.openTooltip();
      }
    } else {
      // Close all tooltips when not hovering
      Object.values(shapeRefs.current).forEach(ref => {
        if (ref) ref.closeTooltip();
      });
    }
  }, [hoveredId]);

  const getColor = (shutdown) => {
    if (shutdown.status === 'cleared') return clearedColor;
    return actionColors[shutdown.action] || actionColors.shutdown_all;
  };

  const renderShutdown = (shutdown) => {
    const color = getColor(shutdown);
    const opacity = shutdown.status === 'cleared' ? 0.3 : 0.5;
    const isSelected = selectedId === shutdown.id;
    const isHovered = hoveredId === shutdown.id;
    const weight = isSelected ? 5 : isHovered ? 4 : 2;
    const fillOpacity = isSelected 
      ? (shutdown.status === 'cleared' ? 0.5 : 0.7) 
      : isHovered 
        ? (shutdown.status === 'cleared' ? 0.5 : 0.65)
        : opacity;

    const popupContent = (
      <div className="max-w-[20vw] min-w-[150px]">
        <h3 className="font-semibold text-sm break-words whitespace-normal">{shutdown.title}</h3>
        <p className="text-xs text-gray-600 capitalize mt-1 break-words whitespace-normal">{shutdown.reason}</p>
        {shutdown.radius_km && (
          <p className="text-xs text-gray-500 break-words whitespace-normal">{shutdown.radius_km}km radius</p>
        )}
        {shutdown.notes && (
          <p className="text-xs text-gray-600 mt-1 break-words whitespace-normal">{shutdown.notes}</p>
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
            ref={el => { if (el) shapeRefs.current[shutdown.id] = el; }}
            center={[shutdown.center_lat, shutdown.center_lng]}
            radius={shutdown.radius_km * 1000}
            pathOptions={{ 
              color, 
              fillColor: color, 
              fillOpacity,
              weight 
            }}
            eventHandlers={{
              click: () => onSelectShutdown(shutdown)
            }}
          >
            <Tooltip>{popupContent}</Tooltip>
          </Circle>
        );
      
      case 'point':
        return (
          <Marker
            key={shutdown.id}
            ref={el => { if (el) shapeRefs.current[shutdown.id] = el; }}
            position={[shutdown.center_lat, shutdown.center_lng]}
            eventHandlers={{
              click: () => onSelectShutdown(shutdown)
            }}
          >
            <Tooltip>{popupContent}</Tooltip>
          </Marker>
        );
      
      case 'polygon':
        return (
          <Polygon
            key={shutdown.id}
            ref={el => { if (el) shapeRefs.current[shutdown.id] = el; }}
            positions={shutdown.coordinates || []}
            pathOptions={{ 
              color, 
              fillColor: color, 
              fillOpacity,
              weight 
            }}
            eventHandlers={{
              click: () => onSelectShutdown(shutdown)
            }}
          >
            <Tooltip>{popupContent}</Tooltip>
          </Polygon>
        );
      
      case 'line':
        return (
          <Polyline
            key={shutdown.id}
            ref={el => { if (el) shapeRefs.current[shutdown.id] = el; }}
            positions={shutdown.coordinates || []}
            pathOptions={{ 
              color, 
              weight: weight + 2 
            }}
            eventHandlers={{
              click: () => onSelectShutdown(shutdown)
            }}
          >
            <Tooltip>{popupContent}</Tooltip>
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
      <FitBounds shutdowns={shutdowns} />
      {shutdowns.map(renderShutdown)}
    </MapContainer>
  );
}