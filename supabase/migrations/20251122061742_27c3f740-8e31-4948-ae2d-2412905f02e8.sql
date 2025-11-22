-- Criar enum para roles do sistema LEV
CREATE TYPE public.app_role AS ENUM ('lev_admin', 'lev_user', 'company_admin', 'company_user');

-- Tabela de Empresas (Clientes da LEV)
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Tabela de Perfis de Usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  avatar_url TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
  temp_password TEXT,
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Tabela de Roles dos Usuários (separada por segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Habilitar RLS na tabela user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função de segurança para verificar roles (SECURITY DEFINER evita recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para verificar se usuário é LEV (admin ou user)
CREATE OR REPLACE FUNCTION public.is_lev_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('lev_admin', 'lev_user')
  )
$$;

-- Função para criar perfil automaticamente quando usuário é criado
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Trigger para atualizar updated_at em companies
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para atualizar updated_at em profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- RLS Policies para companies
-- LEV users podem ver todas as empresas
CREATE POLICY "LEV users can view all companies"
  ON public.companies FOR SELECT
  TO authenticated
  USING (public.is_lev_user(auth.uid()));

-- Company users podem ver apenas sua empresa
CREATE POLICY "Company users can view own company"
  ON public.companies FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- LEV admins podem inserir/editar empresas
CREATE POLICY "LEV admins can manage companies"
  ON public.companies FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'lev_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'lev_admin'));

-- RLS Policies para profiles
-- Usuários podem ver seu próprio perfil
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- LEV users podem ver todos os perfis
CREATE POLICY "LEV users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_lev_user(auth.uid()));

-- Company admins podem ver perfis da sua empresa
CREATE POLICY "Company admins can view company profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'company_admin')
    AND company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- LEV admins podem gerenciar todos os perfis
CREATE POLICY "LEV admins can manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'lev_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'lev_admin'));

-- RLS Policies para user_roles
-- Usuários podem ver suas próprias roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- LEV admins podem ver todas as roles
CREATE POLICY "LEV admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'lev_admin'));

-- Apenas LEV admins podem gerenciar roles
CREATE POLICY "Only LEV admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'lev_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'lev_admin'));