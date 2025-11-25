import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useFavicon() {
  useEffect(() => {
    const loadFavicon = async () => {
      try {
        const { data, error } = await supabase
          .from("system_settings")
          .select("favicon_url")
          .single();

        if (error) {
          console.error("Error loading favicon:", error);
          return;
        }

        if (data?.favicon_url) {
          updateFaviconLink(data.favicon_url);
        }
      } catch (error) {
        console.error("Error loading favicon:", error);
      }
    };

    loadFavicon();
  }, []);
}

const updateFaviconLink = (faviconUrl: string) => {
  // Remove existing favicon links
  const existingLinks = document.querySelectorAll("link[rel*='icon']");
  existingLinks.forEach(link => link.remove());

  // Create new favicon link
  const newLink = document.createElement("link");
  newLink.rel = "icon";
  newLink.type = "image/x-icon";
  newLink.href = faviconUrl;
  document.head.appendChild(newLink);
};
