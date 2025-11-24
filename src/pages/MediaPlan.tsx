import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Plus, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaPlanGanttChart } from "@/components/media/MediaPlanGanttChart";
import { MediaPieceForm } from "@/components/media/MediaPieceForm";
import { MediaBudgetPanel } from "@/components/media/MediaBudgetPanel";
import { InsertionDialog } from "@/components/media/InsertionDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';

export default function MediaPlan() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [project, setProject] = useState<any>(null);
  const [pieces, setPieces] = useState<any[]>([]);
  const [insertions, setInsertions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showPieceForm, setShowPieceForm] = useState(false);
  const [showInsertionDialog, setShowInsertionDialog] = useState(false);
  const [selectedPiece, setSelectedPiece] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id, currentMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load project
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("media_categories")
        .select("*")
        .eq("is_active", true)
        .order("order_index");

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Load pieces for current month
      const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      const { data: piecesData, error: piecesError } = await supabase
        .from("media_pieces")
        .select(`
          *,
          category:media_categories(name)
        `)
        .eq("project_id", id)
        .or(`start_date.lte.${monthEnd},end_date.gte.${monthStart}`);

      if (piecesError) throw piecesError;

      const formattedPieces = (piecesData || []).map((piece: any) => ({
        ...piece,
        category_name: piece.category?.name || 'Sem Categoria',
      }));

      setPieces(formattedPieces);

      // Load insertions for current month
      const { data: insertionsData, error: insertionsError } = await supabase
        .from("media_insertions")
        .select("*")
        .in("media_piece_id", formattedPieces.map((p: any) => p.id))
        .gte("insertion_date", monthStart)
        .lte("insertion_date", monthEnd);

      if (insertionsError) throw insertionsError;
      setInsertions(insertionsData || []);
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do plano de mídia",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = (pieceId: string, date: Date) => {
    const piece = pieces.find((p) => p.id === pieceId);
    if (!piece) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    const pieceInsertions = insertions.filter(
      (ins) => ins.media_piece_id === pieceId && ins.insertion_date === dateStr
    );
    const totalQuantity = pieceInsertions.reduce((sum, ins) => sum + ins.quantity, 0);

    setSelectedPiece(piece);
    setSelectedDate(date);
    setShowInsertionDialog(true);
  };

  const handleExportExcel = () => {
    try {
      // Prepare data for export
      const exportData = pieces.map((piece) => {
        const row: any = {
          Categoria: piece.category_name,
          'Tipo de Mídia': piece.media_type,
          'Nome da Peça': piece.name,
          Canal: piece.channel,
          Horário: piece.schedule_time || '-',
          'Tipo de Peça': piece.piece_type,
          'Data Início': format(new Date(piece.start_date), 'dd/MM/yyyy'),
          'Data Fim': format(new Date(piece.end_date), 'dd/MM/yyyy'),
          'Custo/Inserção': piece.cost_per_insertion || 0,
          'Custo Global': piece.global_cost || 0,
        };

        // Add insertions for each day
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const dateStr = format(monthStart, 'yyyy-MM-dd');
        
        let currentDate = monthStart;
        while (currentDate <= monthEnd) {
          const dayStr = format(currentDate, 'dd/MM');
          const insertionDate = format(currentDate, 'yyyy-MM-dd');
          const dayInsertions = insertions.filter(
            (ins) => ins.media_piece_id === piece.id && ins.insertion_date === insertionDate
          );
          const totalQty = dayInsertions.reduce((sum, ins) => sum + ins.quantity, 0);
          row[dayStr] = totalQty || '';
          currentDate = addMonths(currentDate, 0);
          currentDate.setDate(currentDate.getDate() + 1);
        }

        return row;
      });

      // Create workbook
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Plano de Mídia');

      // Export
      const fileName = `plano_midia_${project?.name}_${format(currentMonth, 'yyyy_MM')}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Exportado!",
        description: "Plano de mídia exportado com sucesso.",
      });
    } catch (error: any) {
      console.error("Error exporting:", error);
      toast({
        title: "Erro",
        description: "Erro ao exportar plano de mídia",
        variant: "destructive",
      });
    }
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/projects")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Plano de Mídia
            </h1>
            <p className="text-muted-foreground">
              {project?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleExportExcel} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
          <Button onClick={() => setShowPieceForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Peça de Mídia
          </Button>
        </div>
      </div>

      {/* Month Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Gantt Chart */}
        <div className="lg:col-span-3">
          <MediaPlanGanttChart
            pieces={pieces}
            insertions={insertions}
            startDate={startOfMonth(currentMonth)}
            endDate={endOfMonth(currentMonth)}
            onCellClick={handleCellClick}
          />
        </div>

        {/* Budget Panel */}
        <div className="lg:col-span-1">
          <MediaBudgetPanel projectId={id!} currentMonth={currentMonth} />
        </div>
      </div>

      {/* Dialogs */}
      <MediaPieceForm
        open={showPieceForm}
        onOpenChange={setShowPieceForm}
        projectId={id!}
        onSuccess={loadData}
      />

      {selectedPiece && (
        <InsertionDialog
          open={showInsertionDialog}
          onOpenChange={setShowInsertionDialog}
          pieceId={selectedPiece.id}
          pieceName={selectedPiece.name}
          date={selectedDate}
          currentQuantity={
            insertions
              .filter(
                (ins) =>
                  ins.media_piece_id === selectedPiece.id &&
                  ins.insertion_date === format(selectedDate, 'yyyy-MM-dd')
              )
              .reduce((sum, ins) => sum + ins.quantity, 0)
          }
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
