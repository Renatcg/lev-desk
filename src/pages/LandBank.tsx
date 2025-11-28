import { useState, useEffect } from "react";
import { MapPin, Plus, Filter, Search } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TerrenoForm } from "@/components/landbank/TerrenoForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const LandBank = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [terrenos, setTerrenos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTerrenos();
  }, []);

  const fetchTerrenos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('terrenos')
        .select(`
          *,
          grupo_economico:companies(
            id,
            nome_comercial,
            razao_social
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTerrenos(data || []);
    } catch (error) {
      console.error('Erro ao buscar terrenos:', error);
      toast.error("Erro ao carregar terrenos");
    } finally {
      setLoading(false);
    }
  };

  const filteredTerrenos = terrenos.filter(terreno =>
    terreno.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    terreno.grupo_economico?.nome_comercial?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const terrenosComLocalizacao = filteredTerrenos.filter(
    t => t.latitude && t.longitude
  );

  const getStatusBadge = (status: string) => {
    const statusMap = {
      available: { label: "Disponível", variant: "default" as const },
      negotiating: { label: "Negociando", variant: "secondary" as const },
      acquired: { label: "Adquirido", variant: "outline" as const },
    };
    const statusData = statusMap[status as keyof typeof statusMap];
    return <Badge variant={statusData.variant}>{statusData.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">LandBank</h1>
          <p className="text-muted-foreground">
            Gestão de terrenos e oportunidades de incorporação
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Terreno
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mapa */}
      {terrenosComLocalizacao.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mapa de Terrenos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg overflow-hidden border h-[400px]">
              <MapContainer
                center={[terrenosComLocalizacao[0].latitude, terrenosComLocalizacao[0].longitude]}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {terrenosComLocalizacao.map((terreno) => (
                  <Marker
                    key={terreno.id}
                    position={[terreno.latitude, terreno.longitude]}
                  >
                    <Popup>
                      <div className="p-2">
                        <p className="font-semibold">{terreno.nome}</p>
                        <p className="text-sm">{terreno.area?.toLocaleString()} m²</p>
                        {getStatusBadge(terreno.status)}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Terrenos Grid */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Carregando...
        </div>
      ) : filteredTerrenos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum terreno encontrado
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTerrenos.map((terreno) => (
            <Card
              key={terreno.id}
              className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{terreno.nome}</CardTitle>
                    {getStatusBadge(terreno.status)}
                  </div>
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {terreno.logradouro && (
                  <div className="text-sm text-muted-foreground flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      {terreno.logradouro}
                      {terreno.numero && `, ${terreno.numero}`}
                      {terreno.bairro && ` - ${terreno.bairro}`}
                      {terreno.cidade && `, ${terreno.cidade}`}
                      {terreno.estado && `/${terreno.estado}`}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Área</p>
                    <p className="font-semibold">{terreno.area?.toLocaleString()} m²</p>
                  </div>
                  {terreno.matricula && (
                    <div>
                      <p className="text-xs text-muted-foreground">Matrícula</p>
                      <p className="font-semibold">{terreno.matricula}</p>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    {terreno.grupo_economico?.nome_comercial || terreno.grupo_economico?.razao_social}
                  </p>
                </div>

                {terreno.status === "acquired" && (
                  <Button variant="outline" className="w-full" size="sm">
                    Converter em Empreendimento
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TerrenoForm
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={fetchTerrenos}
      />
    </div>
  );
};

export default LandBank;
