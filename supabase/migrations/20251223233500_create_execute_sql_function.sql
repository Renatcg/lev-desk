-- Create function to execute SQL (requires service role)
CREATE OR REPLACE FUNCTION execute_sql_admin(sql_query TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE sql_query;
  result := json_build_object('success', true, 'message', 'SQL executed successfully');
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  result := json_build_object('success', false, 'error', SQLERRM);
  RETURN result;
END;
$$;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION execute_sql_admin(TEXT) TO service_role;
