import { useState } from "react";
import { DollarSign } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ContasReceberForm from "@/components/financial/ContasReceberForm";
import ContasReceberList from "@/components/financial/ContasReceberList";

const Financial = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <DollarSign className="h-8 w-8" />
          Financeiro
        </h1>
        <p className="text-muted-foreground">
          Controle financeiro e fluxo de caixa
        </p>
      </div>

      <Tabs defaultValue="contas-receber" className="w-full">
        <TabsList>
          <TabsTrigger value="contas-receber">Contas a Receber</TabsTrigger>
          {/* Outras abas podem ser adicionadas aqui no futuro */}
        </TabsList>

        <TabsContent value="contas-receber" className="space-y-6">
          <ContasReceberForm onSuccess={handleSuccess} />
          <ContasReceberList refreshTrigger={refreshTrigger} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Financial;
