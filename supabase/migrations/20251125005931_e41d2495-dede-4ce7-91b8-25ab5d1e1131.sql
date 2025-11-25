-- Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url text,
  favicon_url text,
  primary_color_h integer DEFAULT 205,
  primary_color_s integer DEFAULT 40,
  primary_color_l integer DEFAULT 60,
  secondary_color_h integer DEFAULT 210,
  secondary_color_s integer DEFAULT 12,
  secondary_color_l integer DEFAULT 40,
  allow_theme_toggle boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read system settings
CREATE POLICY "Anyone can view system settings"
  ON public.system_settings
  FOR SELECT
  USING (true);

-- Only LEV admins can update system settings
CREATE POLICY "LEV admins can update system settings"
  ON public.system_settings
  FOR UPDATE
  USING (has_role(auth.uid(), 'lev_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'lev_admin'::app_role));

-- Only LEV admins can insert system settings
CREATE POLICY "LEV admins can insert system settings"
  ON public.system_settings
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'lev_admin'::app_role));

-- Create storage bucket for branding
INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for branding bucket
CREATE POLICY "Anyone can view branding files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'branding');

CREATE POLICY "LEV admins can upload branding files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'branding' AND
    has_role(auth.uid(), 'lev_admin'::app_role)
  );

CREATE POLICY "LEV admins can update branding files"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'branding' AND
    has_role(auth.uid(), 'lev_admin'::app_role)
  );

CREATE POLICY "LEV admins can delete branding files"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'branding' AND
    has_role(auth.uid(), 'lev_admin'::app_role)
  );

-- Insert default settings (single row)
INSERT INTO public.system_settings (
  primary_color_h,
  primary_color_s,
  primary_color_l,
  secondary_color_h,
  secondary_color_s,
  secondary_color_l,
  allow_theme_toggle
) VALUES (
  205, 40, 60,
  210, 12, 40,
  true
);