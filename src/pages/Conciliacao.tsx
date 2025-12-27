import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Edit, Trash2 } from "lucide-react";
import ModalPagamento from "@/components/conciliacao/ModalPagamento";

// Mock data
const mockContasReceber = [
  {
    id: "1",
    fornecedor: "Cliente A",
    valor: 5000,
    vencimento: "2025-01-10",
    base: "Mensal",
    status: "pendente",
  },
  {
    id: "2",
    fornecedor: "Cliente B",
    valor: 3500,
    vencimento: "2025-01-15",
    base: "Bimestral",
    status: "pendente",
  },
  {
    id: "3",
    fornecedor: "Cliente C",
    valor: 7200,
    vencimento: "2025-01-20",
    base: "Trimestral",
    status: "pendente",
  },
];

const mockContasPagar = [
  {
    id: "1",
    fornecedor: "Fornecedor A",
    valor: 2500,
    vencimento: "2025-01-12",
    base: "Mensal",
    status: "pendente",
  },
  {
    id: "2",
    fornecedor: "Fornecedor B",
    valor: 1800,
    vencimento: "2025-01-18",
    base: "Bimestral",
    status: "pendente",
  },
  {
    id: "3",
    fornecedor: "Fornecedor C",
    valor: 4500,
    vencimento: "2025-01-25",
    base: "Semestral",
    status: "pendente",
  },
];

export default function Conciliacao() {
  const [tipo, setTipo] = useState<"receber" | "pagar">("receber");
  const [registros, setRegistros] = useState(tipo === "receber" ? mockContasReceber : mockContasPagar);
  const [modalAberto, setModalAberto] = useState(false);
  const [registroSelecionado, setRegistroSelecionado] = useState<any>(null);

  const handleTipoChange = (novoTipo: string) => {
    setTipo(novoTipo as "receber" | "pagar");
    setRegistros(novoTipo === "receber" ? mockContasReceber : mockContasPagar);
  };

  const handleAbrirModal = (registro: any) => {
    setRegistroSelecionado(registro);
    setModalAberto(true);
  };

  const handleFecharModal = () => {
    setModalAberto(false);
    setRegistroSelecionado(null);
  };

  const handleConfirmarPagamento = (dados: any) => {
    console.log("Pagamento confirmado:", dados);
    // Aqui será integrado com Supabase
    handleFecharModal();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Conciliação Bancária</h1>
        <p className="text-muted-foreground mt-2">Registre pagamentos e recebimentos</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecione o Tipo</CardTitle>
          <CardDescription>Escolha entre contas a receber ou contas a pagar</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={tipo} onValueChange={handleTipoChange}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="receber">Contas a Receber</SelectItem>
              <SelectItem value="pagar">Contas a Pagar</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {tipo === "receber" ? "Contas a Receber Pendentes" : "Contas a Pagar Pendentes"}
          </CardTitle>
          <CardDescription>
            {tipo === "receber"
              ? "Registre os recebimentos dos clientes"
              : "Registre os pagamentos aos fornecedores"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{tipo === "receber" ? "Cliente" : "Fornecedor"}</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registros.map((registro) => (
                  <TableRow key={registro.id}>
                    <TableCell className="font-medium">{registro.fornecedor}</TableCell>
                    <TableCell>R$ {registro.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell>{new Date(registro.vencimento).toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{registro.base}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                        Pendente
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAbrirModal(registro)}
                          title="Registrar pagamento"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Visualizar">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Deletar">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {modalAberto && registroSelecionado && (
        <ModalPagamento
          registro={registroSelecionado}
          tipo={tipo}
          onConfirmar={handleConfirmarPagamento}
          onFechar={handleFecharModal}
        />
      )}
    </div>
  );
}
