import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useProjectMembers = (projectId: string) => {
  const { data: members, isLoading } = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_members")
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            email,
            phone
          ),
          project_profiles:profile_id (
            id,
            name,
            description,
            permissions
          )
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  return { members, isLoading };
};
