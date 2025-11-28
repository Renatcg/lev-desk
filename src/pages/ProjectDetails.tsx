import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Building2, Calendar, FileText, Edit, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { ProjectDocuments } from "@/components/documents/ProjectDocuments";

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [terrenos, setTerrenos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);

  const statusMap = {
    viability: { label: "Viabilidade", color: "bg-accent" },
    project: { label: "Projeto", color: "bg-sky-100" },
    approvals: { label: "Aprovações", color: "bg-amber-100" },
    sales: { label: "Vendas", color: "bg-green-100" },
    delivery: { label: "Entrega", color: "bg-primary/10" },
  };

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
    }
  }, [id]);

  const fetchProjectDetails = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // Buscar dados do projeto
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          companies:company_id(
            id,
            nome_comercial,
            razao_social,
            cnpj,
            email,
            phone
          ),
          created_by_profile:profiles!created_by(
            name,
            email
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (projectError) throw projectError;
      if (!projectData) {
        toast.error("Projeto não encontrado");
        navigate('/projects');
        return;
      }

      setProject(projectData);

      // Buscar terrenos vinculados
      const { data: terrenosData, error: terrenosError } = await supabase
        .from('terrenos')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });

      if (terrenosError) throw terrenosError;
      setTerrenos(terrenosData || []);

    } catch (error) {
      console.error('Erro ao carregar detalhes do projeto:', error);
      toast.error("Erro ao carregar detalhes do projeto");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSuccess = () => {
    fetchProjectDetails();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const statusInfo = statusMap[project.status as keyof typeof statusMap];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/projects')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
              <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
            </div>
            <p className="text-muted-foreground">
              {project.companies?.nome_comercial || project.companies?.razao_social || 'Sem empresa'}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowEditForm(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar Projeto
        </Button>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Área Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.area ? `${project.area.toLocaleString()} m²` : 'Não informado'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Terrenos Vinculados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{terrenos.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Data de Criação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(project.created_at).toLocaleDateString('pt-BR')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="terrenos">Terrenos ({terrenos.length})</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Projeto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.description && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Descrição</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {project.description}
                  </p>
                </div>
              )}

              <Separator />

              {project.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Endereço</h3>
                    <p className="text-sm text-muted-foreground">{project.address}</p>
                  </div>
                </div>
              )}

              <Separator />

              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <h3 className="text-sm font-semibold mb-1">Empresa Responsável</h3>
                  <p className="text-sm text-muted-foreground">
                    {project.companies?.nome_comercial || project.companies?.razao_social}
                  </p>
                  {project.companies?.cnpj && (
                    <p className="text-xs text-muted-foreground mt-1">
                      CNPJ: {project.companies.cnpj}
                    </p>
                  )}
                  {project.companies?.email && (
                    <p className="text-xs text-muted-foreground">
                      Email: {project.companies.email}
                    </p>
                  )}
                  {project.companies?.phone && (
                    <p className="text-xs text-muted-foreground">
                      Telefone: {project.companies.phone}
                    </p>
                  )}
                </div>
              </div>

              {project.created_by_profile && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold mb-1">Criado por</h3>
                    <p className="text-sm text-muted-foreground">
                      {project.created_by_profile.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {project.created_by_profile.email}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Terrenos Tab */}
        <TabsContent value="terrenos" className="space-y-4">
          {terrenos.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum terreno vinculado a este projeto
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {terrenos.map((terreno) => (
                <Card key={terreno.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{terreno.nome}</CardTitle>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents">
          <ProjectDocuments projectId={id!} />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Atividades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="w-px h-full bg-border mt-2" />
                  </div>
                  <div className="pb-4">
                    <p className="font-medium">Projeto criado</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(project.created_at).toLocaleDateString('pt-BR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {project.created_by_profile && (
                      <p className="text-sm text-muted-foreground">
                        por {project.created_by_profile.name}
                      </p>
                    )}
                  </div>
                </div>

                {project.updated_at !== project.created_at && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-primary/10 p-2">
                        <Edit className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">Última atualização</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(project.updated_at).toLocaleDateString('pt-BR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ProjectForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        onSuccess={handleEditSuccess}
        projectToEdit={project}
      />
    </div>
  );
};

export default ProjectDetails;
