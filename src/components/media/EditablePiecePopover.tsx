import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface EditablePiecePopoverProps {
  piece: any;
  categories: any[];
  onUpdate: () => void;
  trigger: React.ReactNode;
}

export function EditablePiecePopover({ piece, categories, onUpdate, trigger }: EditablePiecePopoverProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const { toast } = useToast();

  useEffect(() => {
    if (open && piece) {
      setFormData({
        name: piece.name || '',
        channel: piece.channel || '',
        schedule_time: piece.schedule_time || '',
        media_type: piece.media_type || 'online',
        piece_type: piece.piece_type || '',
        cost_per_insertion: piece.cost_per_insertion || '',
        global_cost: piece.global_cost || '',
        start_date: piece.start_date || '',
        end_date: piece.end_date || '',
        category_id: piece.category_id || '',
      });
    }
  }, [open, piece]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('media_pieces')
        .update({
          name: formData.name,
          channel: formData.channel,
          schedule_time: formData.schedule_time || null,
          media_type: formData.media_type,
          piece_type: formData.piece_type,
          cost_per_insertion: formData.cost_per_insertion ? parseFloat(formData.cost_per_insertion) : null,
          global_cost: formData.global_cost ? parseFloat(formData.global_cost) : null,
          start_date: formData.start_date,
          end_date: formData.end_date,
          category_id: formData.category_id,
        })
        .eq('id', piece.id);

      if (error) throw error;

      toast({
        title: "Salvo!",
        description: "Peça de mídia atualizada com sucesso.",
      });

      setOpen(false);
      onUpdate();
    } catch (error: any) {
      console.error('Error updating piece:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar peça",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-96 p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Editar Peça</h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nome da Peça</Label>
              <Input
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-8 text-sm mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Categoria</Label>
              <Select 
                value={formData.category_id || ''} 
                onValueChange={(val) => setFormData({ ...formData, category_id: val })}
              >
                <SelectTrigger className="h-8 text-sm mt-1">
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

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Canal</Label>
                <Input
                  value={formData.channel || ''}
                  onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                  className="h-8 text-sm mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Horário</Label>
                <Input
                  value={formData.schedule_time || ''}
                  onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                  className="h-8 text-sm mt-1"
                  placeholder="Ex: 20h30"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Tipo de Mídia</Label>
                <Select 
                  value={formData.media_type || 'online'} 
                  onValueChange={(val) => setFormData({ ...formData, media_type: val })}
                >
                  <SelectTrigger className="h-8 text-sm mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Tipo de Peça</Label>
                <Input
                  value={formData.piece_type || ''}
                  onChange={(e) => setFormData({ ...formData, piece_type: e.target.value })}
                  className="h-8 text-sm mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Custo/Inserção</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.cost_per_insertion || ''}
                  onChange={(e) => setFormData({ ...formData, cost_per_insertion: e.target.value })}
                  className="h-8 text-sm mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Custo Global</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.global_cost || ''}
                  onChange={(e) => setFormData({ ...formData, global_cost: e.target.value })}
                  className="h-8 text-sm mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Data Início</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-8 justify-start text-left font-normal text-sm mt-1 w-full",
                        !formData.start_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {formData.start_date ? format(new Date(formData.start_date), "dd/MM/yyyy") : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.start_date ? new Date(formData.start_date) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setFormData({ ...formData, start_date: format(date, 'yyyy-MM-dd') });
                        }
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label className="text-xs">Data Fim</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "h-8 justify-start text-left font-normal text-sm mt-1 w-full",
                        !formData.end_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3 w-3" />
                      {formData.end_date ? format(new Date(formData.end_date), "dd/MM/yyyy") : "Selecione"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.end_date ? new Date(formData.end_date) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setFormData({ ...formData, end_date: format(date, 'yyyy-MM-dd') });
                        }
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={loading}
            >
              <Save className="h-3 w-3 mr-1" />
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
