import { useState, useEffect, useRef } from "react";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Edit, Copy, Trash } from "lucide-react";
import { EditPieceDialog } from "./EditPieceDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface MediaPiece {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  media_type: 'online' | 'offline';
  channel: string;
  schedule_time?: string;
  piece_type: string;
  cost_per_insertion?: number;
  global_cost?: number;
  start_date: string;
  end_date: string;
  project_id: string;
}

interface MediaInsertion {
  id: string;
  media_piece_id: string;
  insertion_date: string;
  quantity: number;
  actual_cost?: number;
}

interface MediaPlanGanttChartProps {
  pieces: MediaPiece[];
  insertions: MediaInsertion[];
  startDate: Date;
  endDate: Date;
  categories: any[];
  onCellClick?: (pieceId: string, date: Date) => void;
  onUpdate?: () => void;
  projectId?: string;
}

export function MediaPlanGanttChart({ 
  pieces, 
  insertions, 
  startDate, 
  endDate,
  categories = [],
  onCellClick,
  onUpdate,
  projectId
}: MediaPlanGanttChartProps) {
  const { toast } = useToast();
  const [groupedPieces, setGroupedPieces] = useState<Record<string, MediaPiece[]>>({});
  const [dateRange, setDateRange] = useState<Date[]>([]);
  const [editingPieceId, setEditingPieceId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [emptyRows, setEmptyRows] = useState<Record<string, string>>({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPieceForDialog, setSelectedPieceForDialog] = useState<MediaPiece | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Group pieces by category
    const grouped = pieces.reduce((acc, piece) => {
      const categoryKey = piece.category_name || 'Sem Categoria';
      if (!acc[categoryKey]) {
        acc[categoryKey] = [];
      }
      acc[categoryKey].push(piece);
      return acc;
    }, {} as Record<string, MediaPiece[]>);
    setGroupedPieces(grouped);

    // Generate date range
    const dates = eachDayOfInterval({ start: startDate, end: endDate });
    setDateRange(dates);
  }, [pieces, startDate, endDate]);

  const getInsertionsForPieceAndDate = (pieceId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return insertions.filter(
      (ins) => ins.media_piece_id === pieceId && ins.insertion_date === dateStr
    );
  };

  const getTotalInsertionsForDate = (pieceId: string, date: Date) => {
    const inserts = getInsertionsForPieceAndDate(pieceId, date);
    return inserts.reduce((sum, ins) => sum + ins.quantity, 0);
  };

  const isPieceActiveOnDate = (piece: MediaPiece, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return dateStr >= piece.start_date && dateStr <= piece.end_date;
  };

  const handleStartEdit = (piece: MediaPiece) => {
    setEditingPieceId(piece.id);
    setEditingValue(piece.name);
  };

  const handleSaveName = async () => {
    if (!editingPieceId || !editingValue.trim()) {
      setEditingPieceId(null);
      return;
    }

    // Buscar peça original para comparar
    const originalPiece = pieces.find(p => p.id === editingPieceId);
    const newName = editingValue.trim();
    
    // Só salvar se o nome realmente mudou
    if (originalPiece && originalPiece.name === newName) {
      setEditingPieceId(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('media_pieces')
        .update({ name: newName })
        .eq('id', editingPieceId);

      if (error) throw error;

      onUpdate?.();
      setEditingPieceId(null);
    } catch (error) {
      console.error('Error updating name:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o nome da peça.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingPieceId(null);
    setEditingValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleCreateFromEmptyRow = async (categoryId: string, categoryName: string, name: string) => {
    if (!name.trim() || !projectId) return;

    try {
      const { error } = await supabase
        .from('media_pieces')
        .insert([{
          project_id: projectId,
          category_id: categoryId,
          name: name.trim(),
          channel: '',
          media_type: 'online',
          piece_type: '',
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
        }]);

      if (error) throw error;

      // Clear empty row
      setEmptyRows(prev => {
        const newRows = { ...prev };
        delete newRows[categoryName];
        return newRows;
      });

      onUpdate?.();
    } catch (error) {
      console.error('Error creating piece:', error);
      toast({
        title: "Erro ao criar peça",
        description: "Não foi possível criar a peça de mídia.",
        variant: "destructive",
      });
    }
  };

  const handleEmptyRowKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, categoryId: string, categoryName: string) => {
    if (e.key === 'Enter') {
      const value = emptyRows[categoryName];
      if (value?.trim()) {
        handleCreateFromEmptyRow(categoryId, categoryName, value);
      }
    }
  };

  const handleDuplicate = async (piece: MediaPiece) => {
    try {
      const { id, category_name, ...data } = piece;
      const { error } = await supabase
        .from('media_pieces')
        .insert([{ 
          ...data,
          name: `${data.name} (cópia)`,
        }]);

      if (error) throw error;

      onUpdate?.();
    } catch (error) {
      console.error('Error duplicating piece:', error);
      toast({
        title: "Erro ao duplicar",
        description: "Não foi possível duplicar a peça.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (pieceId: string) => {
    try {
      const { error } = await supabase
        .from('media_pieces')
        .delete()
        .eq('id', pieceId);

      if (error) throw error;

      onUpdate?.();
    } catch (error) {
      console.error('Error deleting piece:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a peça.",
        variant: "destructive",
      });
    }
  };

  const handleOpenDetailsDialog = (piece: MediaPiece) => {
    setSelectedPieceForDialog(piece);
    setEditDialogOpen(true);
  };

  useEffect(() => {
    if (editingPieceId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingPieceId]);

  return (
    <Card className="w-full">
      <ScrollArea className="w-full h-[600px]">
        <div className="min-w-max pb-4">
          {/* Header with dates */}
          <div className="flex border-b border-border bg-muted/50">
            <div className="sticky left-0 z-20 bg-muted/50 border-r border-border">
              <div className="w-64 p-2 font-semibold text-sm">Peça de Mídia</div>
            </div>
            <div className="flex">
            {dateRange.map((date) => (
              <div
                key={date.toISOString()}
                className="w-[26px] h-20 flex-shrink-0 flex items-center justify-center border-r border-border"
              >
                <span className="transform -rotate-90 whitespace-nowrap text-xs font-medium">
                  {format(date, "dd MMM", { locale: ptBR })}
                </span>
              </div>
            ))}
            </div>
          </div>

          {/* Rows grouped by category */}
          {Object.entries(groupedPieces).map(([category, categoryPieces]) => (
            <div key={category}>
              {/* Category Header */}
              <div className="flex bg-accent/10 border-b border-border">
                <div className="sticky left-0 z-10 bg-accent/10 border-r border-border">
                  <div className="w-64 p-2 font-semibold text-sm">
                    {category}
                  </div>
                </div>
                <div className="flex-1" />
              </div>

              {/* Pieces in category */}
              {categoryPieces.map((piece) => (
                <div key={piece.id} className="flex border-b border-border hover:bg-muted/30">
                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <div 
                        className="sticky left-0 z-10 bg-background border-r border-border cursor-pointer hover:bg-muted/50"
                        onClick={() => handleStartEdit(piece)}
                      >
                        <div className="w-64 py-[5px] px-2 flex items-center">
                          {editingPieceId === piece.id ? (
                            <Input
                              ref={inputRef}
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onKeyDown={handleKeyDown}
                              onBlur={handleSaveName}
                              className="h-6 text-sm font-medium px-1 py-0"
                            />
                          ) : (
                            <span className="text-sm font-medium truncate">{piece.name}</span>
                          )}
                        </div>
                      </div>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => handleOpenDetailsDialog(piece)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar detalhes
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => handleDuplicate(piece)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem onClick={() => handleDelete(piece.id)} className="text-destructive focus:text-destructive">
                        <Trash className="mr-2 h-4 w-4" />
                        Excluir
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>

                  {/* Date cells */}
                  <div className="flex">
                    {dateRange.map((date) => {
                      const isActive = isPieceActiveOnDate(piece, date);
                      const totalInsertions = getTotalInsertionsForDate(piece.id, date);

                      return (
                        <div
                          key={date.toISOString()}
                          className={cn(
                            "w-[26px] h-[26px] flex-shrink-0 border-r border-border flex items-center justify-center",
                            "cursor-pointer transition-colors",
                            isActive ? 'bg-primary/5' : 'bg-muted/20',
                            totalInsertions > 0 && 'bg-primary/30 font-semibold border-2 border-primary/50',
                            'hover:bg-primary/40'
                          )}
                          onClick={() => onCellClick?.(piece.id, date)}
                        >
                          {totalInsertions > 0 && (
                            <span className="text-xs">{totalInsertions}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Empty row for adding new piece */}
              <div className="flex border-b border-border hover:bg-muted/20">
                <div className="sticky left-0 z-10 bg-background border-r border-border">
                  <div className="w-64 py-[5px] px-2 flex items-center">
                    <Input
                      value={emptyRows[category] || ''}
                      onChange={(e) => setEmptyRows(prev => ({ ...prev, [category]: e.target.value }))}
                      onKeyDown={(e) => handleEmptyRowKeyDown(e, categoryPieces[0]?.category_id, category)}
                      placeholder="Digite para adicionar nova peça..."
                      className="h-6 text-sm px-1 py-0 text-muted-foreground border-none focus-visible:ring-0"
                    />
                  </div>
                </div>
                <div className="flex">
                  {dateRange.map((date) => (
                    <div
                      key={date.toISOString()}
                      className="w-[26px] h-[26px] flex-shrink-0 border-r border-border bg-muted/10"
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}

          {pieces.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma peça de mídia cadastrada
            </div>
          )}
        </div>
      </ScrollArea>

      <EditPieceDialog
        piece={selectedPieceForDialog}
        categories={categories}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUpdate={() => onUpdate?.()}
      />
    </Card>
  );
}
