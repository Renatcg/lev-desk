import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Edit2, Trash2, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface ContaPagar {
  id: string;
  lote_id: string;
  fornecedor_nome: string;
  valor_despesa: number;
  data_vencimento: string;
  status: "pendente" | "paga" | "cancelada";
  base_cobranca: string;
}

interface ContasPagarListProps {
  refreshTrigger?: number;
}

const ContasPagarList = ({ refreshTrigger }: ContasPagarListProps) => {
  const { toast } = useToast();
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: "individual" | "lote" } | null>(null);

  // Dados mockados
  const mockContas: ContaPagar[] = [
    {
      id: "1",
      lote_id: "lote-1",
      fornecedor_nome: "Fornecedor A",
      valor_despesa: 5000,
      data_vencimento: "2025-01-10",
      status: "pendente",
      base_cobranca: "mensal",
    },
    {
      id: "2",
      lote_id: "lote-1",
      fornecedor_nome: "Fornecedor A",
      valor_despesa: 5000,
      data_vencimento: "2025-02-10",
      status: "pendente",
      base_cobranca: "mensal",
    },
    {
      id: "3",
      lote_id: "lote-2",
      fornecedor_nome: "Fornecedor B",
      valor_despesa: 2500,
      data_vencimento: "2025-01-15",
      status: "paga",
      base_cobranca: "bimestral",
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pendente: "outline",
      paga: "default",
      cancelada: "secondary",
    };
    const labels: Record<string, string> = {
      pendente: "Pendente",
      paga: "Paga",
      cancelada: "Cancelada",
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const handleDelete = (id: string) => {
    toast({
      title: "Despesa deletada",
      description: "O registro foi removido com sucesso",
    });
    setDeleteConfirm(null);
  };

  const handleDeleteLote = (loteId: string) => {
    toast({
      title: "Lote deletado",
      description: "Todos os registros do lote foram removidos",
    });
    setDeleteConfirm(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contas a Pagar</CardTitle>
          <CardDescription>
            Gerencie as despesas e pagamentos da empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
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
                {mockContas.map((conta) => (
                  <TableRow key={conta.id}>
                    <TableCell className="font-medium">
                      {conta.fornecedor_nome}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(conta.valor_despesa)}
                    </TableCell>
                    <TableCell>
                      {formatDate(conta.data_vencimento)}
                    </TableCell>
                    <TableCell className="capitalize">
                      {conta.base_cobranca}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(conta.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toast({
                              title: "Visualizar",
                              description: `Detalhes da despesa ${conta.id}`,
                            })
                          }
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toast({
                              title: "Editar",
                              description: `Editando despesa ${conta.id}`,
                            })
                          }
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setDeleteConfirm({ id: conta.id, type: "individual" })
                          }
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {mockContas.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma despesa cadastrada
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === "individual"
                ? "Tem certeza que deseja deletar este registro?"
                : "Tem certeza que deseja deletar todos os registros deste lote?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogAction
            onClick={() => {
              if (deleteConfirm?.type === "individual") {
                handleDelete(deleteConfirm.id);
              } else {
                handleDeleteLote(deleteConfirm?.id || "");
              }
            }}
          >
            Deletar
          </AlertDialogAction>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ContasPagarList;
