import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, MoreVertical, Sparkles, Calendar, TrendingUp, Edit, GripVertical } from "lucide-react";
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
import { ProjectForm } from "@/components/projects/ProjectForm";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { DroppableStage } from "@/components/projects/DroppableStage";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

const Projects = () => {
  const navigate = useNavigate();
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
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

  const handleEditProject = (project: any) => {
    setProjectToEdit(project);
    setShowProjectForm(true);
  };

  const handleNewProject = () => {
    setProjectToEdit(null);
    setShowProjectForm(true);
  };

  const handleArchiveProject = async (project: any) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: 'archived' })
        .eq('id', project.id);

      if (error) throw error;

      toast({
        title: 'Projeto arquivado',
        description: `${project.name} foi arquivado com sucesso.`,
      });

      loadProjects();
    } catch (error) {
      console.error('Erro ao arquivar projeto:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível arquivar o projeto',
        variant: 'destructive',
      });
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeProjectId = String(active.id);
    let newStatus = String(over.id);
    
    // Verificar se over.id é um stage válido
    const validStageIds = stages.map(s => s.id);
    
    // Se não for um stage válido, pode ser que dropou sobre um card
    // Nesse caso, precisamos encontrar o stage desse card
    if (!validStageIds.includes(newStatus)) {
      const targetProject = projects.find(p => p.id === newStatus);
      if (targetProject) {
        newStatus = targetProject.status;
      } else {
        // Se não encontrar, cancelar a operação
        return;
      }
    }
    
    const activeProject = projects.find(p => p.id === activeProjectId);

    if (activeProject && activeProject.status !== newStatus) {
      // Atualização otimista
      setProjects(prev =>
        prev.map(p =>
          p.id === activeProjectId ? { ...p, status: newStatus } : p
        )
      );

      try {
        const { error } = await supabase
          .from('projects')
          .update({ status: newStatus })
          .eq('id', activeProjectId);

        if (error) throw error;

        toast({
          title: 'Projeto movido!',
          description: `${activeProject.name} foi movido para ${stages.find(s => s.id === newStatus)?.name}`,
        });
      } catch (error) {
        console.error('Erro ao atualizar projeto:', error);
        // Reverter em caso de erro
        setProjects(prev =>
          prev.map(p =>
            p.id === activeProjectId ? { ...p, status: activeProject.status } : p
          )
        );
        toast({
          title: 'Erro',
          description: 'Não foi possível mover o projeto',
          variant: 'destructive',
        });
      }
    }
  };

  const activeProject = activeId ? projects.find(p => p.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Pipeline de Incorporação
            </h1>
            <p className="text-muted-foreground">
              Arraste os projetos entre as etapas para atualizar o status
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowAIAssistant(true)} variant="outline">
              <Sparkles className="mr-2 h-4 w-4" />
              Cadastrar com IA
            </Button>
            <Button onClick={handleNewProject} className="bg-primary hover:bg-primary/90">
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

        <ProjectForm
          open={showProjectForm}
          onOpenChange={(open) => {
            setShowProjectForm(open);
            if (!open) setProjectToEdit(null);
          }}
          onSuccess={loadProjects}
          projectToEdit={projectToEdit}
        />

        {/* Kanban Board */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map((stage) => (
            <DroppableStage
              key={stage.id}
              stage={stage}
              projects={projectsByStage[stage.id] || []}
              loading={loading}
              onEdit={handleEditProject}
              onArchive={handleArchiveProject}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeProject ? (
          <Card className="w-80 opacity-90 cursor-grabbing shadow-lg rotate-3">
            <CardHeader className="p-4">
              <div className="flex items-start gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">
                    {activeProject.name}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {activeProject.companies?.name || 'Sem empresa'}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-xs text-muted-foreground">
                {activeProject.address || 'Sem endereço'}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default Projects;