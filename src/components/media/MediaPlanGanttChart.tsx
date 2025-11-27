import { useState, useEffect, useRef } from "react";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Edit, Copy, Trash, Plus } from "lucide-react";
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
  actual_cost?: number | null;
  created_at?: string;
  updated_at?: string;
}

interface MediaPlanGanttChartProps {
  pieces: MediaPiece[];
  insertions: MediaInsertion[];
  startDate: Date;
  endDate: Date;
  categories: any[];
  onInsertionChange?: (insertions: MediaInsertion[]) => void;
  onPieceChange?: (pieces: MediaPiece[]) => void;
  projectId?: string;
}

export function MediaPlanGanttChart({ 
  pieces, 
  insertions, 
  startDate, 
  endDate,
  categories = [],
  onInsertionChange,
  onPieceChange,
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

  // States for cell editing
  const [editingCell, setEditingCell] = useState<{pieceId: string, date: string} | null>(null);
  const [editingCellValue, setEditingCellValue] = useState<string>("");
  const cellInputRef = useRef<HTMLInputElement>(null);

  // Local state for optimistic updates
  const [localInsertions, setLocalInsertions] = useState<MediaInsertion[]>(insertions);
  const [localPieces, setLocalPieces] = useState<MediaPiece[]>(pieces);

  useEffect(() => {
    setLocalInsertions(insertions);
  }, [insertions]);

  useEffect(() => {
    setLocalPieces(pieces);
  }, [pieces]);

  useEffect(() => {
    // Group pieces by category
    const grouped = localPieces.reduce((acc, piece) => {
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
  }, [localPieces, startDate, endDate]);

  const getInsertionsForPieceAndDate = (pieceId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return localInsertions.filter(
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
    const originalPiece = localPieces.find(p => p.id === editingPieceId);
    const newName = editingValue.trim();
    
    // Só salvar se o nome realmente mudou
    if (originalPiece && originalPiece.name === newName) {
      setEditingPieceId(null);
      return;
    }

    // Optimistic update
    const updatedPieces = localPieces.map((p) =>
      p.id === editingPieceId ? { ...p, name: newName } : p
    );
    setLocalPieces(updatedPieces);
    setEditingPieceId(null);

    if (onPieceChange) onPieceChange(updatedPieces);

    // Save to database in background
    savePieceNameToDatabase(editingPieceId, newName, originalPiece?.name || '');
  };

  const savePieceNameToDatabase = async (pieceId: string, newName: string, oldName: string) => {
    try {
      const { error } = await supabase
        .from('media_pieces')
        .update({ name: newName })
        .eq('id', pieceId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating piece:', error);
      
      // Revert on error
      const revertedPieces = localPieces.map((p) =>
        p.id === pieceId ? { ...p, name: oldName } : p
      );
      setLocalPieces(revertedPieces);
      if (onPieceChange) onPieceChange(revertedPieces);

      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao atualizar nome da peça.",
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

  const handleCreateFromEmptyRow = async (key: string, name: string) => {
    if (!name.trim() || !projectId) return;

    // Pegar a última categoria VISÍVEL no grid
    const categoryKeys = Object.keys(groupedPieces);
    if (categoryKeys.length === 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não há categorias disponíveis.",
      });
      return;
    }
    
    const lastVisibleCategoryName = categoryKeys[categoryKeys.length - 1];
    const lastCategoryPieces = groupedPieces[lastVisibleCategoryName];
    const lastVisiblePiece = lastCategoryPieces[lastCategoryPieces.length - 1];
    
    if (!lastVisiblePiece) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível determinar a categoria.",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('media_pieces')
        .insert([{
          project_id: projectId,
          category_id: lastVisiblePiece.category_id,
          name: name.trim(),
          channel: '',
          media_type: 'online',
          piece_type: '',
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
        }])
        .select()
        .single();

      if (error) throw error;

      // Clear empty row
      setEmptyRows(prev => {
        const newRows = { ...prev };
        delete newRows[key];
        return newRows;
      });

      // Add to local state
      if (data && onPieceChange) {
        const newPiece: MediaPiece = { 
          ...data as any, 
          category_name: lastVisibleCategoryName 
        };
        const updatedPieces = [...localPieces, newPiece];
        setLocalPieces(updatedPieces);
        onPieceChange(updatedPieces);
      }
    } catch (error) {
      console.error('Error creating piece:', error);
      toast({
        title: "Erro ao criar peça",
        description: "Não foi possível criar a peça de mídia.",
        variant: "destructive",
      });
    }
  };

  const handleEmptyRowKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, key: string) => {
    if (e.key === 'Enter') {
      const value = emptyRows[key];
      if (value?.trim()) {
        handleCreateFromEmptyRow(key, value);
      }
    }
  };

  const handleDuplicate = async (piece: MediaPiece) => {
    try {
      const { id, category_name, ...data } = piece;
      const { data: newData, error } = await supabase
        .from('media_pieces')
        .insert([{ 
          ...data,
          name: `${data.name} (cópia)`,
        }])
        .select()
        .single();

      if (error) throw error;

      if (newData && onPieceChange) {
        const newPiece: MediaPiece = { 
          ...newData as any, 
          category_name: piece.category_name 
        };
        const updatedPieces = [...localPieces, newPiece];
        setLocalPieces(updatedPieces);
        onPieceChange(updatedPieces);
      }

      toast({
        title: "Sucesso",
        description: "Peça duplicada com sucesso.",
      });
    } catch (error) {
      console.error('Error duplicating piece:', error);
      toast({
        title: "Erro ao duplicar",
        description: "Não foi possível duplicar a peça.",
        variant: "destructive",
      });
    }
  };

  const handleAddBelow = async (piece: MediaPiece) => {
    if (!projectId) return;

    try {
      const { data, error } = await supabase
        .from('media_pieces')
        .insert([{
          project_id: projectId,
          category_id: piece.category_id,
          name: 'Nova peça',
          channel: '',
          media_type: 'online',
          piece_type: '',
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
        }])
        .select()
        .single();

      if (error) throw error;

      if (data && onPieceChange) {
        const newPiece: MediaPiece = { 
          ...data as any, 
          category_name: piece.category_name 
        };
        
        // Inserir logo após a peça selecionada no array
        const pieceIndex = localPieces.findIndex(p => p.id === piece.id);
        const updatedPieces = [
          ...localPieces.slice(0, pieceIndex + 1),
          newPiece,
          ...localPieces.slice(pieceIndex + 1)
        ];
        
        setLocalPieces(updatedPieces);
        onPieceChange(updatedPieces);
        
        // Entrar automaticamente em modo de edição do nome
        setEditingPieceId(newPiece.id);
        setEditingValue(newPiece.name);
      }
    } catch (error) {
      console.error('Error creating piece:', error);
      toast({
        title: "Erro ao criar peça",
        description: "Não foi possível criar a peça de mídia.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (pieceId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta peça?')) return;

    try {
      // Optimistic update
      const updatedPieces = localPieces.filter((p) => p.id !== pieceId);
      setLocalPieces(updatedPieces);
      if (onPieceChange) onPieceChange(updatedPieces);

      const { error } = await supabase
        .from('media_pieces')
        .delete()
        .eq('id', pieceId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Peça deletada com sucesso.",
      });
    } catch (error) {
      console.error('Error deleting piece:', error);
      
      // Revert on error
      setLocalPieces(pieces);
      if (onPieceChange) onPieceChange(pieces);

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

  const handleDetailsDialogUpdate = async () => {
    setEditDialogOpen(false);
    
    // Reload pieces from database
    if (projectId) {
      try {
        const monthStart = format(startDate, 'yyyy-MM-dd');
        const monthEnd = format(endDate, 'yyyy-MM-dd');

        const { data: piecesData, error } = await supabase
          .from("media_pieces")
          .select(`
            *,
            category:media_categories(name)
          `)
          .eq("project_id", projectId)
          .or(`start_date.lte.${monthEnd},end_date.gte.${monthStart}`);

        if (error) throw error;

        const formattedPieces: MediaPiece[] = (piecesData || []).map((piece: any) => ({
          ...piece,
          category_name: piece.category?.name || 'Sem Categoria',
        }));

        setLocalPieces(formattedPieces);
        if (onPieceChange) onPieceChange(formattedPieces);
      } catch (error) {
        console.error('Error reloading pieces:', error);
      }
    }
  };

  // Cell editing handlers
  const handleCellClick = (pieceId: string, date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const currentQty = getTotalInsertionsForDate(pieceId, date);
    setEditingCell({ pieceId, date: dateStr });
    setEditingCellValue(currentQty > 0 ? currentQty.toString() : '');
  };

  useEffect(() => {
    if (editingCell && cellInputRef.current) {
      cellInputRef.current.focus();
      cellInputRef.current.select();
    }
  }, [editingCell]);

  const handleSaveCell = async () => {
    if (!editingCell) return;

    const newQty = parseInt(editingCellValue) || 0;
    const { pieceId, date: dateStr } = editingCell;
    const date = new Date(dateStr);
    
    const currentQty = getTotalInsertionsForDate(pieceId, date);
    if (newQty === currentQty) {
      setEditingCell(null);
      return;
    }

    // Optimistic update
    const existingInsertion = localInsertions.find(
      (ins) => ins.media_piece_id === pieceId && ins.insertion_date === dateStr
    );

    let updatedInsertions: MediaInsertion[];

    if (newQty === 0 && existingInsertion) {
      // Remove insertion
      updatedInsertions = localInsertions.filter((ins) => ins.id !== existingInsertion.id);
    } else if (existingInsertion) {
      // Update quantity
      updatedInsertions = localInsertions.map((ins) =>
        ins.id === existingInsertion.id ? { ...ins, quantity: newQty } : ins
      );
    } else if (newQty > 0) {
      // Create new insertion with temporary ID
      const tempInsertion: MediaInsertion = {
        id: `temp-${Date.now()}`,
        media_piece_id: pieceId,
        insertion_date: dateStr,
        quantity: newQty,
        actual_cost: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      updatedInsertions = [...localInsertions, tempInsertion];
    } else {
      updatedInsertions = localInsertions;
    }

    setLocalInsertions(updatedInsertions);
    setEditingCell(null);

    if (onInsertionChange) onInsertionChange(updatedInsertions);

    // Save to database in background
    saveInsertionToDatabase(pieceId, dateStr, newQty, existingInsertion, updatedInsertions);
  };

  const saveInsertionToDatabase = async (
    pieceId: string,
    dateStr: string,
    newQty: number,
    existingInsertion: MediaInsertion | undefined,
    optimisticInsertions: MediaInsertion[]
  ) => {
    try {
      if (newQty === 0 && existingInsertion) {
        // Delete
        const { error } = await supabase
          .from('media_insertions')
          .delete()
          .eq('id', existingInsertion.id);

        if (error) throw error;
      } else if (existingInsertion) {
        // Update
        const { error } = await supabase
          .from('media_insertions')
          .update({ quantity: newQty })
          .eq('id', existingInsertion.id);

        if (error) throw error;
      } else if (newQty > 0) {
        // Insert
        const { data, error } = await supabase
          .from('media_insertions')
          .insert([{
            media_piece_id: pieceId,
            insertion_date: dateStr,
            quantity: newQty,
          }])
          .select()
          .single();

        if (error) throw error;

        // Replace temp ID with real ID
        if (data) {
          const finalInsertions = optimisticInsertions.map((ins) =>
            ins.media_piece_id === pieceId && ins.insertion_date === dateStr && ins.id.startsWith('temp-')
              ? data
              : ins
          );
          setLocalInsertions(finalInsertions);
          if (onInsertionChange) onInsertionChange(finalInsertions);
        }
      }
    } catch (error: any) {
      console.error('Error saving insertion:', error);

      // Revert on error
      setLocalInsertions(insertions);
      if (onInsertionChange) onInsertionChange(insertions);

      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao salvar inserção.",
      });
    }
  };

  const handleCellKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveCell();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
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
                      <ContextMenuItem onClick={() => handleAddBelow(piece)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar linha abaixo
                      </ContextMenuItem>
                      <ContextMenuSeparator />
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
                      const dateStr = format(date, 'yyyy-MM-dd');
                      const isActive = isPieceActiveOnDate(piece, date);
                      const totalInsertions = getTotalInsertionsForDate(piece.id, date);
                      const isEditing = editingCell?.pieceId === piece.id && editingCell?.date === dateStr;

                      return (
                        <div
                          key={date.toISOString()}
                          onClick={() => !isEditing && isActive && handleCellClick(piece.id, date)}
                          className={cn(
                            "w-[26px] h-[26px] flex-shrink-0 border-r border-border flex items-center justify-center",
                            "transition-colors",
                            isActive && !isEditing && "cursor-pointer",
                            isActive ? 'bg-primary/5' : 'bg-muted/20',
                            totalInsertions > 0 && !isEditing && 'bg-primary/30 font-semibold border-2 border-primary/50',
                            isActive && !isEditing && 'hover:bg-primary/40'
                          )}
                        >
                          {isEditing ? (
                            <Input
                              ref={cellInputRef}
                              type="number"
                              value={editingCellValue}
                              onChange={(e) => setEditingCellValue(e.target.value)}
                              onKeyDown={handleCellKeyDown}
                              onBlur={handleSaveCell}
                              className="w-full h-full text-xs text-center p-0 border-none focus-visible:ring-1 focus-visible:ring-primary"
                              min="0"
                            />
                          ) : (
                            totalInsertions > 0 && (
                              <span className="text-xs">{totalInsertions}</span>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Single empty row at the end for adding new pieces */}
          {pieces.length > 0 && (
            <div className="flex border-b border-border hover:bg-muted/20">
              <div className="sticky left-0 z-10 bg-background border-r border-border">
                <div className="w-64 py-[5px] px-2 flex items-center">
                  <Input
                    value={emptyRows['__global__'] || ''}
                    onChange={(e) => setEmptyRows(prev => ({ ...prev, '__global__': e.target.value }))}
                    onKeyDown={(e) => handleEmptyRowKeyDown(e, '__global__')}
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
          )}

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
        onUpdate={handleDetailsDialogUpdate}
      />
    </Card>
  );
}
