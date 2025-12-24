import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Edit2, Trash2, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContasReceberEditDialog from "./ContasReceberEditDialog";

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

interface Lote {
  id: string;
  total_registros: number;
}

interface ContasReceberListProps {
  refreshTrigger?: number;
}

const ContasReceberList = ({ refreshTrigger }: ContasReceberListProps) => {
  const { toast } = useToast();
  const [grupos, setGrupos] = useState<any[]>([]);
  const [contas, setContas] = useState<ContaReceber[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrupo, setSelectedGrupo] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; type: "individual" | "lote" } | null>(null);
  const [editingConta, setEditingConta] = useState<ContaReceber | null>(null);
  const [lotes, setLotes] = useState<Map<string, Lote>>(new Map());

  useEffect(() => {
    fetchGrupos();
    fetchContas();
  }, [refreshTrigger]);

  const fetchGrupos = async () => {
    const { data, error } = await supabase
      .from("grupos_economicos")
      .select("id, nome")
      .order("nome");

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar grupos econômicos",
        variant: "destructive",
      });
    } else {
      setGrupos(data || []);
      if (data && data.length > 0 && !selectedGrupo) {
        setSelectedGrupo(data[0].id);
      }
    }
  };

  const fetchContas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contas_receber")
        .select(`
          *,
          projects (name)
        `)
        .order("data_cobranca", { ascending: true });

      if (error) throw error;

      setContas(data || []);

      // Buscar informações dos lotes
      const { data: lotesData } = await supabase
        .from("contas_receber_lotes")
        .select("id, total_registros");

      if (lotesData) {
        const lotesMap = new Map(lotesData.map((l) => [l.id, l]));
        setLotes(lotesMap);
      }
    } catch (error) {
      console.error("Erro ao carregar contas:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar contas a receber",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConta = async (id: string) => {
    try {
      const { error } = await supabase
        .from("contas_receber")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Conta a receber deletada com sucesso",
      });

      fetchContas();
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Erro ao deletar conta:", error);
      toast({
        title: "Erro",
        description: "Erro ao deletar conta a receber",
        variant: "destructive",
      });
    }
  };

  const handleDeleteLote = async (loteId: string) => {
    try {
      const { error } = await supabase
        .from("contas_receber_lotes")
        .delete()
        .eq("id", loteId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Lote deletado com sucesso",
      });

      fetchContas();
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Erro ao deletar lote:", error);
      toast({
        title: "Erro",
        description: "Erro ao deletar lote",
        variant: "destructive",
      });
    }
  };

  const contasPorGrupo = contas.filter(
    (c) => c.grupo_economico_id === selectedGrupo
  );

  const lotesPorGrupo = Array.from(
    new Set(contasPorGrupo.map((c) => c.lote_id))
  );

  if (loading) {
    return <div className="text-center py-8">Carregando contas a receber...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Contas a Receber por Grupo Econômico</CardTitle>
          <CardDescription>
            Visualize e gerencie todas as contas a receber
          </CardDescription>
        </CardHeader>
        <CardContent>
          {grupos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum grupo econômico cadastrado
            </div>
          ) : (
            <Tabs value={selectedGrupo} onValueChange={setSelectedGrupo}>
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {grupos.map((grupo) => (
                  <TabsTrigger key={grupo.id} value={grupo.id} className="text-xs">
                    {grupo.nome}
                  </TabsTrigger>
                ))}
              </TabsList>

              {grupos.map((grupo) => (
                <TabsContent key={grupo.id} value={grupo.id} className="space-y-4">
                  {contasPorGrupo.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhuma conta a receber para este grupo
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {lotesPorGrupo.map((loteId) => {
                        const contasLote = contasPorGrupo.filter(
                          (c) => c.lote_id === loteId
                        );
                        const lote = lotes.get(loteId);

                        return (
                          <Card key={loteId} className="bg-slate-50">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <CardTitle className="text-base">
                                    Lote {loteId.substring(0, 8)}
                                  </CardTitle>
                                  <CardDescription>
                                    {contasLote.length} de {lote?.total_registros || 0} registros
                                  </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      // TODO: Implementar edição de lote
                                    }}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                      setDeleteConfirm({
                                        id: loteId,
                                        type: "lote",
                                      })
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                {contasLote.map((conta) => (
                                  <div
                                    key={conta.id}
                                    className="flex items-center justify-between p-3 bg-white rounded border"
                                  >
                                    <div className="flex-1">
                                      <p className="font-medium">
                                        {conta.projects.name}
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {new Date(
                                          conta.data_cobranca
                                        ).toLocaleDateString("pt-BR")} • R${" "}
                                        {conta.valor_cobranca.toFixed(2)} •{" "}
                                        {conta.status}
                                      </p>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setEditingConta(conta)}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => setEditingConta(conta)}
                                      >
                                        <Edit2 className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive"
                                        onClick={() =>
                                          setDeleteConfirm({
                                            id: conta.id,
                                            type: "individual",
                                          })
                                        }
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog
        open={deleteConfirm !== null}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === "individual"
                ? "Tem certeza que deseja deletar este registro de conta a receber?"
                : "Tem certeza que deseja deletar todos os registros deste lote?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive"
              onClick={() => {
                if (deleteConfirm?.type === "individual") {
                  handleDeleteConta(deleteConfirm.id);
                } else {
                  handleDeleteLote(deleteConfirm.id);
                }
              }}
            >
              Deletar
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Edição */}
      {editingConta && (
        <ContasReceberEditDialog
          conta={editingConta}
          onClose={() => setEditingConta(null)}
          onSuccess={() => {
            setEditingConta(null);
            fetchContas();
          }}
        />
      )}
    </>
  );
};

export default ContasReceberList;
