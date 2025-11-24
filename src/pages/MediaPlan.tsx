import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth, addMonths, subMonths, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Plus, Download, ChevronLeft, ChevronRight, Calendar as CalendarIcon, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaPlanGanttChart } from "@/components/media/MediaPlanGanttChart";
import { MediaPieceForm } from "@/components/media/MediaPieceForm";
import { InsertionDialog } from "@/components/media/InsertionDialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [budgetData, setBudgetData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Calculate effective date range for Gantt
  const effectiveStartDate = customStartDate || startOfMonth(currentMonth);
  const effectiveEndDate = customEndDate || endOfMonth(currentMonth);

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

      // Load pieces for effective date range
      const monthStart = format(effectiveStartDate, 'yyyy-MM-dd');
      const monthEnd = format(effectiveEndDate, 'yyyy-MM-dd');

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

      // Load budget data
      const monthStartForBudget = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const { data: budgetInfo, error: budgetError } = await supabase
        .from("media_budgets")
        .select("*")
        .eq("project_id", id)
        .eq("month_year", monthStartForBudget)
        .single();

      if (budgetError && budgetError.code !== 'PGRST116') {
        throw budgetError;
      }

      setBudgetData(budgetInfo || {
        month_year: monthStartForBudget,
        budgeted_amount: 0,
        actual_amount: 0,
      });
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

  const handleResetDateFilter = () => {
    setCustomStartDate(undefined);
    setCustomEndDate(undefined);
  };

  // Calculate budget metrics
  const percentageUsed = budgetData?.budgeted_amount > 0
    ? (budgetData.actual_amount / budgetData.budgeted_amount) * 100
    : 0;
  const isOverBudget = budgetData && budgetData.actual_amount > budgetData.budgeted_amount;
  const remaining = budgetData ? budgetData.budgeted_amount - budgetData.actual_amount : 0;

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

      {/* Period Filter and Month Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
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

            {/* Period Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filtrar período:</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {customStartDate ? format(customStartDate, 'dd/MM/yyyy') : 'Data início'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    {customEndDate ? format(customEndDate, 'dd/MM/yyyy') : 'Data fim'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>

              {(customStartDate || customEndDate) && (
                <Button variant="ghost" size="sm" onClick={handleResetDateFilter}>
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Budget Summary */}
      {budgetData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Orçado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {budgetData.budgeted_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Realizado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", isOverBudget && "text-destructive")}>
                R$ {budgetData.actual_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {isOverBudget ? 'Acima do orçamento' : 'Restante'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", isOverBudget ? "text-destructive" : "text-primary")}>
                R$ {Math.abs(remaining).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Utilização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className={cn("text-2xl font-bold", isOverBudget && "text-destructive")}>
                  {percentageUsed.toFixed(1)}%
                </div>
                <Progress 
                  value={Math.min(percentageUsed, 100)} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alert if over budget */}
      {isOverBudget && (
        <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-destructive mb-1">
              Orçamento ultrapassado
            </p>
            <p className="text-xs text-destructive/80">
              O valor realizado está R$ {Math.abs(remaining).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} acima do orçado para {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}.
            </p>
          </div>
        </div>
      )}

      {/* Gantt Chart */}
      <MediaPlanGanttChart
        pieces={pieces}
        insertions={insertions}
        startDate={effectiveStartDate}
        endDate={effectiveEndDate}
        onCellClick={handleCellClick}
      />

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
