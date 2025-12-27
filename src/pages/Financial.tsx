import { useState } from "react";
import { DollarSign, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ContasReceberForm from "@/components/financial/ContasReceberForm";
import ContasReceberList from "@/components/financial/ContasReceberList";
import ContasPagarForm from "@/components/financial/ContasPagarForm";
import ContasPagarList from "@/components/financial/ContasPagarList";

const Financial = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [activeTab, setActiveTab] = useState("contas-receber");

  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    setOpenModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <DollarSign className="h-8 w-8" />
            Financeiro
          </h1>
          <p className="text-muted-foreground">
            Controle financeiro e fluxo de caixa
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="contas-receber">Contas a Receber</TabsTrigger>
            <TabsTrigger value="contas-pagar">Contas a Pagar</TabsTrigger>
          </TabsList>
          {(activeTab === "contas-receber" || activeTab === "contas-pagar") && (
            <Button
              onClick={() => setOpenModal(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Novo Cadastro
            </Button>
          )}
        </div>

        <TabsContent value="contas-receber" className="space-y-6">
          <ContasReceberList refreshTrigger={refreshTrigger} />
        </TabsContent>

        <TabsContent value="contas-pagar" className="space-y-6">
          <ContasPagarList refreshTrigger={refreshTrigger} />
        </TabsContent>
      </Tabs>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {activeTab === "contas-receber"
                ? "Cadastrar Contas a Receber"
                : "Cadastrar Contas a Pagar"}
            </DialogTitle>
            <DialogDescription>
              {activeTab === "contas-receber"
                ? "Preencha os dados para criar um novo lote de cobranças"
                : "Preencha os dados para criar um novo lote de despesas"}
            </DialogDescription>
          </DialogHeader>
          {activeTab === "contas-receber" ? (
            <ContasReceberForm onSuccess={handleSuccess} />
          ) : (
            <ContasPagarForm onSuccess={handleSuccess} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Financial;
