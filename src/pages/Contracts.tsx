import { FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Contracts = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contratos</h1>
        <p className="text-muted-foreground">
          Gestão de contratos e acordos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Módulo em Desenvolvimento
          </CardTitle>
          <CardDescription>
            Esta funcionalidade está sendo desenvolvida
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Em breve você poderá gerenciar todos os contratos do sistema por aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Contracts;
