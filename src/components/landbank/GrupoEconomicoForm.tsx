import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CNPJLookup } from "./CNPJLookup";
import { CEPLookup } from "./CEPLookup";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const grupoEconomicoSchema = z.object({
  razao_social: z.string().trim().min(1, "Razão social é obrigatória").max(200),
  nome_comercial: z.string().trim().min(1, "Nome comercial é obrigatório").max(200),
  cnpj: z.string().min(14, "CNPJ inválido"),
  email: z.string().email("Email inválido").max(255),
  phone: z.string().trim().min(10, "Telefone inválido").max(20),
  responsavel_legal: z.string().trim().min(1, "Responsável legal é obrigatório").max(200),
  cep: z.string().optional(),
  logradouro: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
});

interface GrupoEconomicoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const GrupoEconomicoForm = ({ open, onOpenChange, onSuccess }: GrupoEconomicoFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    razao_social: "",
    nome_comercial: "",
    cnpj: "",
    email: "",
    phone: "",
    responsavel_legal: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
  });

  const handleCNPJDataFetched = (data: any) => {
    setFormData(prev => ({
      ...prev,
      razao_social: data.razao_social || prev.razao_social,
      nome_comercial: data.nome_fantasia || prev.nome_comercial,
      cep: data.cep || prev.cep,
      logradouro: data.logradouro || prev.logradouro,
      numero: data.numero || prev.numero,
      complemento: data.complemento || prev.complemento,
      bairro: data.bairro || prev.bairro,
      cidade: data.municipio || prev.cidade,
      estado: data.uf || prev.estado,
    }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = grupoEconomicoSchema.safeParse(formData);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('companies').insert([{
        name: formData.nome_comercial,
        razao_social: formData.razao_social,
        nome_comercial: formData.nome_comercial,
        cnpj: formData.cnpj.replace(/\D/g, ''),
        email: formData.email,
        phone: formData.phone,
        responsavel_legal: formData.responsavel_legal,
        cep: formData.cep.replace(/\D/g, ''),
        logradouro: formData.logradouro,
        numero: formData.numero,
        complemento: formData.complemento,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado,
        status: 'active',
      }]);

      if (error) throw error;

      toast.success("Grupo econômico cadastrado com sucesso!");
      onSuccess();
      onOpenChange(false);
      setFormData({
        razao_social: "",
        nome_comercial: "",
        cnpj: "",
        email: "",
        phone: "",
        responsavel_legal: "",
        cep: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
      });
    } catch (error) {
      console.error('Erro ao criar grupo econômico:', error);
      toast.error("Erro ao criar grupo econômico");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Grupo Econômico</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label>CNPJ *</Label>
              <CNPJLookup
                value={formData.cnpj}
                onChange={(value) => setFormData(prev => ({ ...prev, cnpj: value }))}
                onDataFetched={handleCNPJDataFetched}
              />
            </div>

            <div>
              <Label>Razão Social *</Label>
              <Input
                value={formData.razao_social}
                onChange={(e) => setFormData(prev => ({ ...prev, razao_social: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label>Nome Comercial *</Label>
              <Input
                value={formData.nome_comercial}
                onChange={(e) => setFormData(prev => ({ ...prev, nome_comercial: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label>Telefone *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Responsável Legal *</Label>
              <Input
                value={formData.responsavel_legal}
                onChange={(e) => setFormData(prev => ({ ...prev, responsavel_legal: e.target.value }))}
                required
              />
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
