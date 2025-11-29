-- Create project_profiles table for permission profiles
CREATE TABLE IF NOT EXISTS public.project_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.project_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_profiles
CREATE POLICY "LEV admins can manage all profiles" ON public.project_profiles
  FOR ALL USING (has_role(auth.uid(), 'lev_admin'));

CREATE POLICY "Authenticated users can view active profiles" ON public.project_profiles
  FOR SELECT USING (is_active = true AND auth.uid() IS NOT NULL);

-- Insert default profiles
INSERT INTO public.project_profiles (name, description, permissions) VALUES
('Administrador', 'Acesso total ao projeto', '{
  "overview": {"read": true},
  "terrenos": {"create": true, "read": true, "update": true, "delete": true},
  "documents": {"create": true, "read": true, "update": true, "delete": true},
  "history": {"read": true},
  "team": {"create": true, "read": true, "update": true, "delete": true}
}'::jsonb),
('Assistente', 'Acesso limitado de visualização e documentos', '{
  "overview": {"read": true},
  "terrenos": {"read": true},
  "documents": {"read": true, "create": true},
  "history": {"read": true},
  "team": {"read": true}
}'::jsonb);

-- Create project_members table
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.project_profiles(id),
  cargo TEXT,
  whatsapp TEXT,
  custom_permissions JSONB,
  invite_token TEXT,
  invite_expires_at TIMESTAMPTZ,
  invited_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_members
CREATE POLICY "LEV admins can manage all members" ON public.project_members
  FOR ALL USING (has_role(auth.uid(), 'lev_admin'));

CREATE POLICY "Company admins can manage project members" ON public.project_members
  FOR ALL USING (
    has_role(auth.uid(), 'company_admin') AND
    project_id IN (SELECT id FROM public.projects WHERE company_id = get_user_company_id(auth.uid()))
  );

CREATE POLICY "Members can view project members" ON public.project_members
  FOR SELECT USING (
    project_id IN (SELECT project_id FROM public.project_members WHERE user_id = auth.uid())
  );

-- Create function to check project permissions
CREATE OR REPLACE FUNCTION public.has_project_permission(
  _user_id UUID, 
  _project_id UUID, 
  _module TEXT, 
  _action TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  _permissions JSONB;
  _custom_permissions JSONB;
BEGIN
  -- Check if user is LEV admin (full access)
  IF has_role(_user_id, 'lev_admin') THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is company admin for this project
  IF has_role(_user_id, 'company_admin') AND 
     EXISTS (SELECT 1 FROM public.projects WHERE id = _project_id AND company_id = get_user_company_id(_user_id)) THEN
    RETURN TRUE;
  END IF;
  
  -- Get profile and custom permissions
  SELECT 
    pp.permissions,
    pm.custom_permissions
  INTO _permissions, _custom_permissions
  FROM public.project_members pm
  JOIN public.project_profiles pp ON pp.id = pm.profile_id
  WHERE pm.user_id = _user_id AND pm.project_id = _project_id;
  
  IF NOT FOUND THEN RETURN FALSE; END IF;
  
  -- Custom permissions override profile permissions
  IF _custom_permissions IS NOT NULL AND 
     _custom_permissions->_module->_action IS NOT NULL THEN
    RETURN (_custom_permissions->_module->>_action)::boolean;
  END IF;
  
  RETURN COALESCE((_permissions->_module->>_action)::boolean, FALSE);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Add trigger for updated_at
CREATE TRIGGER update_project_members_updated_at
  BEFORE UPDATE ON public.project_members
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();