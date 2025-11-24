import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface MediaPieceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess?: () => void;
  editData?: any;
}

export function MediaPieceForm({ 
  open, 
  onOpenChange, 
  projectId,
  onSuccess,
  editData 
}: MediaPieceFormProps) {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      category_id: editData?.category_id || "",
      media_type: editData?.media_type || "online",
      name: editData?.name || "",
      channel: editData?.channel || "",
      schedule_time: editData?.schedule_time || "",
      piece_type: editData?.piece_type || "",
      cost_per_insertion: editData?.cost_per_insertion || "",
      global_cost: editData?.global_cost || "",
      start_date: editData?.start_date ? new Date(editData.start_date) : new Date(),
      end_date: editData?.end_date ? new Date(editData.end_date) : new Date(),
    },
  });

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (editData) {
      form.reset({
        category_id: editData.category_id || "",
        media_type: editData.media_type || "online",
        name: editData.name || "",
        channel: editData.channel || "",
        schedule_time: editData.schedule_time || "",
        piece_type: editData.piece_type || "",
        cost_per_insertion: editData.cost_per_insertion || "",
        global_cost: editData.global_cost || "",
        start_date: editData.start_date ? new Date(editData.start_date) : new Date(),
        end_date: editData.end_date ? new Date(editData.end_date) : new Date(),
      });
    }
  }, [editData, form]);

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from("media_categories")
      .select("*")
      .eq("is_active", true)
      .order("order_index");

    if (error) {
      console.error("Error loading categories:", error);
      return;
    }

    setCategories(data || []);
  };

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        project_id: projectId,
        category_id: values.category_id,
        media_type: values.media_type,
        name: values.name,
        channel: values.channel,
        schedule_time: values.schedule_time || null,
        piece_type: values.piece_type,
        cost_per_insertion: values.cost_per_insertion ? parseFloat(values.cost_per_insertion) : null,
        global_cost: values.global_cost ? parseFloat(values.global_cost) : null,
        start_date: format(values.start_date, 'yyyy-MM-dd'),
        end_date: format(values.end_date, 'yyyy-MM-dd'),
      };

      let error;
      if (editData?.id) {
        const result = await supabase
          .from("media_pieces")
          .update(payload)
          .eq("id", editData.id);
        error = result.error;
      } else {
        const result = await supabase
          .from("media_pieces")
          .insert(payload);
        error = result.error;
      }

      if (error) throw error;

      toast({
        title: editData ? "Peça atualizada!" : "Peça criada!",
        description: `${values.name} foi ${editData ? "atualizada" : "adicionada"} com sucesso.`,
      });

      onOpenChange(false);
      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error("Error saving media piece:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar peça de mídia",
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
          <DialogTitle>
            {editData ? "Editar Peça de Mídia" : "Nova Peça de Mídia"}
          </DialogTitle>
          <DialogDescription>
            Preencha os dados da peça de mídia e o período de veiculação
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="media_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Mídia</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="offline">Offline</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Peça</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Banner Instagram" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="channel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canal</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Instagram, TV Globo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="schedule_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Horário (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 20h30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="piece_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Peça</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: estático, vt, carrossel, reel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cost_per_insertion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo por Inserção (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="global_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo Global (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Início</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Fim</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione a data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : editData ? "Atualizar" : "Criar Peça"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
