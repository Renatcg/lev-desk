import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CNPJLookupProps {
  value: string;
  onChange: (value: string) => void;
  onDataFetched?: (data: {
    razao_social: string;
    nome_fantasia?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    municipio?: string;
    uf?: string;
    cep?: string;
  }) => void;
}

export const CNPJLookup = ({ value, onChange, onDataFetched }: CNPJLookupProps) => {
  const [loading, setLoading] = useState(false);

  const formatCNPJ = (cnpj: string) => {
    const cleaned = cnpj.replace(/\D/g, '');
    if (cleaned.length <= 14) {
      return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return cleaned;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    onChange(formatted);
  };

  const handleLookup = async () => {
    const cnpjClean = value.replace(/\D/g, '');
    
    if (cnpjClean.length !== 14) {
      toast.error("CNPJ deve ter 14 dígitos");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cnpj-lookup', {
        body: { cnpj: cnpjClean }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      toast.success("CNPJ encontrado!");
      
      if (onDataFetched) {
        onDataFetched(data);
      }
    } catch (error) {
      console.error('Erro ao buscar CNPJ:', error);
      toast.error("Erro ao buscar CNPJ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Input
        placeholder="00.000.000/0000-00"
        value={value}
        onChange={handleInputChange}
        maxLength={18}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleLookup}
        disabled={loading || value.replace(/\D/g, '').length !== 14}
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
