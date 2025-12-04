import { useDroppable } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { Badge } from "@/components/ui/badge";
import { ProjectCard } from "./ProjectCard";

interface DroppableStageProps {
  stage: {
    id: string;
    name: string;
    color: string;
  };
  projects: any[];
  loading: boolean;
  onEdit: (project: any) => void;
  onArchive: (project: any) => void;
}

export const DroppableStage = ({ stage, projects, loading, onEdit, onArchive }: DroppableStageProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  });

  return (
    <div className="flex-shrink-0 w-80">
      <div className="space-y-4">
        {/* Stage Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${stage.color}`} />
            <h3 className="font-semibold text-foreground">{stage.name}</h3>
            <Badge variant="secondary" className="ml-2">
              {projects.length}
            </Badge>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          ref={setNodeRef}
          className={`min-h-[200px] space-y-3 rounded-lg border-2 border-dashed p-2 transition-all ${
            isOver
              ? 'border-primary bg-accent/50 scale-[1.02]'
              : 'border-transparent'
          }`}
        >
          <SortableContext
            id={stage.id}
            items={projects.map(p => p.id)}
          >
            {loading ? (
              <div className="text-center text-muted-foreground text-sm py-8">
                Carregando...
              </div>
            ) : projects.length > 0 ? (
              projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={onEdit}
                  onArchive={onArchive}
                />
              ))
            ) : (
              <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground text-sm">
                Arraste projetos aqui
              </div>
            )}
          </SortableContext>
        </div>
      </div>
    </div>
  );
};
