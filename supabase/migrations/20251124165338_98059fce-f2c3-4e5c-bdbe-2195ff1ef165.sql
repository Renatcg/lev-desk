-- Create security definer function to get user's company_id without recursion
CREATE OR REPLACE FUNCTION public.get_user_company_id(user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = user_id LIMIT 1;
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Company admins can view company profiles" ON public.profiles;

-- Recreate the policy using the security definer function
CREATE POLICY "Company admins can view company profiles"
ON public.profiles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'company_admin'::app_role) 
  AND company_id = public.get_user_company_id(auth.uid())
);