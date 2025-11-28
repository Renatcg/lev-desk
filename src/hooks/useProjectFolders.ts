import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProjectFolder {
  id: string;
  project_id: string;
  parent_folder_id: string | null;
  name: string;
  description: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export const useProjectFolders = (projectId: string) => {
  const queryClient = useQueryClient();

  const { data: folders, isLoading } = useQuery({
    queryKey: ["project-folders", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_folders")
        .select("*")
        .eq("project_id", projectId)
        .order("order_index");

      if (error) throw error;
      return data as ProjectFolder[];
    },
  });

  const createFolder = useMutation({
    mutationFn: async (folder: {
      name: string;
      description?: string;
      parent_folder_id?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("project_folders")
        .insert({
          project_id: projectId,
          name: folder.name,
          description: folder.description,
          parent_folder_id: folder.parent_folder_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-folders", projectId] });
      toast.success("Pasta criada com sucesso");
    },
    onError: (error) => {
      console.error("Error creating folder:", error);
      toast.error("Erro ao criar pasta");
    },
  });

  const updateFolder = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<ProjectFolder, "name" | "description" | "parent_folder_id">>;
    }) => {
      const { data, error } = await supabase
        .from("project_folders")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-folders", projectId] });
      toast.success("Pasta atualizada com sucesso");
    },
    onError: (error) => {
      console.error("Error updating folder:", error);
      toast.error("Erro ao atualizar pasta");
    },
  });

  const deleteFolder = useMutation({
    mutationFn: async (folderId: string) => {
      const { error } = await supabase
        .from("project_folders")
        .delete()
        .eq("id", folderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-folders", projectId] });
      toast.success("Pasta excluída com sucesso");
    },
    onError: (error) => {
      console.error("Error deleting folder:", error);
      toast.error("Erro ao excluir pasta");
    },
  });

  return {
    folders: folders || [],
    isLoading,
    createFolder,
    updateFolder,
    deleteFolder,
  };
};
