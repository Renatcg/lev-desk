import { useState, useEffect } from "react";
import { Building2, Plus, Search, MoreVertical, Pencil, MapPinPlus, Archive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GrupoEconomicoForm } from "@/components/landbank/GrupoEconomicoForm";
import { TerrenoForm } from "@/components/landbank/TerrenoForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const GruposEconomicos = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showTerrenoForm, setShowTerrenoForm] = useState(false);
  const [grupoToEdit, setGrupoToEdit] = useState<any>(null);
  const [selectedGrupoForTerreno, setSelectedGrupoForTerreno] = useState<string>("");
  const [grupoToArchive, setGrupoToArchive] = useState<any>(null);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrupos();
  }, []);

  const fetchGrupos = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select(`
          *,
          terrenos:terrenos!grupo_economico_id(count),
          projects:projects!company_id(count)
        `)
        .neq('status', 'archived')
        .order('nome_comercial');

      if (error) throw error;
      setGrupos(data || []);
    } catch (error) {
      console.error('Erro ao buscar grupos:', error);
      toast.error("Erro ao carregar grupos econômicos");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (grupo: any) => {
    setGrupoToEdit(grupo);
    setShowForm(true);
  };

  const handleAddTerreno = (grupoId: string) => {
    setSelectedGrupoForTerreno(grupoId);
    setShowTerrenoForm(true);
  };

  const handleArchive = async () => {
    if (!grupoToArchive) return;

    try {
      const { error } = await supabase
        .from('companies')
        .update({ status: 'archived' })
        .eq('id', grupoToArchive.id);

      if (error) throw error;

      toast.success("Grupo econômico arquivado com sucesso!");
      fetchGrupos();
      setGrupoToArchive(null);
    } catch (error) {
      console.error('Erro ao arquivar grupo:', error);
      toast.error("Erro ao arquivar grupo econômico");
    }
  };

  const handleFormSuccess = () => {
    fetchGrupos();
    setGrupoToEdit(null);
  };

  const handleTerrenoFormSuccess = () => {
    setSelectedGrupoForTerreno("");
    toast.success("Terreno adicionado com sucesso!");
  };

  const filteredGrupos = grupos.filter(grupo =>
    grupo.nome_comercial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grupo.razao_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grupo.cnpj?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Grupos Econômicos</h1>
          <p className="text-muted-foreground">
            Gestão de empresas do grupo
          </p>
        </div>
        <Button onClick={() => {
          setGrupoToEdit(null);
          setShowForm(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Grupo
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grupos Grid */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Carregando...
        </div>
      ) : filteredGrupos.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum grupo econômico encontrado
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredGrupos.map((grupo) => (
            <Card
              key={grupo.id}
              className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      {grupo.nome_comercial || grupo.razao_social}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      CNPJ: {grupo.cnpj}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(grupo)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAddTerreno(grupo.id)}>
                          <MapPinPlus className="mr-2 h-4 w-4" />
                          Adicionar Terreno
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setGrupoToArchive(grupo)}
                          className="text-destructive"
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          Arquivar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {grupo.razao_social && grupo.razao_social !== grupo.nome_comercial && (
                  <div>
                    <p className="text-xs text-muted-foreground">Razão Social</p>
                    <p className="text-sm font-medium">{grupo.razao_social}</p>
                  </div>
                )}

                {grupo.responsavel_legal && (
                  <div>
                    <p className="text-xs text-muted-foreground">Responsável Legal</p>
                    <p className="text-sm font-medium">{grupo.responsavel_legal}</p>
                  </div>
                )}

                <div className="pt-2 border-t space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Terrenos</span>
                    <span className="font-semibold">{grupo.terrenos?.[0]?.count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Projetos</span>
                    <span className="font-semibold">{grupo.projects?.[0]?.count || 0}</span>
                  </div>
                </div>

                {grupo.email && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">{grupo.email}</p>
                    {grupo.phone && (
                      <p className="text-xs text-muted-foreground">{grupo.phone}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <GrupoEconomicoForm
        open={showForm}
        onOpenChange={setShowForm}
        onSuccess={handleFormSuccess}
        grupoToEdit={grupoToEdit}
      />

      <TerrenoForm
        open={showTerrenoForm}
        onOpenChange={setShowTerrenoForm}
        onSuccess={handleTerrenoFormSuccess}
        defaultGrupoId={selectedGrupoForTerreno}
      />

      <AlertDialog open={!!grupoToArchive} onOpenChange={() => setGrupoToArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar Grupo Econômico?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá arquivar o grupo "{grupoToArchive?.nome_comercial || grupoToArchive?.razao_social}". 
              Os terrenos associados não serão afetados, mas o grupo não aparecerá mais na listagem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>Arquivar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GruposEconomicos;
