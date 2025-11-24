import { useEffect, useState } from "react";
import { format, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MediaBudgetPanelProps {
  projectId: string;
  currentMonth: Date;
}

interface BudgetData {
  month_year: string;
  budgeted_amount: number;
  actual_amount: number;
}

export function MediaBudgetPanel({ projectId, currentMonth }: MediaBudgetPanelProps) {
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBudgetData();
  }, [projectId, currentMonth]);

  const loadBudgetData = async () => {
    setLoading(true);
    try {
      const monthStart = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from("media_budgets")
        .select("*")
        .eq("project_id", projectId)
        .eq("month_year", monthStart)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setBudgetData(data || {
        month_year: monthStart,
        budgeted_amount: 0,
        actual_amount: 0,
      });
    } catch (error) {
      console.error("Error loading budget:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Orçamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  if (!budgetData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Orçamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Nenhum orçamento definido para este mês
          </div>
        </CardContent>
      </Card>
    );
  }

  const percentageUsed = budgetData.budgeted_amount > 0
    ? (budgetData.actual_amount / budgetData.budgeted_amount) * 100
    : 0;
  
  const isOverBudget = budgetData.actual_amount > budgetData.budgeted_amount;
  const remaining = budgetData.budgeted_amount - budgetData.actual_amount;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Orçamento</span>
          <Badge variant={isOverBudget ? "destructive" : "secondary"}>
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Budget Summary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Orçado</span>
            <span className="text-lg font-semibold">
              R$ {budgetData.budgeted_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Realizado</span>
            <span className={`text-lg font-semibold ${isOverBudget ? 'text-destructive' : ''}`}>
              R$ {budgetData.actual_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {isOverBudget ? 'Acima do orçamento' : 'Restante'}
            </span>
            <span className={`text-lg font-semibold ${isOverBudget ? 'text-destructive' : 'text-primary'}`}>
              R$ {Math.abs(remaining).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Utilização</span>
            <span className={`font-semibold ${isOverBudget ? 'text-destructive' : ''}`}>
              {percentageUsed.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={Math.min(percentageUsed, 100)} 
            className="h-2"
          />
        </div>

        {/* Alert */}
        {isOverBudget && (
          <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold text-destructive">
                Orçamento ultrapassado
              </p>
              <p className="text-xs text-destructive/80">
                O valor realizado está R$ {Math.abs(remaining).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} acima do orçado.
              </p>
            </div>
          </div>
        )}

        {/* Trend Indicator */}
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          {isOverBudget ? (
            <>
              <TrendingUp className="h-4 w-4 text-destructive" />
              <span className="text-xs text-destructive">
                {((percentageUsed - 100)).toFixed(1)}% acima do planejado
              </span>
            </>
          ) : (
            <>
              <TrendingDown className="h-4 w-4 text-primary" />
              <span className="text-xs text-primary">
                {(100 - percentageUsed).toFixed(1)}% disponível
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
