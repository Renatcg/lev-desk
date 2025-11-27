import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MediaPlanGanttChart } from "@/components/media/MediaPlanGanttChart";
import { startOfMonth, endOfMonth, format } from "date-fns";

interface MediaPiece {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  start_date: string;
  end_date: string;
  media_type: 'online' | 'offline';
  channel: string;
  piece_type: string;
  schedule_time?: string;
  cost_per_insertion?: number;
  global_cost?: number;
  project_id: string;
}

interface MediaInsertion {
  id: string;
  media_piece_id: string;
  insertion_date: string;
  quantity: number;
  actual_cost?: number | null;
}

interface MediaCategory {
  id: string;
  name: string;
  order_index: number;
}

const MediaPlanFullscreen = () => {
  const { id } = useParams();
  const [pieces, setPieces] = useState<MediaPiece[]>([]);
  const [insertions, setInsertions] = useState<MediaInsertion[]>([]);
  const [categories, setCategories] = useState<MediaCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));

  useEffect(() => {
    loadData();
  }, [id, startDate, endDate]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);

      const { data: categoriesData, error: categoriesError } = await supabase
        .from("media_categories")
        .select("*")
        .eq("is_active", true)
        .order("order_index");

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      const { data: piecesData, error: piecesError } = await supabase
        .from("media_pieces")
        .select(`
          *,
          category:media_categories(name)
        `)
        .eq("project_id", id)
        .gte("end_date", format(startDate, 'yyyy-MM-dd'))
        .lte("start_date", format(endDate, 'yyyy-MM-dd'))
        .order("start_date");

      if (piecesError) throw piecesError;

      const formattedPieces: MediaPiece[] = (piecesData || []).map((piece: any) => ({
        ...piece,
        category_name: piece.category?.name || 'Sem Categoria',
      }));
      setPieces(formattedPieces);

      if (formattedPieces && formattedPieces.length > 0) {
        const pieceIds = formattedPieces.map((p) => p.id);
        const { data: insertionsData, error: insertionsError } = await supabase
          .from("media_insertions")
          .select("*")
          .in("media_piece_id", pieceIds)
          .gte("insertion_date", format(startDate, 'yyyy-MM-dd'))
          .lte("insertion_date", format(endDate, 'yyyy-MM-dd'));

        if (insertionsError) throw insertionsError;
        setInsertions(insertionsData || []);
      }
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar plano de mídia");
    } finally {
      setLoading(false);
    }
  };

  const handleInsertionChange = (updatedInsertions: MediaInsertion[]) => {
    setInsertions(updatedInsertions);
  };

  const handlePieceChange = (updatedPieces: MediaPiece[]) => {
    setPieces(updatedPieces);
  };

  const handleDateRangeChange = (newStartDate: Date, newEndDate: Date) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen p-4 bg-background">
      <MediaPlanGanttChart
        pieces={pieces}
        insertions={insertions}
        startDate={startDate}
        endDate={endDate}
        categories={categories}
        onInsertionChange={handleInsertionChange}
        onPieceChange={handlePieceChange}
        projectId={id}
        isPopupMode={true}
        onDateRangeChange={handleDateRangeChange}
      />
    </div>
  );
};

export default MediaPlanFullscreen;
