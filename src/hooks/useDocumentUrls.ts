import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProjectDocument } from "./useProjectDocuments";

interface CachedUrl {
  url: string;
  expiresAt: number;
}

export const useDocumentUrls = (documents: ProjectDocument[]) => {
  const urlCacheRef = useRef<Map<string, CachedUrl>>(new Map());
  const [isPreloading, setIsPreloading] = useState(false);

  useEffect(() => {
    if (!documents || documents.length === 0) return;

    const preloadUrls = async () => {
      setIsPreloading(true);
      const now = Date.now();
      
      // Gera URLs em paralelo para todos os documentos que não estão no cache ou expiraram
      const urlPromises = documents.map(async (doc) => {
        const cached = urlCacheRef.current.get(doc.id);
        if (cached && cached.expiresAt > now) {
          return; // URL ainda válida no cache
        }

        try {
          const { data } = await supabase.storage
            .from(doc.bucket_name)
            .createSignedUrl(doc.file_path, 3600); // 1 hora de validade

          if (data?.signedUrl) {
            // Armazena no cache com 50 minutos de validade (margem de segurança)
            urlCacheRef.current.set(doc.id, {
              url: data.signedUrl,
              expiresAt: now + 50 * 60 * 1000,
            });
          }
        } catch (error) {
          console.error(`Error preloading URL for document ${doc.id}:`, error);
        }
      });

      await Promise.all(urlPromises);
      setIsPreloading(false);
    };

    preloadUrls();
  }, [documents]);

  const getDocumentUrl = async (document: ProjectDocument): Promise<string | null> => {
    const now = Date.now();
    const cached = urlCacheRef.current.get(document.id);

    // Retorna do cache se ainda válido
    if (cached && cached.expiresAt > now) {
      return cached.url;
    }

    // Gera nova URL se não está no cache ou expirou
    try {
      const { data } = await supabase.storage
        .from(document.bucket_name)
        .createSignedUrl(document.file_path, 3600);

      if (data?.signedUrl) {
        urlCacheRef.current.set(document.id, {
          url: data.signedUrl,
          expiresAt: now + 50 * 60 * 1000,
        });
        return data.signedUrl;
      }
    } catch (error) {
      console.error("Error getting document URL:", error);
    }

    return null;
  };

  const clearCache = () => {
    urlCacheRef.current.clear();
  };

  return {
    getDocumentUrl,
    clearCache,
    isPreloading,
  };
};
