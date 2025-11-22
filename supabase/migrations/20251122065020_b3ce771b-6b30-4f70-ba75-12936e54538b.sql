-- Create storage buckets for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('project-documents', 'project-documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('landbank-documents', 'landbank-documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('company-documents', 'company-documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('temp-ai-uploads', 'temp-ai-uploads', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'audio/webm', 'audio/wav', 'audio/mp3']);

-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  bucket_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size BIGINT,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.profiles(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for documents
CREATE POLICY "Users can view documents from their company"
  ON public.documents FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "LEV users can view all documents"
  ON public.documents FOR SELECT
  USING (is_lev_user(auth.uid()));

CREATE POLICY "Users can upload documents to their company"
  ON public.documents FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "LEV admins can manage all documents"
  ON public.documents FOR ALL
  USING (has_role(auth.uid(), 'lev_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'lev_admin'::app_role));

-- Storage policies for project-documents bucket
CREATE POLICY "Users can view their company project documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'project-documents' AND
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can upload project documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-documents' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "LEV users can manage all project documents"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'project-documents' AND
    is_lev_user(auth.uid())
  );

-- Storage policies for landbank-documents bucket
CREATE POLICY "Users can view their company landbank documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'landbank-documents' AND
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can upload landbank documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'landbank-documents' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "LEV users can manage all landbank documents"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'landbank-documents' AND
    is_lev_user(auth.uid())
  );

-- Storage policies for company-documents bucket
CREATE POLICY "Users can view their company documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'company-documents' AND
    auth.uid() IN (
      SELECT id FROM public.profiles 
      WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can upload company documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'company-documents' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "LEV users can manage all company documents"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'company-documents' AND
    is_lev_user(auth.uid())
  );

-- Storage policies for temp-ai-uploads bucket (temporary files for AI processing)
CREATE POLICY "Users can upload temp files for AI"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'temp-ai-uploads' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can view their temp files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'temp-ai-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their temp files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'temp-ai-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create projects table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'viability',
  address TEXT,
  area NUMERIC,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view projects from their company"
  ON public.projects FOR SELECT
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "LEV users can view all projects"
  ON public.projects FOR SELECT
  USING (is_lev_user(auth.uid()));

CREATE POLICY "Users can create projects for their company"
  ON public.projects FOR INSERT
  WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update projects from their company"
  ON public.projects FOR UPDATE
  USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "LEV admins can manage all projects"
  ON public.projects FOR ALL
  USING (has_role(auth.uid(), 'lev_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'lev_admin'::app_role));

-- Create trigger for updated_at on documents
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create trigger for updated_at on projects
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();