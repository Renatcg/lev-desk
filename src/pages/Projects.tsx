import { useState } from "react";
import { Plus, MoreVertical, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AIProjectAssistant } from "@/components/AIProjectAssistant";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Projects = () => {
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const { toast } = useToast();
  
  const stages = [
    { id: "viability", name: "Viabilidade", color: "bg-accent" },
    { id: "project", name: "Projeto", color: "bg-sky-100" },
    { id: "approvals", name: "Aprovações", color: "bg-amber-100" },
    { id: "sales", name: "Vendas", color: "bg-green-100" },
    { id: "delivery", name: "Entrega", color: "bg-primary/10" },
  ];

  const projectCards = {
    viability: [
      {
        id: 1,
        name: "Residencial Parque Verde",
        company: "Construtora ABC",
        progress: 30,
        assignees: ["JD", "MS"],
        alerts: 1,
      },
    ],
    project: [
      {
        id: 2,
        name: "Condomínio das Águas",
        company: "Construtora ABC",
        progress: 45,
        assignees: ["JD", "TC"],
        alerts: 2,
      },
    ],
    approvals: [
      {
        id: 3,
        name: "Residencial Vista Verde",
        company: "Construtora ABC",
        progress: 65,
        assignees: ["MS"],
        alerts: 0,
      },
    ],
    sales: [
      {
        id: 4,
        name: "Edifício Horizonte",
        company: "Incorporadora XYZ",
        progress: 80,
        assignees: ["TC", "JD"],
        alerts: 0,
      },
    ],
    delivery: [],
  };

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
                    {projectCards[stage.id as keyof typeof projectCards].length}
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {projectCards[stage.id as keyof typeof projectCards].map(
                  (project) => (
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
                              {project.company}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreVertical className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 space-y-3">
                        {/* Progress */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-medium">{project.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                          <div className="flex -space-x-2">
                            {project.assignees.map((assignee, idx) => (
                              <Avatar
                                key={idx}
                                className="h-6 w-6 border-2 border-background"
                              >
                                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                  {assignee}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          {project.alerts > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {project.alerts} alerta{project.alerts > 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}

                {/* Empty State */}
                {projectCards[stage.id as keyof typeof projectCards].length ===
                  0 && (
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