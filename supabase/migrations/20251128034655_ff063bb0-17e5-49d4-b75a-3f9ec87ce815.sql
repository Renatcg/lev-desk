-- Remover a constraint atual
ALTER TABLE public.companies DROP CONSTRAINT companies_status_check;

-- Criar nova constraint incluindo 'archived'
ALTER TABLE public.companies 
ADD CONSTRAINT companies_status_check 
CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'archived'::text]));