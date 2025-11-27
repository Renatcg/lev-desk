import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { EditableCell } from "./EditableCell";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface MediaPlanEditableGridProps {
  pieces: any[];
  categories: any[];
  projectId: string;
  onUpdate: () => void;
}

export function MediaPlanEditableGrid({ 
  pieces, 
  categories, 
  projectId,
  onUpdate 
}: MediaPlanEditableGridProps) {
  const [editingCell, setEditingCell] = useState<{ rowId: string; field: string } | null>(null);
  const [newRow, setNewRow] = useState<any>({
    category_id: '',
    name: '',
    channel: '',
    media_type: 'online',
    piece_type: '',
    cost_per_insertion: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
  });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const { toast } = useToast();

  const fields = [
    { key: 'category_id', label: 'Categoria', type: 'select', width: 150, options: categories.map(c => ({ value: c.id, label: c.name })) },
    { key: 'name', label: 'Nome', type: 'text', width: 200 },
    { key: 'channel', label: 'Canal', type: 'text', width: 120 },
    { key: 'media_type', label: 'Tipo Mídia', type: 'select', width: 100, options: [{ value: 'online', label: 'Online' }, { value: 'offline', label: 'Offline' }] },
    { key: 'piece_type', label: 'Tipo Peça', type: 'text', width: 120 },
    { key: 'cost_per_insertion', label: 'R$/Ins', type: 'number', width: 100 },
    { key: 'start_date', label: 'Início', type: 'date', width: 120 },
    { key: 'end_date', label: 'Fim', type: 'date', width: 120 },
  ];

  const handleUpdateCell = async (pieceId: string, field: string, value: any) => {
    try {
      const updateData: any = { [field]: value };
      
      // Convert number fields
      if (field === 'cost_per_insertion' || field === 'global_cost') {
        updateData[field] = value ? parseFloat(value) : null;
      }

      const { error } = await supabase
        .from('media_pieces')
        .update(updateData)
        .eq('id', pieceId);

      if (error) throw error;

      toast({
        title: "Atualizado!",
        description: "Campo atualizado com sucesso.",
      });

      onUpdate();
    } catch (error: any) {
      console.error('Error updating:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar campo",
        variant: "destructive",
      });
    }
  };

  const handleCreatePiece = async () => {
    if (!newRow.name || !newRow.category_id || !newRow.channel) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha pelo menos categoria, nome e canal",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('media_pieces')
        .insert({
          project_id: projectId,
          category_id: newRow.category_id,
          name: newRow.name,
          channel: newRow.channel,
          media_type: newRow.media_type,
          piece_type: newRow.piece_type,
          cost_per_insertion: newRow.cost_per_insertion ? parseFloat(newRow.cost_per_insertion) : null,
          start_date: newRow.start_date,
          end_date: newRow.end_date,
        });

      if (error) throw error;

      toast({
        title: "Criado!",
        description: "Nova peça de mídia criada com sucesso.",
      });

      // Reset new row
      setNewRow({
        category_id: '',
        name: '',
        channel: '',
        media_type: 'online',
        piece_type: '',
        cost_per_insertion: '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(), 'yyyy-MM-dd'),
      });
      setIsAddingNew(false);
      onUpdate();
    } catch (error: any) {
      console.error('Error creating:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar peça",
        variant: "destructive",
      });
    }
  };

  const handleDeletePiece = async (pieceId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta peça?')) return;

    try {
      const { error } = await supabase
        .from('media_pieces')
        .delete()
        .eq('id', pieceId);

      if (error) throw error;

      toast({
        title: "Excluído!",
        description: "Peça removida com sucesso.",
      });

      onUpdate();
    } catch (error: any) {
      console.error('Error deleting:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir peça",
        variant: "destructive",
      });
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || '-';
  };

  return (
    <Card>
      <ScrollArea className="w-full">
        <div className="min-w-[1200px]">
          {/* Header */}
          <div className="flex bg-muted/50 border-b border-border sticky top-0 z-10">
            {fields.map((field) => (
              <div
                key={field.key}
                style={{ width: field.width }}
                className="p-2 font-semibold text-xs border-r border-border"
              >
                {field.label}
              </div>
            ))}
            <div className="w-16 p-2 font-semibold text-xs">Ações</div>
          </div>

          {/* Rows */}
          {pieces.map((piece) => (
            <div key={piece.id} className="flex border-b border-border hover:bg-muted/30">
              {fields.map((field) => (
                <div
                  key={field.key}
                  style={{ width: field.width }}
                  className="border-r border-border"
                >
                  <EditableCell
                    value={field.key === 'category_id' ? getCategoryName(piece[field.key]) : piece[field.key]}
                    field={field.key}
                    type={field.type as any}
                    isEditing={editingCell?.rowId === piece.id && editingCell?.field === field.key}
                    onEdit={() => setEditingCell({ rowId: piece.id, field: field.key })}
                    onChange={(val) => {
                      // For category, we need to pass the ID
                      if (field.key === 'category_id') {
                        const categoryId = field.options?.find(opt => opt.label === val)?.value || val;
                        handleUpdateCell(piece.id, field.key, categoryId);
                      } else {
                        handleUpdateCell(piece.id, field.key, val);
                      }
                    }}
                    onSave={() => setEditingCell(null)}
                    onCancel={() => setEditingCell(null)}
                    options={field.options}
                    placeholder={field.label}
                  />
                </div>
              ))}
              <div className="w-16 p-2 flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleDeletePiece(piece.id)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </div>
          ))}

          {/* New Row */}
          {isAddingNew ? (
            <div className="flex border-b-2 border-primary bg-primary/5">
              {fields.map((field) => (
                <div
                  key={field.key}
                  style={{ width: field.width }}
                  className="border-r border-border"
                >
                  <EditableCell
                    value={newRow[field.key]}
                    field={field.key}
                    type={field.type as any}
                    isEditing={true}
                    onEdit={() => {}}
                    onChange={(val) => setNewRow({ ...newRow, [field.key]: val })}
                    onSave={() => {}}
                    onCancel={() => {}}
                    options={field.options}
                    placeholder={field.label}
                  />
                </div>
              ))}
              <div className="w-16 p-2 flex items-center justify-center gap-1">
                <Button
                  variant="default"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleCreatePiece}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex border-b border-dashed border-border hover:bg-muted/20 cursor-pointer" onClick={() => setIsAddingNew(true)}>
              <div className="p-3 flex items-center gap-2 text-muted-foreground text-sm">
                <Plus className="h-4 w-4" />
                <span>Adicionar nova peça</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
