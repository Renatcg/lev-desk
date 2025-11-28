-- Expandir tabela companies para Grupo Econômico
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS razao_social text,
ADD COLUMN IF NOT EXISTS nome_comercial text,
ADD COLUMN IF NOT EXISTS cep text,
ADD COLUMN IF NOT EXISTS logradouro text,
ADD COLUMN IF NOT EXISTS numero text,
ADD COLUMN IF NOT EXISTS complemento text,
ADD COLUMN IF NOT EXISTS bairro text,
ADD COLUMN IF NOT EXISTS cidade text,
ADD COLUMN IF NOT EXISTS estado text,
ADD COLUMN IF NOT EXISTS responsavel_legal text;

-- Criar tabela terrenos
CREATE TABLE IF NOT EXISTS public.terrenos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_economico_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  nome text NOT NULL,
  -- Endereço completo
  cep text,
  logradouro text,
  numero text,
  complemento text,
  bairro text,
  cidade text,
  estado text,
  -- Geolocalização
  latitude numeric,
  longitude numeric,
  -- Dados específicos
  area numeric NOT NULL,
  matricula text,
  status text NOT NULL DEFAULT 'available',
  -- Conversão para projeto
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela terrenos
ALTER TABLE public.terrenos ENABLE ROW LEVEL SECURITY;

-- Policies para LEV admins
CREATE POLICY "LEV admins can manage all terrenos"
ON public.terrenos
FOR ALL
USING (has_role(auth.uid(), 'lev_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'lev_admin'::app_role));

-- Policies para LEV users (visualização)
CREATE POLICY "LEV users can view all terrenos"
ON public.terrenos
FOR SELECT
USING (is_lev_user(auth.uid()));

-- Policies para company users (visualização dos terrenos da sua empresa)
CREATE POLICY "Company users can view own company terrenos"
ON public.terrenos
FOR SELECT
USING (
  grupo_economico_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Policies para company admins (gerenciamento dos terrenos da sua empresa)
CREATE POLICY "Company admins can manage own company terrenos"
ON public.terrenos
FOR ALL
USING (
  has_role(auth.uid(), 'company_admin'::app_role) 
  AND grupo_economico_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'company_admin'::app_role) 
  AND grupo_economico_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_terrenos_updated_at
BEFORE UPDATE ON public.terrenos
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();