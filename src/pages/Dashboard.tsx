import { Building2, MapPin, Briefcase, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const stats = [
    {
      title: "Empreendimentos Ativos",
      value: "12",
      icon: Building2,
      trend: "+2 este mês",
    },
    {
      title: "Terrenos no LandBank",
      value: "8",
      icon: MapPin,
      trend: "3 em negociação",
    },
    {
      title: "Negociações Abertas",
      value: "5",
      icon: Briefcase,
      trend: "R$ 2.5M em pipeline",
    },
    {
      title: "Faturamento Mensal",
      value: "R$ 450K",
      icon: TrendingUp,
      trend: "+15% vs mês anterior",
    },
  ];

  const recentProjects = [
    {
      name: "Residencial Vista Verde",
      company: "Construtora ABC",
      stage: "Aprovações",
      progress: 65,
      status: "on-track",
    },
    {
      name: "Edifício Horizonte",
      company: "Incorporadora XYZ",
      stage: "Vendas",
      progress: 80,
      status: "on-track",
    },
    {
      name: "Condomínio Parque das Águas",
      company: "Construtora ABC",
      stage: "Projeto",
      progress: 45,
      status: "alert",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral dos seus empreendimentos e negociações
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="transition-all hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Empreendimentos em Andamento</CardTitle>
            <Button variant="outline" size="sm">
              Ver todos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentProjects.map((project) => (
              <div
                key={project.name}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{project.name}</h3>
                    {project.status === "alert" && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-destructive/10 text-destructive">
                        Atenção
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{project.company}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-muted-foreground">
                      Etapa: {project.stage}
                    </span>
                    <div className="flex items-center gap-2 flex-1 max-w-xs">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium">{project.progress}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button className="h-20 bg-primary hover:bg-primary/90">
              <Building2 className="mr-2 h-5 w-5" />
              Novo Empreendimento
            </Button>
            <Button variant="outline" className="h-20">
              <MapPin className="mr-2 h-5 w-5" />
              Adicionar Terreno
            </Button>
            <Button variant="outline" className="h-20">
              <Briefcase className="mr-2 h-5 w-5" />
              Nova Negociação
            </Button>
            <Button variant="outline" className="h-20">
              <TrendingUp className="mr-2 h-5 w-5" />
              Ver Relatórios
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
