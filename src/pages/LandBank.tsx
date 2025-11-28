import { useState, useEffect } from "react";
import { MapPin, Plus, Filter, Search, MoreVertical, Edit, Archive, FolderOpen } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [grupos, setGrupos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [terrenoToEdit, setTerrenoToEdit] = useState<any>(null);
  const [terrenoToArchive, setTerrenoToArchive] = useState<any>(null);

  useEffect(() => {
    fetchTerrenos();
    fetchGrupos();
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

  const fetchGrupos = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, nome_comercial, razao_social')
        .neq('status', 'archived');

      if (error) throw error;
      setGrupos(data || []);
    } catch (error) {
      console.error('Erro ao buscar grupos:', error);
    }
  };

  // Handler para adicionar novo terreno
  const handleAddTerreno = () => {
    if (grupos.length === 0) {
      toast.error("Nenhum grupo econômico cadastrado. Por favor, cadastre um grupo antes de adicionar terrenos.");
      return;
    }
    setShowForm(true);
  };

  const filteredTerrenos = terrenos.filter(terreno =>
    terreno.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    terreno.grupo_economico?.nome_comercial?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const terrenosComLocalizacao = filteredTerrenos.filter(
    t => t.latitude && t.longitude
  );

  const handleEditTerreno = (terreno: any) => {
    setTerrenoToEdit(terreno);
    setShowForm(true);
  };

  const handleArchiveTerreno = async (id: string) => {
    try {
      const { error } = await supabase
        .from('terrenos')
        .update({ status: 'archived' })
        .eq('id', id);

      if (error) throw error;

      toast.success("Terreno arquivado com sucesso!");
      fetchTerrenos();
    } catch (error) {
      console.error('Erro ao arquivar terreno:', error);
      toast.error("Erro ao arquivar terreno");
    }
  };

  const handleConvertToProject = async (terreno: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Criar projeto
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: terreno.nome,
          address: `${terreno.logradouro || ''} ${terreno.numero || ''}, ${terreno.bairro || ''}, ${terreno.cidade || ''}-${terreno.estado || ''}`.trim(),
          area: terreno.area,
          status: 'viability',
          company_id: terreno.grupo_economico_id,
          created_by: user.id,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Vincular terreno ao projeto
      const { error: updateError } = await supabase
        .from('terrenos')
        .update({ project_id: project.id })
        .eq('id', terreno.id);

      if (updateError) throw updateError;

      toast.success("Terreno convertido em projeto com sucesso!");
      fetchTerrenos();
    } catch (error) {
      console.error('Erro ao converter terreno:', error);
      toast.error("Erro ao converter terreno em projeto");
    }
  };

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
        <Button onClick={handleAddTerreno}>
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
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditTerreno(terreno)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleConvertToProject(terreno)}>
                        <FolderOpen className="mr-2 h-4 w-4" />
                        Converter em Projeto
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleArchiveTerreno(terreno.id)}
                        className="text-destructive"
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        Arquivar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
