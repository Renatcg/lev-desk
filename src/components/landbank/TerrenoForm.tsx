import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CEPLookup } from "./CEPLookup";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const terrenoSchema = z.object({
  nome: z.string().trim().min(1, "Nome do terreno é obrigatório").max(200),
  grupo_economico_id: z.string().uuid("Selecione um grupo econômico"),
  area: z.number().positive("Área deve ser maior que zero"),
  matricula: z.string().trim().optional(),
  status: z.string(),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

interface TerrenoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultGrupoId?: string;
}

export const TerrenoForm = ({ open, onOpenChange, onSuccess, defaultGrupoId }: TerrenoFormProps) => {
  const [loading, setLoading] = useState(false);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nome: "",
    grupo_economico_id: defaultGrupoId || "",
    area: "",
    status: "available",
    matricula: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  // Update grupo_economico_id when defaultGrupoId changes
  useEffect(() => {
    if (defaultGrupoId) {
      setFormData(prev => ({ ...prev, grupo_economico_id: defaultGrupoId }));
    }
  }, [defaultGrupoId]);

  useEffect(() => {
    if (open) {
      fetchGrupos();
    }
  }, [open]);

  const fetchGrupos = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, nome_comercial, razao_social')
        .eq('status', 'active')
        .order('nome_comercial');

      if (error) throw error;
      setGrupos(data || []);
    } catch (error) {
      console.error('Erro ao buscar grupos:', error);
      toast.error("Erro ao carregar grupos econômicos");
    }
  };

  const handleCEPDataFetched = (data: any) => {
    setFormData(prev => ({
      ...prev,
      logradouro: data.logradouro || prev.logradouro,
      complemento: data.complemento || prev.complemento,
      bairro: data.bairro || prev.bairro,
      cidade: data.cidade || prev.cidade,
      estado: data.estado || prev.estado,
    }));
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = terrenoSchema.safeParse({
      ...formData,
      area: parseFloat(formData.area),
    });
    
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('terrenos').insert([{
        nome: formData.nome,
        grupo_economico_id: formData.grupo_economico_id,
        area: parseFloat(formData.area),
        matricula: formData.matricula || null,
        status: formData.status,
        cep: formData.cep.replace(/\D/g, '') || null,
        logradouro: formData.logradouro || null,
        numero: formData.numero || null,
        complemento: formData.complemento || null,
        bairro: formData.bairro || null,
        cidade: formData.cidade || null,
        estado: formData.estado || null,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
      }]);

      if (error) throw error;

      toast.success("Terreno cadastrado com sucesso!");
      onSuccess();
      onOpenChange(false);
      setFormData({
        nome: "",
        grupo_economico_id: "",
        area: "",
        matricula: "",
        status: "available",
        cep: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
        latitude: undefined,
        longitude: undefined,
      });
    } catch (error) {
      console.error('Erro ao criar terreno:', error);
      toast.error("Erro ao criar terreno");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Terreno</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label>Grupo Econômico *</Label>
              <Select
                value={formData.grupo_economico_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, grupo_economico_id: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o grupo econômico" />
                </SelectTrigger>
                <SelectContent>
                  {grupos.map((grupo) => (
                    <SelectItem key={grupo.id} value={grupo.id}>
                      {grupo.nome_comercial || grupo.razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nome do Terreno *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Terreno Centro - Lote A"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Área (m²) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.area}
                  onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label>Matrícula</Label>
                <Input
                  value={formData.matricula}
                  onChange={(e) => setFormData(prev => ({ ...prev, matricula: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label>Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="negotiating">Negociando</SelectItem>
                  <SelectItem value="acquired">Adquirido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Endereço</h3>
              
              <div className="grid gap-4">
                <div>
                  <Label>CEP</Label>
                  <CEPLookup
                    value={formData.cep}
                    onChange={(value) => setFormData(prev => ({ ...prev, cep: value }))}
                    onDataFetched={handleCEPDataFetched}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <Label>Logradouro</Label>
                    <Input
                      value={formData.logradouro}
                      onChange={(e) => setFormData(prev => ({ ...prev, logradouro: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label>Número</Label>
                    <Input
                      value={formData.numero}
                      onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label>Complemento</Label>
                  <Input
                    value={formData.complemento}
                    onChange={(e) => setFormData(prev => ({ ...prev, complemento: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Bairro</Label>
                    <Input
                      value={formData.bairro}
                      onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label>Cidade</Label>
                    <Input
                      value={formData.cidade}
                      onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label>Estado</Label>
                    <Input
                      value={formData.estado}
                      onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
