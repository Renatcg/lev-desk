-- Create project_folders table for hierarchical folder structure
CREATE TABLE public.project_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_folder_id uuid REFERENCES public.project_folders(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  order_index integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create project_documents table
CREATE TABLE public.project_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES public.project_folders(id) ON DELETE SET NULL,
  name text NOT NULL,
  file_path text NOT NULL,
  bucket_name text NOT NULL DEFAULT 'project-documents',
  mime_type text NOT NULL,
  size bigint,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  uploaded_by uuid REFERENCES auth.users(id)
);

-- Create document_permissions table
CREATE TABLE public.document_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES public.project_documents(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES public.project_folders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  can_view boolean DEFAULT true,
  can_download boolean DEFAULT false,
  can_share boolean DEFAULT false,
  granted_by uuid REFERENCES auth.users(id),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT check_document_or_folder CHECK (
    (document_id IS NOT NULL AND folder_id IS NULL) OR 
    (document_id IS NULL AND folder_id IS NOT NULL)
  )
);

-- Create document_access_logs table
CREATE TABLE public.document_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.project_documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  accessed_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.project_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_folders
CREATE POLICY "Users can view folders from their company projects"
  ON public.project_folders FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create folders in their company projects"
  ON public.project_folders FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects
      WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update folders in their company projects"
  ON public.project_folders FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete folders in their company projects"
  ON public.project_folders FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "LEV admins can manage all folders"
  ON public.project_folders FOR ALL
  USING (has_role(auth.uid(), 'lev_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'lev_admin'::app_role));

CREATE POLICY "LEV users can view all folders"
  ON public.project_folders FOR SELECT
  USING (is_lev_user(auth.uid()));

-- RLS Policies for project_documents
CREATE POLICY "Users can view documents from their company projects"
  ON public.project_documents FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can upload documents to their company projects"
  ON public.project_documents FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects
      WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update documents in their company projects"
  ON public.project_documents FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete documents in their company projects"
  ON public.project_documents FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM public.projects
      WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "LEV admins can manage all documents"
  ON public.project_documents FOR ALL
  USING (has_role(auth.uid(), 'lev_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'lev_admin'::app_role));

CREATE POLICY "LEV users can view all documents"
  ON public.project_documents FOR SELECT
  USING (is_lev_user(auth.uid()));

-- RLS Policies for document_permissions
CREATE POLICY "Users can view permissions for their company documents"
  ON public.document_permissions FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM public.project_documents
      WHERE project_id IN (
        SELECT id FROM public.projects
        WHERE company_id IN (
          SELECT company_id FROM public.profiles WHERE id = auth.uid()
        )
      )
    )
    OR
    folder_id IN (
      SELECT id FROM public.project_folders
      WHERE project_id IN (
        SELECT id FROM public.projects
        WHERE company_id IN (
          SELECT company_id FROM public.profiles WHERE id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Company admins can manage permissions"
  ON public.document_permissions FOR ALL
  USING (
    has_role(auth.uid(), 'company_admin'::app_role) AND
    (
      document_id IN (
        SELECT id FROM public.project_documents
        WHERE project_id IN (
          SELECT id FROM public.projects
          WHERE company_id = get_user_company_id(auth.uid())
        )
      )
      OR
      folder_id IN (
        SELECT id FROM public.project_folders
        WHERE project_id IN (
          SELECT id FROM public.projects
          WHERE company_id = get_user_company_id(auth.uid())
        )
      )
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'company_admin'::app_role) AND
    (
      document_id IN (
        SELECT id FROM public.project_documents
        WHERE project_id IN (
          SELECT id FROM public.projects
          WHERE company_id = get_user_company_id(auth.uid())
        )
      )
      OR
      folder_id IN (
        SELECT id FROM public.project_folders
        WHERE project_id IN (
          SELECT id FROM public.projects
          WHERE company_id = get_user_company_id(auth.uid())
        )
      )
    )
  );

CREATE POLICY "LEV admins can manage all permissions"
  ON public.document_permissions FOR ALL
  USING (has_role(auth.uid(), 'lev_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'lev_admin'::app_role));

-- RLS Policies for document_access_logs
CREATE POLICY "Users can view access logs for their company documents"
  ON public.document_access_logs FOR SELECT
  USING (
    document_id IN (
      SELECT id FROM public.project_documents
      WHERE project_id IN (
        SELECT id FROM public.projects
        WHERE company_id IN (
          SELECT company_id FROM public.profiles WHERE id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert their own access logs"
  ON public.document_access_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "LEV admins can view all access logs"
  ON public.document_access_logs FOR SELECT
  USING (has_role(auth.uid(), 'lev_admin'::app_role));

-- Storage policies for project-documents bucket
CREATE POLICY "Users can view documents from their company"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'project-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.projects
      WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can upload documents to their company projects"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.projects
      WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update documents in their company projects"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'project-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.projects
      WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete documents in their company projects"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'project-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.projects
      WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "LEV admins can manage all storage objects"
  ON storage.objects FOR ALL
  USING (bucket_id = 'project-documents' AND has_role(auth.uid(), 'lev_admin'::app_role))
  WITH CHECK (bucket_id = 'project-documents' AND has_role(auth.uid(), 'lev_admin'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_project_folders_updated_at
  BEFORE UPDATE ON public.project_folders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_project_documents_updated_at
  BEFORE UPDATE ON public.project_documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for better performance
CREATE INDEX idx_project_folders_project_id ON public.project_folders(project_id);
CREATE INDEX idx_project_folders_parent_folder_id ON public.project_folders(parent_folder_id);
CREATE INDEX idx_project_documents_project_id ON public.project_documents(project_id);
CREATE INDEX idx_project_documents_folder_id ON public.project_documents(folder_id);
CREATE INDEX idx_document_permissions_document_id ON public.document_permissions(document_id);
CREATE INDEX idx_document_permissions_folder_id ON public.document_permissions(folder_id);
CREATE INDEX idx_document_permissions_user_id ON public.document_permissions(user_id);
CREATE INDEX idx_document_access_logs_document_id ON public.document_access_logs(document_id);
CREATE INDEX idx_document_access_logs_user_id ON public.document_access_logs(user_id);
CREATE INDEX idx_document_access_logs_accessed_at ON public.document_access_logs(accessed_at DESC);