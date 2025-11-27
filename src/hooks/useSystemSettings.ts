import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SystemSettings {
  id: string;
  logo_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  primary_color_h: number;
  primary_color_s: number;
  primary_color_l: number;
  secondary_color_h: number;
  secondary_color_s: number;
  secondary_color_l: number;
  allow_theme_toggle: boolean;
}

const LOGO_CACHE_KEY = "system_logo_url";
const LOGO_DARK_CACHE_KEY = "system_logo_dark_url";
const FAVICON_CACHE_KEY = "system_favicon_url";

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(() => {
    // Load cached logo URLs on mount
    try {
      const cachedLogoUrl = localStorage.getItem(LOGO_CACHE_KEY);
      const cachedLogoDarkUrl = localStorage.getItem(LOGO_DARK_CACHE_KEY);
      const cachedFaviconUrl = localStorage.getItem(FAVICON_CACHE_KEY);
      
      if (cachedLogoUrl || cachedLogoDarkUrl || cachedFaviconUrl) {
        return {
          id: '',
          logo_url: cachedLogoUrl,
          logo_dark_url: cachedLogoDarkUrl,
          favicon_url: cachedFaviconUrl,
          primary_color_h: 222,
          primary_color_s: 47,
          primary_color_l: 11,
          secondary_color_h: 210,
          secondary_color_s: 40,
          secondary_color_l: 96,
          allow_theme_toggle: true,
        } as SystemSettings;
      }
    } catch (error) {
      console.error("Error loading cached settings:", error);
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .single();

      if (error) throw error;

      if (data) {
        setSettings(data);
        applyColors(data);
        
        // Cache logo URLs in localStorage
        try {
          if (data.logo_url) {
            localStorage.setItem(LOGO_CACHE_KEY, data.logo_url);
          }
          if (data.logo_dark_url) {
            localStorage.setItem(LOGO_DARK_CACHE_KEY, data.logo_dark_url);
          }
          if (data.favicon_url) {
            localStorage.setItem(FAVICON_CACHE_KEY, data.favicon_url);
          }
        } catch (error) {
          console.error("Error caching settings:", error);
        }
      }
    } catch (error) {
      console.error("Error loading system settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyColors = (settings: SystemSettings) => {
    const root = document.documentElement;
    root.style.setProperty(
      "--primary",
      `${settings.primary_color_h} ${settings.primary_color_s}% ${settings.primary_color_l}%`
    );
    root.style.setProperty(
      "--secondary",
      `${settings.secondary_color_h} ${settings.secondary_color_s}% ${settings.secondary_color_l}%`
    );
  };

  const uploadFile = async (file: File, type: "logo" | "logo_dark" | "favicon") => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${type}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("branding")
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("branding").getPublicUrl(filePath);

    return publicUrl;
  };

  const updateSettings = async (updates: Partial<SystemSettings>) => {
    if (!settings) return;

    const { error } = await supabase
      .from("system_settings")
      .update(updates)
      .eq("id", settings.id);

    if (error) throw error;

    const updatedSettings = { ...settings, ...updates } as SystemSettings;
    setSettings(updatedSettings);
    
    if (
      updates.primary_color_h !== undefined ||
      updates.secondary_color_h !== undefined
    ) {
      applyColors(updatedSettings);
    }
  };

  return {
    settings,
    loading,
    loadSettings,
    updateSettings,
    uploadFile,
  };
}
