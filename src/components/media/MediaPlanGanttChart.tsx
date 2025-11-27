import { useState, useEffect } from "react";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

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
  onCellClick?: (pieceId: string, date: Date) => void;
}

export function MediaPlanGanttChart({ 
  pieces, 
  insertions, 
  startDate, 
  endDate,
  onCellClick 
}: MediaPlanGanttChartProps) {
  const [groupedPieces, setGroupedPieces] = useState<Record<string, MediaPiece[]>>({});
  const [dateRange, setDateRange] = useState<Date[]>([]);

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
                <HoverCard key={piece.id} openDelay={200}>
                  <div className="flex border-b border-border hover:bg-muted/30">
                    <HoverCardTrigger asChild>
                      <div className="sticky left-0 z-10 bg-background border-r border-border cursor-pointer">
                        <div className="w-64 p-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge 
                              variant={piece.media_type === 'online' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {piece.media_type}
                            </Badge>
                            <span className="text-xs font-medium">{piece.name}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {piece.channel}
                            {piece.schedule_time && ` • ${piece.schedule_time}`}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {piece.piece_type}
                          </div>
                        </div>
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent side="right" align="start" className="w-80">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-sm mb-2">{piece.name}</h4>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">📺 Canal:</span>
                              <span className="font-medium">{piece.channel}</span>
                            </div>
                            {piece.schedule_time && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">🕐 Horário:</span>
                                <span className="font-medium">{piece.schedule_time}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">📡 Tipo:</span>
                              <span className="font-medium capitalize">{piece.media_type}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">🎬 Peça:</span>
                              <span className="font-medium">{piece.piece_type}</span>
                            </div>
                            {piece.cost_per_insertion && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">💰 Custo/Inserção:</span>
                                <span className="font-medium">R$ {piece.cost_per_insertion.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                            )}
                            {piece.global_cost && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">💵 Custo Global:</span>
                                <span className="font-medium">R$ {piece.global_cost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 pt-1 border-t border-border">
                              <span className="text-muted-foreground">📅 Período:</span>
                              <span className="font-medium">
                                {format(new Date(piece.start_date), "dd/MM/yyyy", { locale: ptBR })} - {format(new Date(piece.end_date), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-border">
                          <div className="text-xs font-medium">
                            Total de inserções: {insertions.filter(ins => ins.media_piece_id === piece.id).reduce((sum, ins) => sum + ins.quantity, 0)}
                          </div>
                        </div>
                      </div>
                    </HoverCardContent>

                    {/* Date cells */}
                    <div className="flex">
                      {dateRange.map((date) => {
                        const isActive = isPieceActiveOnDate(piece, date);
                        const totalInsertions = getTotalInsertionsForDate(piece.id, date);

                        return (
                          <div
                            key={date.toISOString()}
                            className={`
                              w-[26px] h-12 flex-shrink-0 border-r border-border flex items-center justify-center
                              cursor-pointer transition-colors
                              ${isActive ? 'bg-primary/5' : 'bg-muted/20'}
                              ${totalInsertions > 0 ? 'bg-primary/30 font-semibold border-2 border-primary/50' : ''}
                              hover:bg-primary/40
                            `}
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
                </HoverCard>
              ))}
            </div>
          ))}

          {pieces.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma peça de mídia cadastrada
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}
