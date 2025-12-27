import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ContasPagarFormProps {
  onSuccess?: () => void;
}

const ContasPagarForm = ({ onSuccess }: ContasPagarFormProps) => {
  const { toast } = useToast();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formData, setFormData] = useState({
    baseCobranca: "mensal",
    valorDespesa: "",
    tipoPagamento: "pos-pago",
    dataInicio: "",
    dataFim: "",
    diaPagamento: "10",
    diaEmissaoNota: "5",
    fornecedorNome: "",
    fornecedorEmail: "",
    fornecedorTelefone: "",
    descricao: "",
  });

  const [previewData, setPreviewData] = useState<any>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculateTotalRegistros = () => {
    if (!formData.dataInicio || !formData.dataFim) return 0;

    const inicio = new Date(formData.dataInicio);
    const fim = new Date(formData.dataFim);
    const meses = (fim.getFullYear() - inicio.getFullYear()) * 12 + (fim.getMonth() - inicio.getMonth()) + 1;

    const baseMap: Record<string, number> = {
      mensal: 1,
      bimestral: 2,
      trimestral: 3,
      semestral: 6,
    };

    const divisor = baseMap[formData.baseCobranca] || 1;
    return Math.ceil(meses / divisor);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.dataInicio || !formData.dataFim || !formData.valorDespesa) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const totalRegistros = calculateTotalRegistros();
    setPreviewData({
      ...formData,
      totalRegistros,
    });
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    toast({
      title: "Sucesso",
      description: `${previewData.totalRegistros} registros de despesa serão criados de ${formData.dataInicio} até ${formData.dataFim}`,
    });
    setShowConfirmation(false);
    setFormData({
      baseCobranca: "mensal",
      valorDespesa: "",
      tipoPagamento: "pos-pago",
      dataInicio: "",
      dataFim: "",
      diaPagamento: "10",
      diaEmissaoNota: "5",
      fornecedorNome: "",
      fornecedorEmail: "",
      fornecedorTelefone: "",
      descricao: "",
    });
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="baseCobranca">Base de Cobrança</Label>
          <Select
            value={formData.baseCobranca}
            onValueChange={(value) => handleSelectChange("baseCobranca", value)}
          >
            <SelectTrigger>
              <SelectValue />
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
          <Label htmlFor="valorDespesa">Valor da Despesa</Label>
          <Input
            id="valorDespesa"
            name="valorDespesa"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={formData.valorDespesa}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tipoPagamento">Tipo de Pagamento</Label>
          <Select
            value={formData.tipoPagamento}
            onValueChange={(value) => handleSelectChange("tipoPagamento", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pre-pago">Pré-pago</SelectItem>
              <SelectItem value="pos-pago">Pós-pago</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dataInicio">Data de Início</Label>
          <Input
            id="dataInicio"
            name="dataInicio"
            type="date"
            value={formData.dataInicio}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dataFim">Data de Fim</Label>
          <Input
            id="dataFim"
            name="dataFim"
            type="date"
            value={formData.dataFim}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="diaPagamento">Dia do Mês para Pagamento</Label>
          <Input
            id="diaPagamento"
            name="diaPagamento"
            type="number"
            min="1"
            max="31"
            value={formData.diaPagamento}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="diaEmissaoNota">Dia para Emitir Nota</Label>
          <Input
            id="diaEmissaoNota"
            name="diaEmissaoNota"
            type="number"
            min="1"
            max="31"
            value={formData.diaEmissaoNota}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="font-semibold mb-4">Dados do Fornecedor</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fornecedorNome">Nome do Fornecedor</Label>
            <Input
              id="fornecedorNome"
              name="fornecedorNome"
              placeholder="Ex: Empresa XYZ"
              value={formData.fornecedorNome}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fornecedorEmail">E-mail</Label>
            <Input
              id="fornecedorEmail"
              name="fornecedorEmail"
              type="email"
              placeholder="email@exemplo.com"
              value={formData.fornecedorEmail}
              onChange={handleInputChange}
              required
            />
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <Label htmlFor="fornecedorTelefone">Telefone</Label>
          <Input
            id="fornecedorTelefone"
            name="fornecedorTelefone"
            placeholder="(11) 99999-9999"
            value={formData.fornecedorTelefone}
            onChange={handleInputChange}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição da Despesa</Label>
        <Textarea
          id="descricao"
          name="descricao"
          placeholder="Descreva a despesa..."
          value={formData.descricao}
          onChange={handleInputChange}
          rows={4}
        />
      </div>

      <Button type="submit" className="w-full">
        Criar Lote de Despesas
      </Button>

      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Criação de Despesas</AlertDialogTitle>
            <AlertDialogDescription>
              Serão criados <strong>{previewData?.totalRegistros}</strong> registros de despesa{" "}
              <strong>{formData.baseCobranca}</strong> de{" "}
              <strong>{formData.dataInicio}</strong> até{" "}
              <strong>{formData.dataFim}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction onClick={handleConfirm}>
            Confirmar
          </AlertDialogAction>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
};

export default ContasPagarForm;
