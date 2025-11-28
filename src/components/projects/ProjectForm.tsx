import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const projectSchema = z.object({
  name: z.string().trim().min(1, "Nome do projeto é obrigatório").max(200, "Nome deve ter no máximo 200 caracteres"),
  company_id: z.string().uuid("Selecione uma empresa"),
  status: z.string(),
  address: z.string().trim().max(500, "Endereço deve ter no máximo 500 caracteres").optional(),
  area: z.number().positive("Área deve ser maior que zero").optional(),
  description: z.string().trim().max(2000, "Descrição deve ter no máximo 2000 caracteres").optional(),
});

interface ProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  projectToEdit?: any;
}

export const ProjectForm = ({ open, onOpenChange, onSuccess, projectToEdit }: ProjectFormProps) => {
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    company_id: "",
    status: "viability",
    address: "",
    area: "",
    description: "",
  });

  const statusOptions = [
    { value: "viability", label: "Viabilidade" },
    { value: "project", label: "Projeto" },
    { value: "approvals", label: "Aprovações" },
    { value: "sales", label: "Vendas" },
    { value: "delivery", label: "Entrega" },
  ];

  useEffect(() => {
    if (open) {
      fetchCompanies();
      
      if (projectToEdit) {
        setFormData({
          name: projectToEdit.name || "",
          company_id: projectToEdit.company_id || "",
          status: projectToEdit.status || "viability",
          address: projectToEdit.address || "",
          area: projectToEdit.area?.toString() || "",
          description: projectToEdit.description || "",
        });
      } else {
        setFormData({
          name: "",
          company_id: "",
          status: "viability",
          address: "",
          area: "",
          description: "",
        });
      }
    }
  }, [open, projectToEdit]);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, nome_comercial, razao_social')
        .eq('status', 'active')
        .order('nome_comercial');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
      toast.error("Erro ao carregar empresas");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = projectSchema.safeParse({
      ...formData,
      area: formData.area ? parseFloat(formData.area) : undefined,
      address: formData.address || undefined,
      description: formData.description || undefined,
    });
    
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const dataToSave = {
        name: formData.name.trim(),
        company_id: formData.company_id,
        status: formData.status,
        address: formData.address.trim() || null,
        area: formData.area ? parseFloat(formData.area) : null,
        description: formData.description.trim() || null,
      };

      let error;
      
      if (projectToEdit) {
        const result = await supabase
          .from('projects')
          .update(dataToSave)
          .eq('id', projectToEdit.id);
        error = result.error;
      } else {
        const result = await supabase
          .from('projects')
          .insert([{ ...dataToSave, created_by: user.id }]);
        error = result.error;
      }

      if (error) throw error;

      toast.success(projectToEdit ? "Projeto atualizado com sucesso!" : "Projeto criado com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao salvar projeto:', error);
      toast.error(error.message || "Erro ao salvar projeto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{projectToEdit ? "Editar Projeto" : "Novo Projeto"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label>Empresa *</Label>
              <Select
                value={formData.company_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, company_id: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.nome_comercial || company.razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Nome do Projeto *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Residencial Jardim das Flores"
                maxLength={200}
                required
              />
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
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Endereço</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Rua, Número, Bairro, Cidade - Estado"
                maxLength={500}
              />
            </div>

            <div>
              <Label>Área Total (m²)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.area}
                onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                placeholder="Ex: 5000.00"
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva as características principais do projeto..."
                maxLength={2000}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.description.length}/2000 caracteres
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
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
