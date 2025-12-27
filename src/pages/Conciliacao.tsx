import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Edit, Trash2, CreditCard } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("contas-receber");
  const [modalAberto, setModalAberto] = useState(false);
  const [registroSelecionado, setRegistroSelecionado] = useState<any>(null);

  const registros = activeTab === "contas-receber" ? mockContasReceber : mockContasPagar;
  const tipo = activeTab === "contas-receber" ? "receber" : "pagar";

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
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="h-8 w-8" />
          Conciliação Bancária
        </h1>
        <p className="text-muted-foreground mt-2">Registre pagamentos e recebimentos</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="contas-receber">Contas a Receber</TabsTrigger>
          <TabsTrigger value="contas-pagar">Contas a Pagar</TabsTrigger>
        </TabsList>

        <TabsContent value="contas-receber" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contas a Receber Pendentes</CardTitle>
              <CardDescription>
                Registre os recebimentos dos clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
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
        </TabsContent>

        <TabsContent value="contas-pagar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contas a Pagar Pendentes</CardTitle>
              <CardDescription>
                Registre os pagamentos aos fornecedores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fornecedor</TableHead>
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
        </TabsContent>
      </Tabs>

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
