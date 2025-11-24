import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InsertionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pieceId: string;
  pieceName: string;
  date: Date;
  currentQuantity: number;
  onSuccess?: () => void;
}

export function InsertionDialog({
  open,
  onOpenChange,
  pieceId,
  pieceName,
  date,
  currentQuantity,
  onSuccess,
}: InsertionDialogProps) {
  const [quantity, setQuantity] = useState(currentQuantity);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setQuantity(currentQuantity);
  }, [currentQuantity, open]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');

      // Check if insertion already exists
      const { data: existing } = await supabase
        .from("media_insertions")
        .select("id")
        .eq("media_piece_id", pieceId)
        .eq("insertion_date", dateStr)
        .single();

      if (quantity === 0) {
        // Delete if quantity is 0
        if (existing) {
          const { error } = await supabase
            .from("media_insertions")
            .delete()
            .eq("id", existing.id);
          
          if (error) throw error;
        }
      } else {
        // Update or insert
        if (existing) {
          const { error } = await supabase
            .from("media_insertions")
            .update({ quantity })
            .eq("id", existing.id);
          
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("media_insertions")
            .insert({
              media_piece_id: pieceId,
              insertion_date: dateStr,
              quantity,
            });
          
          if (error) throw error;
        }
      }

      toast({
        title: "Inserção atualizada!",
        description: quantity === 0 
          ? "Inserção removida com sucesso."
          : `${quantity} inserção(ões) registrada(s).`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error saving insertion:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar inserção",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Inserções</DialogTitle>
          <DialogDescription>
            {pieceName} • {format(date, "dd/MM/yyyy")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade de inserções</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              placeholder="0"
            />
            <p className="text-xs text-muted-foreground">
              Digite 0 para remover a inserção
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
