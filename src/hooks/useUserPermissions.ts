import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const useUserPermissions = (projectId?: string) => {
  const { user } = useAuth();

  const { data: userRoles } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (error) throw error;
      return data.map((r) => r.role);
    },
    enabled: !!user?.id,
  });

  const { data: projectPermissions } = useQuery({
    queryKey: ["project-permissions", user?.id, projectId],
    queryFn: async () => {
      if (!user?.id || !projectId) return null;

      const { data, error } = await supabase
        .from("project_members")
        .select(`
          *,
          project_profiles:profile_id (
            permissions
          )
        `)
        .eq("user_id", user.id)
        .eq("project_id", projectId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !!projectId,
  });

  const isLevUser = userRoles?.includes("lev_admin") || userRoles?.includes("lev_user");
  const isCompanyAdmin = userRoles?.includes("company_admin");

  const hasProjectPermission = (module: string, action: string): boolean => {
    // LEV users have full access
    if (isLevUser) return true;

    // Company admins have full access to their projects
    if (isCompanyAdmin) return true;

    // Check project-specific permissions
    if (!projectPermissions) return false;

    const customPerms = projectPermissions.custom_permissions as any;
    const profilePerms = projectPermissions.project_profiles?.permissions as any;

    // Custom permissions override profile permissions
    if (customPerms?.[module]?.[action] !== undefined) {
      return customPerms[module][action];
    }

    // Fallback to profile permissions
    return profilePerms?.[module]?.[action] || false;
  };

  return {
    isLevUser,
    isCompanyAdmin,
    hasProjectPermission,
    projectPermissions,
  };
};
