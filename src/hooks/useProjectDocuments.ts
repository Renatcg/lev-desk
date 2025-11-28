import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProjectDocument {
  id: string;
  project_id: string;
  folder_id: string | null;
  name: string;
  file_path: string;
  bucket_name: string;
  mime_type: string;
  size: number | null;
  description: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  uploaded_by: string | null;
}

const sanitizeFileName = (fileName: string): string => {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, '_') // Espaços → underscores
    .replace(/[^a-zA-Z0-9._-]/g, ''); // Remove caracteres especiais
};

export const useProjectDocuments = (projectId: string) => {
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery({
    queryKey: ["project-documents", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_documents")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProjectDocument[];
    },
  });

  const uploadDocument = useMutation({
    mutationFn: async ({
      file,
      folderId,
      description,
    }: {
      file: File;
      folderId?: string | null;
      description?: string;
    }) => {
      const sanitizedFileName = sanitizeFileName(file.name);
      const filePath = `${projectId}/${Date.now()}_${sanitizedFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("project-documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data, error } = await supabase
        .from("project_documents")
        .insert({
          project_id: projectId,
          folder_id: folderId,
          name: file.name,
          file_path: filePath,
          bucket_name: "project-documents",
          mime_type: file.type,
          size: file.size,
          description,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-documents", projectId] });
      toast.success("Documento enviado com sucesso");
    },
    onError: (error) => {
      console.error("Error uploading document:", error);
      toast.error("Erro ao enviar documento");
    },
  });

  const updateDocument = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Pick<ProjectDocument, "name" | "description">> }) => {
      const { data, error } = await supabase
        .from("project_documents")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-documents", projectId] });
      toast.success("Documento atualizado com sucesso");
    },
    onError: (error) => {
      console.error("Error updating document:", error);
      toast.error("Erro ao atualizar documento");
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (document: ProjectDocument) => {
      const { error: storageError } = await supabase.storage
        .from(document.bucket_name)
        .remove([document.file_path]);

      if (storageError) throw storageError;

      const { error } = await supabase
        .from("project_documents")
        .delete()
        .eq("id", document.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-documents", projectId] });
      toast.success("Documento excluído com sucesso");
    },
    onError: (error) => {
      console.error("Error deleting document:", error);
      toast.error("Erro ao excluir documento");
    },
  });

  const getDocumentUrl = async (document: ProjectDocument) => {
    const { data } = await supabase.storage
      .from(document.bucket_name)
      .createSignedUrl(document.file_path, 3600);

    return data?.signedUrl;
  };

  const downloadDocument = async (doc: ProjectDocument) => {
    const url = await getDocumentUrl(doc);
    if (url) {
      const link = window.document.createElement("a");
      link.href = url;
      link.download = doc.name;
      link.click();
    }
  };

  return {
    documents: documents || [],
    isLoading,
    uploadDocument,
    updateDocument,
    deleteDocument,
    getDocumentUrl,
    downloadDocument,
  };
};
