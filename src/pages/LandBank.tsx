import { useState } from "react";
import { MapPin, Plus, Filter, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const LandBank = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const lands = [
    {
      id: 1,
      name: "Terreno Centro - Lote A",
      address: "Av. Principal, 1000 - Centro",
      area: 2500,
      zoning: "Residencial Multifamiliar",
      status: "available",
      company: "Construtora ABC",
      price: 1200000,
    },
    {
      id: 2,
      name: "Terreno Bairro Jardins",
      address: "Rua das Flores, 450 - Jardins",
      area: 1800,
      zoning: "Comercial/Residencial",
      status: "negotiating",
      company: "Incorporadora XYZ",
      price: 950000,
    },
    {
      id: 3,
      name: "Gleba Zona Sul",
      address: "Estrada do Sul, Km 12",
      area: 5000,
      zoning: "Residencial",
      status: "acquired",
      company: "Construtora ABC",
      price: 2500000,
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusMap = {
      available: { label: "Disponível", variant: "default" as const },
      negotiating: { label: "Negociando", variant: "secondary" as const },
      acquired: { label: "Adquirido", variant: "outline" as const },
    };
    const statusData = statusMap[status as keyof typeof statusMap];
    return <Badge variant={statusData.variant}>{statusData.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">LandBank</h1>
          <p className="text-muted-foreground">
            Gestão de terrenos e oportunidades de incorporação
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Terreno
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou endereço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lands Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {lands.map((land) => (
          <Card
            key={land.id}
            className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{land.name}</CardTitle>
                  {getStatusBadge(land.status)}
                </div>
                <MapPin className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{land.address}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Área</p>
                  <p className="font-semibold">{land.area.toLocaleString()} m²</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="font-semibold">
                    R$ {(land.price / 1000).toFixed(0)}K
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Zoneamento</p>
                <p className="text-sm font-medium">{land.zoning}</p>
              </div>

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">{land.company}</p>
              </div>

              {land.status === "acquired" && (
                <Button variant="outline" className="w-full" size="sm">
                  Converter em Empreendimento
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LandBank;
