-- Remove plaintext temp_password column from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS temp_password;

-- Restrict system_settings access to authenticated users only
DROP POLICY IF EXISTS "Anyone can view system settings" ON public.system_settings;

CREATE POLICY "Authenticated users can view system settings" 
ON public.system_settings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);