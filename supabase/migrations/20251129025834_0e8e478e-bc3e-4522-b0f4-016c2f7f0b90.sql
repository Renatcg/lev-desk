-- 1. Create helper function that bypasses RLS to get user's project IDs
CREATE OR REPLACE FUNCTION public.get_user_project_ids(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT project_id FROM public.project_members WHERE user_id = _user_id;
$$;

-- 2. Drop the problematic policy
DROP POLICY IF EXISTS "Members can view project members" ON public.project_members;

-- 3. Recreate the policy using the helper function
CREATE POLICY "Members can view project members" ON public.project_members
  FOR SELECT USING (
    project_id IN (SELECT get_user_project_ids(auth.uid()))
  );