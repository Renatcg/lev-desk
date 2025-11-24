import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MoreVertical, Sparkles, Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AIProjectAssistant } from "@/components/AIProjectAssistant";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Projects = () => {
  const navigate = useNavigate();
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const stages = [
    { id: "viability", name: "Viabilidade", color: "bg-accent" },
    { id: "project", name: "Projeto", color: "bg-sky-100" },
    { id: "approvals", name: "Aprovações", color: "bg-amber-100" },
    { id: "sales", name: "Vendas", color: "bg-green-100" },
    { id: "delivery", name: "Entrega", color: "bg-primary/10" },
  ];

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*, companies(name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      console.error('Error loading projects:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar projetos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const projectsByStage = useMemo(() => {
    return stages.reduce((acc, stage) => {
      acc[stage.id] = projects.filter(p => p.status === stage.id);
      return acc;
    }, {} as Record<string, any[]>);
  }, [projects]);

  const handleProjectExtracted = async (data: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) throw new Error('Company not found');

      const { error } = await supabase.from('projects').insert({
        name: data.name,
        address: data.address,
        area: data.area,
        status: data.status,
        description: data.description,
        company_id: profile.company_id,
        created_by: user.id,
        metadata: data.extracted_data || {}
      });

      if (error) throw error;

      toast({
        title: 'Projeto criado!',
        description: `${data.name} foi adicionado ao pipeline.`
      });
      
      // Recarregar projetos
      loadProjects();
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao criar projeto',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Pipeline de Incorporação
          </h1>
          <p className="text-muted-foreground">
            Acompanhe o progresso dos empreendimentos em cada etapa
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAIAssistant(true)} variant="outline">
            <Sparkles className="mr-2 h-4 w-4" />
            Cadastrar com IA
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Novo Empreendimento
          </Button>
        </div>
      </div>

      <AIProjectAssistant
        open={showAIAssistant}
        onOpenChange={setShowAIAssistant}
        onProjectExtracted={handleProjectExtracted}
      />

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div key={stage.id} className="flex-shrink-0 w-80">
            <div className="space-y-4">
              {/* Stage Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                  <h3 className="font-semibold text-foreground">{stage.name}</h3>
                  <Badge variant="secondary" className="ml-2">
                    {projectsByStage[stage.id]?.length || 0}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    Carregando...
                  </div>
                ) : projectsByStage[stage.id]?.map((project) => (
                    <Card
                      key={project.id}
                      className="cursor-move hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm mb-1">
                              {project.name}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {project.companies?.name || 'Sem empresa'}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}`)}>
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}/schedule`)}>
                                <Calendar className="mr-2 h-4 w-4" />
                                Cronograma de Tarefas
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}/media`)}>
                                <TrendingUp className="mr-2 h-4 w-4" />
                                Plano de Mídia
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>Editar</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                Arquivar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-3">
                        {/* Footer */}
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">
                            {project.address || 'Sem endereço'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}

                {/* Empty State */}
                {!loading && projectsByStage[stage.id]?.length === 0 && (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground text-sm">
                    Nenhum empreendimento nesta etapa
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Projects;