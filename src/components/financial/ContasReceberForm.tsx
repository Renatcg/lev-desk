import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus } from "lucide-react";

interface GrupoEconomico {
  id: string;
  nome: string;
}

interface Project {
  id: string;
  name: string;
}

interface FormData {
  grupoEconomicoId: string;
  projetoId: string;
  baseCobranca: string;
  valorCobranca: string;
  tipoCobranca: string;
  dataInicio: string;
  dataFim: string;
  diaPagamento: string;
  diaEmissaoNota: string;
  contatoNome: string;
  contatoEmail: string;
  contatoTelefone: string;
  descricao: string;
}

interface ContasReceberFormProps {
  onSuccess?: () => void;
}

const ContasReceberForm = ({ onSuccess }: ContasReceberFormProps) => {
  const { toast } = useToast();
  const [grupos, setGrupos] = useState<GrupoEconomico[]>([]);
  const [projetos, setProjetos] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [totalRegistros, setTotalRegistros] = useState(0);

  const [formData, setFormData] = useState<FormData>({
    grupoEconomicoId: "",
    projetoId: "",
    baseCobranca: "",
    valorCobranca: "",
    tipoCobranca: "",
    dataInicio: "",
    dataFim: "",
    diaPagamento: "",
    diaEmissaoNota: "",
    contatoNome: "",
    contatoEmail: "",
    contatoTelefone: "",
    descricao: "",
  });

  // Carregar grupos econômicos
  useEffect(() => {
    const fetchGrupos = async () => {
      try {
        const { data, error } = await supabase
          .from("grupos_economicos")
          .select("id, nome")
          .order("nome");

        if (error) {
          console.error("Erro ao carregar grupos:", error);
          toast({
            title: "Erro",
            description: `Erro ao carregar grupos econômicos: ${error.message}`,
            variant: "destructive",
          });
        } else {
          console.log("Grupos carregados:", data);
          setGrupos(data || []);
        }
      } catch (err) {
        console.error("Erro na requisição:", err);
        toast({
          title: "Erro",
          description: "Erro ao carregar grupos econômicos",
          variant: "destructive",
        });
      }
    };

    fetchGrupos();
  }, [toast]);

  // Carregar projetos quando grupo for selecionado
  useEffect(() => {
    if (!formData.grupoEconomicoId) {
      setProjetos([]);
      return;
    }

    const fetchProjetos = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, name")
        .eq("grupo_economico_id", formData.grupoEconomicoId)
        .order("name");

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao carregar projetos",
          variant: "destructive",
        });
      } else {
        setProjetos(data || []);
      }
    };

    fetchProjetos();
  }, [formData.grupoEconomicoId]);

  const calcularTotalRegistros = () => {
    if (!formData.dataInicio || !formData.dataFim || !formData.baseCobranca) {
      return 0;
    }

    const inicio = new Date(formData.dataInicio);
    const fim = new Date(formData.dataFim);
    let total = 0;

    let current = new Date(inicio);

    while (current <= fim) {
      total++;

      switch (formData.baseCobranca) {
        case "mensal":
          current.setMonth(current.getMonth() + 1);
          break;
        case "bimestral":
          current.setMonth(current.getMonth() + 2);
          break;
        case "trimestral":
          current.setMonth(current.getMonth() + 3);
          break;
        case "semestral":
          current.setMonth(current.getMonth() + 6);
          break;
      }
    }

    return total;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === "dataInicio" || field === "dataFim" || field === "baseCobranca") {
      const newTotal = calcularTotalRegistros();
      setTotalRegistros(newTotal);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.grupoEconomicoId || !formData.projetoId || !formData.baseCobranca) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    setTotalRegistros(calcularTotalRegistros());
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive",
        });
        return;
      }

      // Criar lote
      const { data: lote, error: loteError } = await supabase
        .from("contas_receber_lotes")
        .insert([
          {
            grupo_economico_id: formData.grupoEconomicoId,
            projeto_id: formData.projetoId,
            base_cobranca: formData.baseCobranca,
            valor_cobranca: parseFloat(formData.valorCobranca),
            tipo_cobranca: formData.tipoCobranca,
            data_inicio: formData.dataInicio,
            data_fim: formData.dataFim,
            dia_pagamento: parseInt(formData.diaPagamento),
            dia_emissao_nota: parseInt(formData.diaEmissaoNota),
            contato_nome: formData.contatoNome,
            contato_email: formData.contatoEmail,
            contato_telefone: formData.contatoTelefone,
            descricao: formData.descricao,
            total_registros: totalRegistros,
            created_by: user.id,
          },
        ])
        .select()
        .single();

      if (loteError) throw loteError;

      // Gerar registros individuais
      const registros = [];
      let current = new Date(formData.dataInicio);
      const fim = new Date(formData.dataFim);

      while (current <= fim) {
        registros.push({
          lote_id: lote.id,
          grupo_economico_id: formData.grupoEconomicoId,
          projeto_id: formData.projetoId,
          base_cobranca: formData.baseCobranca,
          valor_cobranca: parseFloat(formData.valorCobranca),
          tipo_cobranca: formData.tipoCobranca,
          data_cobranca: current.toISOString().split("T")[0],
          dia_pagamento: parseInt(formData.diaPagamento),
          dia_emissao_nota: parseInt(formData.diaEmissaoNota),
          contato_nome: formData.contatoNome,
          contato_email: formData.contatoEmail,
          contato_telefone: formData.contatoTelefone,
          descricao: formData.descricao,
          created_by: user.id,
        });

        switch (formData.baseCobranca) {
          case "mensal":
            current.setMonth(current.getMonth() + 1);
            break;
          case "bimestral":
            current.setMonth(current.getMonth() + 2);
            break;
          case "trimestral":
            current.setMonth(current.getMonth() + 3);
            break;
          case "semestral":
            current.setMonth(current.getMonth() + 6);
            break;
        }
      }

      const { error: registrosError } = await supabase
        .from("contas_receber")
        .insert(registros);

      if (registrosError) throw registrosError;

      toast({
        title: "Sucesso",
        description: `${totalRegistros} registros de cobrança criados com sucesso!`,
      });

      // Limpar formulário
      setFormData({
        grupoEconomicoId: "",
        projetoId: "",
        baseCobranca: "",
        valorCobranca: "",
        tipoCobranca: "",
        dataInicio: "",
        dataFim: "",
        diaPagamento: "",
        diaEmissaoNota: "",
        contatoNome: "",
        contatoEmail: "",
        contatoTelefone: "",
        descricao: "",
      });

      setShowConfirmation(false);
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao criar contas a receber:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar contas a receber",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Novo Cadastro de Contas a Receber
          </CardTitle>
          <CardDescription>
            Cadastre um novo lote de contas a receber
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seleção de Grupo e Projeto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="grupo">Grupo Econômico *</Label>
                <Select
                  value={formData.grupoEconomicoId}
                  onValueChange={(value) =>
                    handleInputChange("grupoEconomicoId", value)
                  }
                >
                  <SelectTrigger id="grupo">
                    <SelectValue placeholder="Selecione um grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {grupos.map((grupo) => (
                      <SelectItem key={grupo.id} value={grupo.id}>
                        {grupo.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="projeto">Projeto *</Label>
                <Select
                  value={formData.projetoId}
                  onValueChange={(value) =>
                    handleInputChange("projetoId", value)
                  }
                  disabled={!formData.grupoEconomicoId}
                >
                  <SelectTrigger id="projeto">
                    <SelectValue placeholder="Selecione um projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projetos.map((projeto) => (
                      <SelectItem key={projeto.id} value={projeto.id}>
                        {projeto.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Dados da Cobrança */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="baseCobranca">Base de Cobrança *</Label>
                <Select
                  value={formData.baseCobranca}
                  onValueChange={(value) =>
                    handleInputChange("baseCobranca", value)
                  }
                >
                  <SelectTrigger id="baseCobranca">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="bimestral">Bimestral</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valorCobranca">Valor da Cobrança *</Label>
                <Input
                  id="valorCobranca"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.valorCobranca}
                  onChange={(e) =>
                    handleInputChange("valorCobranca", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Tipo de Cobrança */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipoCobranca">Tipo de Cobrança *</Label>
                <Select
                  value={formData.tipoCobranca}
                  onValueChange={(value) =>
                    handleInputChange("tipoCobranca", value)
                  }
                >
                  <SelectTrigger id="tipoCobranca">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pre-pago">Pré-pago</SelectItem>
                    <SelectItem value="pos-pago">Pós-pago</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Datas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data de Início *</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={formData.dataInicio}
                  onChange={(e) =>
                    handleInputChange("dataInicio", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataFim">Data de Fim *</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={formData.dataFim}
                  onChange={(e) =>
                    handleInputChange("dataFim", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Dias */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="diaPagamento">Dia do Mês para Pagamento *</Label>
                <Input
                  id="diaPagamento"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="1-31"
                  value={formData.diaPagamento}
                  onChange={(e) =>
                    handleInputChange("diaPagamento", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="diaEmissaoNota">Dia do Mês para Emitir Nota *</Label>
                <Input
                  id="diaEmissaoNota"
                  type="number"
                  min="1"
                  max="31"
                  placeholder="1-31"
                  value={formData.diaEmissaoNota}
                  onChange={(e) =>
                    handleInputChange("diaEmissaoNota", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Dados de Contato */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold">Dados de Contato para Cobrança</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contatoNome">Nome *</Label>
                  <Input
                    id="contatoNome"
                    placeholder="Nome do contato"
                    value={formData.contatoNome}
                    onChange={(e) =>
                      handleInputChange("contatoNome", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contatoEmail">E-mail *</Label>
                  <Input
                    id="contatoEmail"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={formData.contatoEmail}
                    onChange={(e) =>
                      handleInputChange("contatoEmail", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contatoTelefone">Telefone *</Label>
                <Input
                  id="contatoTelefone"
                  placeholder="(00) 00000-0000"
                  value={formData.contatoTelefone}
                  onChange={(e) =>
                    handleInputChange("contatoTelefone", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição da Cobrança/Nota Fiscal</Label>
              <Textarea
                id="descricao"
                placeholder="Descrição da cobrança..."
                value={formData.descricao}
                onChange={(e) =>
                  handleInputChange("descricao", e.target.value)
                }
                rows={4}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Processando..." : "Confirmar e Gerar Registros"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Dialog de Confirmação */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Criação de Contas a Receber</AlertDialogTitle>
            <AlertDialogDescription>
              Serão criados <strong>{totalRegistros} registros</strong> de cobrança{" "}
              <strong>{formData.baseCobranca}</strong> de{" "}
              <strong>{formData.dataInicio}</strong> até{" "}
              <strong>{formData.dataFim}</strong>.
              <br />
              <br />
              Tem certeza que deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Valor por cobrança:</strong> R${" "}
              {parseFloat(formData.valorCobranca || "0").toFixed(2)}
            </p>
            <p>
              <strong>Tipo:</strong> {formData.tipoCobranca === "pre-pago" ? "Pré-pago" : "Pós-pago"}
            </p>
          </div>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={loading}>
              {loading ? "Criando..." : "Confirmar"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ContasReceberForm;
