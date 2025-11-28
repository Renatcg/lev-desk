import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CEPLookupProps {
  value: string;
  onChange: (value: string) => void;
  onDataFetched?: (data: {
    logradouro: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
  }) => void;
}

export const CEPLookup = ({ value, onChange, onDataFetched }: CEPLookupProps) => {
  const [loading, setLoading] = useState(false);

  const formatCEP = (cep: string) => {
    const cleaned = cep.replace(/\D/g, '');
    if (cleaned.length <= 8) {
      return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return cleaned;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    onChange(formatted);
  };

  const handleLookup = async () => {
    const cepClean = value.replace(/\D/g, '');
    
    if (cepClean.length !== 8) {
      toast.error("CEP deve ter 8 dígitos");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cep-lookup', {
        body: { cep: cepClean }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success("CEP encontrado!");
      
      if (onDataFetched) {
        onDataFetched(data);
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error("Erro ao buscar CEP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        placeholder="00000-000"
        value={value}
        onChange={handleInputChange}
        maxLength={9}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleLookup}
        disabled={loading || value.replace(/\D/g, '').length !== 8}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Search className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};
