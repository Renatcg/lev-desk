import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ModalPagamentoProps {
  registro: any;
  tipo: "receber" | "pagar";
  onConfirmar: (dados: any) => void;
  onFechar: () => void;
}

const formasPagamento = [
  { value: "transferencia", label: "Transferência Bancária" },
  { value: "cheque", label: "Cheque" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "cartao", label: "Cartão de Crédito" },
  { value: "pix", label: "PIX" },
];

export default function ModalPagamento({ registro, tipo, onConfirmar, onFechar }: ModalPagamentoProps) {
  const [valorPago, setValorPago] = useState(registro.valor.toString());
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().split("T")[0]);
  const [formaPagamento, setFormaPagamento] = useState("");

  const handleConfirmar = () => {
    if (!valorPago || !dataPagamento || !formaPagamento) {
      alert("Preencha todos os campos");
      return;
    }

    onConfirmar({
      registroId: registro.id,
      valorPago: parseFloat(valorPago),
      dataPagamento,
      formaPagamento,
    });
  };

  return (
    <Dialog open={true} onOpenChange={onFechar}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
          <DialogDescription>
            {tipo === "receber" ? "Registre o recebimento de" : "Registre o pagamento para"} {registro.fornecedor}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Valor Original */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Valor Original</Label>
            <div className="text-lg font-semibold">
              R$ {registro.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Valor Pago */}
          <div className="space-y-2">
            <Label htmlFor="valor-pago">Valor Pago *</Label>
            <Input
              id="valor-pago"
              type="number"
              step="0.01"
              value={valorPago}
              onChange={(e) => setValorPago(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* Data de Pagamento */}
          <div className="space-y-2">
            <Label htmlFor="data-pagamento">Data do Pagamento *</Label>
            <Input
              id="data-pagamento"
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
            />
          </div>

          {/* Forma de Pagamento */}
          <div className="space-y-2">
            <Label htmlFor="forma-pagamento">Forma de Pagamento *</Label>
            <Select value={formaPagamento} onValueChange={setFormaPagamento}>
              <SelectTrigger id="forma-pagamento">
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                {formasPagamento.map((forma) => (
                  <SelectItem key={forma.value} value={forma.value}>
                    {forma.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onFechar}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmar}>Confirmar Pagamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
