import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface ContaReceber {
  id: string;
  lote_id: string;
  projeto_id: string;
  base_cobranca: string;
  valor_cobranca: number;
  tipo_cobranca: string;
  data_cobranca: string;
  dia_pagamento: number;
  dia_emissao_nota: number;
  contato_nome: string;
  contato_email: string;
  contato_telefone: string;
  descricao: string;
  status: string;
  projects: {
    name: string;
  };
}

interface ContasReceberEditDialogProps {
  conta: ContaReceber;
  onClose: () => void;
  onSuccess: () => void;
}

const ContasReceberEditDialog = ({
  conta,
  onClose,
  onSuccess,
}: ContasReceberEditDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    valor_cobranca: conta.valor_cobranca.toString(),
    tipo_cobranca: conta.tipo_cobranca,
    dia_pagamento: conta.dia_pagamento.toString(),
    dia_emissao_nota: conta.dia_emissao_nota.toString(),
    contato_nome: conta.contato_nome,
    contato_email: conta.contato_email,
    contato_telefone: conta.contato_telefone,
    descricao: conta.descricao || "",
    status: conta.status,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("contas_receber")
        .update({
          valor_cobranca: parseFloat(formData.valor_cobranca),
          tipo_cobranca: formData.tipo_cobranca,
          dia_pagamento: parseInt(formData.dia_pagamento),
          dia_emissao_nota: parseInt(formData.dia_emissao_nota),
          contato_nome: formData.contato_nome,
          contato_email: formData.contato_email,
          contato_telefone: formData.contato_telefone,
          descricao: formData.descricao,
          status: formData.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conta.id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Conta a receber atualizada com sucesso",
      });

      onSuccess();
    } catch (error) {
      console.error("Erro ao atualizar conta:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar conta a receber",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Conta a Receber</DialogTitle>
          <DialogDescription>
            {conta.projects.name} • {new Date(conta.data_cobranca).toLocaleDateString("pt-BR")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Valor e Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor da Cobrança</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                value={formData.valor_cobranca}
                onChange={(e) =>
                  handleInputChange("valor_cobranca", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Cobrança</Label>
              <Select
                value={formData.tipo_cobranca}
                onValueChange={(value) =>
                  handleInputChange("tipo_cobranca", value)
                }
              >
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pre-pago">Pré-pago</SelectItem>
                  <SelectItem value="pos-pago">Pós-pago</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dias */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="diaPagamento">Dia do Mês para Pagamento</Label>
              <Input
                id="diaPagamento"
                type="number"
                min="1"
                max="31"
                value={formData.dia_pagamento}
                onChange={(e) =>
                  handleInputChange("dia_pagamento", e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diaEmissao">Dia do Mês para Emitir Nota</Label>
              <Input
                id="diaEmissao"
                type="number"
                min="1"
                max="31"
                value={formData.dia_emissao_nota}
                onChange={(e) =>
                  handleInputChange("dia_emissao_nota", e.target.value)
                }
              />
            </div>
          </div>

          {/* Contato */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold">Dados de Contato</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  value={formData.contato_nome}
                  onChange={(e) =>
                    handleInputChange("contato_nome", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.contato_email}
                  onChange={(e) =>
                    handleInputChange("contato_email", e.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.contato_telefone}
                onChange={(e) =>
                  handleInputChange("contato_telefone", e.target.value)
                }
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleInputChange("status", value)}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="emitida">Emitida</SelectItem>
                <SelectItem value="paga">Paga</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) =>
                handleInputChange("descricao", e.target.value)
              }
              rows={3}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContasReceberEditDialog;
