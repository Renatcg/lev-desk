import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix para os ícones do Leaflet
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationChange: (lat: number, lng: number) => void;
  isOpen?: boolean;
}

const DraggableMarker = ({ 
  position, 
  setPosition 
}: { 
  position: [number, number]; 
  setPosition: (pos: [number, number]) => void;
}) => {
  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        const newPos = marker.getLatLng();
        setPosition([newPos.lat, newPos.lng]);
      }
    },
  };

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
};

const MapClickHandler = ({ 
  onMapClick 
}: { 
  onMapClick: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

export const LocationPicker = ({ 
  latitude, 
  longitude, 
  onLocationChange,
  isOpen = true 
}: LocationPickerProps) => {
  const [position, setPosition] = useState<[number, number]>(
    latitude && longitude ? [latitude, longitude] : [-23.55052, -46.633308] // São Paulo como padrão
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (latitude && longitude) {
      setPosition([latitude, longitude]);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (isOpen) {
      setMapReady(false);
      const timer = setTimeout(() => {
        setMapReady(true);
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setMapReady(false);
    }
  }, [isOpen]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Digite um endereço para buscar");
      return;
    }

    setLoading(true);
    try {
      // Usando Nominatim (OpenStreetMap) para geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newPos: [number, number] = [parseFloat(lat), parseFloat(lon)];
        setPosition(newPos);
        onLocationChange(newPos[0], newPos[1]);
        toast.success("Localização encontrada!");
      } else {
        toast.error("Endereço não encontrado");
      }
    } catch (error) {
      console.error('Erro ao buscar localização:', error);
      toast.error("Erro ao buscar localização");
    } finally {
      setLoading(false);
    }
  };

  const handlePositionChange = (newPos: [number, number]) => {
    setPosition(newPos);
    onLocationChange(newPos[0], newPos[1]);
  };

  const handleMapClick = (lat: number, lng: number) => {
    handlePositionChange([lat, lng]);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Digite um endereço para buscar..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <div className="rounded-lg overflow-hidden border h-[400px]">
        {mapReady ? (
          <MapContainer
            center={position}
            zoom={15}
            style={{ height: '100%', width: '100%' }}
            key={`${position[0]}-${position[1]}`}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <DraggableMarker position={position} setPosition={handlePositionChange} />
            <MapClickHandler onMapClick={handleMapClick} />
          </MapContainer>
        ) : (
          <div className="flex items-center justify-center h-full bg-muted">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
      
      <p className="text-sm text-muted-foreground">
        Lat: {position[0].toFixed(6)}, Lng: {position[1].toFixed(6)}
      </p>
    </div>
  );
};
