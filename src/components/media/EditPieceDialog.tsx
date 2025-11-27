import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
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
}

interface EditPieceDialogProps {
  piece: MediaPiece | null;
  categories: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function EditPieceDialog({ piece, categories, open, onOpenChange, onUpdate }: EditPieceDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<MediaPiece>>({});

  useEffect(() => {
    if (open && piece) {
      setFormData({
        name: piece.name,
        category_id: piece.category_id,
        channel: piece.channel,
        schedule_time: piece.schedule_time || '',
        media_type: piece.media_type,
        piece_type: piece.piece_type,
        cost_per_insertion: piece.cost_per_insertion,
        global_cost: piece.global_cost,
        start_date: piece.start_date,
        end_date: piece.end_date,
      });
    }
  }, [open, piece]);

  const handleSave = async () => {
    if (!piece) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('media_pieces')
        .update(formData)
        .eq('id', piece.id);

      if (error) throw error;

      toast({
        title: "Peça atualizada",
        description: "As alterações foram salvas com sucesso.",
      });

      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating piece:', error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Peça de Mídia</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nome</Label>
            <Input
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Canal</Label>
              <Input
                value={formData.channel || ''}
                onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Horário</Label>
              <Input
                value={formData.schedule_time || ''}
                onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                placeholder="Ex: 20h"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Mídia</Label>
              <Select
                value={formData.media_type}
                onValueChange={(value: 'online' | 'offline') => setFormData({ ...formData, media_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Peça</Label>
              <Input
                value={formData.piece_type || ''}
                onChange={(e) => setFormData({ ...formData, piece_type: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Custo por Inserção</Label>
              <Input
                type="number"
                value={formData.cost_per_insertion || ''}
                onChange={(e) => setFormData({ ...formData, cost_per_insertion: parseFloat(e.target.value) || undefined })}
              />
            </div>

            <div className="space-y-2">
              <Label>Custo Global</Label>
              <Input
                type="number"
                value={formData.global_cost || ''}
                onChange={(e) => setFormData({ ...formData, global_cost: parseFloat(e.target.value) || undefined })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data de Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.start_date ? format(new Date(formData.start_date), 'dd/MM/yyyy') : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.start_date ? new Date(formData.start_date) : undefined}
                    onSelect={(date) => date && setFormData({ ...formData, start_date: format(date, 'yyyy-MM-dd') })}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data de Término</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.end_date ? format(new Date(formData.end_date), 'dd/MM/yyyy') : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.end_date ? new Date(formData.end_date) : undefined}
                    onSelect={(date) => date && setFormData({ ...formData, end_date: format(date, 'yyyy-MM-dd') })}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
