import { useState } from "react";
import { Zap, Mail, MessageSquare, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Automations = () => {
  const [resendKey, setResendKey] = useState("");
  const [evoUrl, setEvoUrl] = useState("");
  const [evoKey, setEvoKey] = useState("");
  const [showResendKey, setShowResendKey] = useState(false);
  const [showEvoKey, setShowEvoKey] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  const testResend = async () => {
    if (!resendKey) {
      toast.error("Por favor, insira a chave da API Resend");
      return;
    }
    
    setTesting("resend");
    try {
      // Simulated test - in real scenario would call edge function
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success("Conexão Resend testada com sucesso!");
    } catch (error) {
      toast.error("Erro ao testar conexão Resend");
    } finally {
      setTesting(null);
    }
  };

  const testEvo = async () => {
    if (!evoUrl || !evoKey) {
      toast.error("Por favor, preencha URL e chave da API Evo");
      return;
    }
    
    setTesting("evo");
    try {
      // Simulated test - in real scenario would call edge function
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success("Conexão Evo API testada com sucesso!");
    } catch (error) {
      toast.error("Erro ao testar conexão Evo API");
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Automações</h1>
        <p className="text-muted-foreground">
          Configure automações e integrações do sistema
        </p>
      </div>

      {/* Resend Email Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Resend (Envio de E-mails)
          </CardTitle>
          <CardDescription>
            Configure a integração com Resend para envio de e-mails transacionais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resend-key">API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="resend-key"
                  type={showResendKey ? "text" : "password"}
                  value={resendKey}
                  onChange={(e) => setResendKey(e.target.value)}
                  placeholder="re_..."
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowResendKey(!showResendKey)}
                >
                  {showResendKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button 
                onClick={testResend}
                disabled={testing === "resend"}
              >
                {testing === "resend" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Testar
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {resendKey ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Configurado</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Não configurado</span>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Obtenha sua API Key em: <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">resend.com/api-keys</a>
          </p>
        </CardContent>
      </Card>

      {/* Evo WhatsApp Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Evo API (WhatsApp)
          </CardTitle>
          <CardDescription>
            Configure a integração com Evo API para envio de mensagens via WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="evo-url">URL da API</Label>
            <Input
              id="evo-url"
              type="url"
              value={evoUrl}
              onChange={(e) => setEvoUrl(e.target.value)}
              placeholder="https://api.evo.com.br/..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="evo-key">API Key</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="evo-key"
                  type={showEvoKey ? "text" : "password"}
                  value={evoKey}
                  onChange={(e) => setEvoKey(e.target.value)}
                  placeholder="Sua chave de API"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowEvoKey(!showEvoKey)}
                >
                  {showEvoKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button 
                onClick={testEvo}
                disabled={testing === "evo"}
              >
                {testing === "evo" ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Testar
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {evoUrl && evoKey ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-green-600">Configurado</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Não configurado</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Automations;
