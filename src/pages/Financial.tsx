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

const Financial = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [openModal, setOpenModal] = useState(false);

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

      <Tabs defaultValue="contas-receber" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="contas-receber">Contas a Receber</TabsTrigger>
            {/* Outras abas podem ser adicionadas aqui no futuro */}
          </TabsList>
          <Button
            onClick={() => setOpenModal(true)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Cadastro
          </Button>
        </div>

        <TabsContent value="contas-receber" className="space-y-6">
          <ContasReceberList refreshTrigger={refreshTrigger} />
        </TabsContent>
      </Tabs>

      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Contas a Receber</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo lote de cobranças
            </DialogDescription>
          </DialogHeader>
          <ContasReceberForm onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Financial;
