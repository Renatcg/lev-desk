import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Upload, Palette, Shield } from "lucide-react";
import { useSystemSettings } from "@/hooks/useSystemSettings";

export default function Settings() {
  const { toast } = useToast();
  const { settings, loading, updateSettings, uploadFile } = useSystemSettings();
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [secondaryColor, setSecondaryColor] = useState("#8b5cf6");
  const [allowThemeToggle, setAllowThemeToggle] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (settings) {
      // Convert HSL to HEX for color picker
      setPrimaryColor(hslToHex(settings.primary_color_h, settings.primary_color_s, settings.primary_color_l));
      setSecondaryColor(hslToHex(settings.secondary_color_h, settings.secondary_color_s, settings.secondary_color_l));
      setAllowThemeToggle(settings.allow_theme_toggle);
    }
  }, [settings]);

  const hslToHex = (h: number, s: number, l: number): string => {
    l /= 100;
    const a = (s * Math.min(l, 1 - l)) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color)
        .toString(16)
        .padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const hexToHsl = (hex: string): { h: number; s: number; l: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 0, s: 0, l: 0 };

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0,
      s = 0,
      l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const publicUrl = await uploadFile(file, "logo");
      await updateSettings({ logo_url: publicUrl });

      toast({
        title: "Logo atualizada",
        description: "A nova logo foi carregada com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao fazer upload",
        description: "Não foi possível atualizar a logo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFaviconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const publicUrl = await uploadFile(file, "favicon");
      await updateSettings({ favicon_url: publicUrl });

      // Update favicon in document
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) {
        link.href = publicUrl;
      }

      toast({
        title: "Favicon atualizado",
        description: "O novo favicon foi carregado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao fazer upload",
        description: "Não foi possível atualizar o favicon.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveColors = async () => {
    try {
      const primaryHsl = hexToHsl(primaryColor);
      const secondaryHsl = hexToHsl(secondaryColor);

      await updateSettings({
        primary_color_h: primaryHsl.h,
        primary_color_s: primaryHsl.s,
        primary_color_l: primaryHsl.l,
        secondary_color_h: secondaryHsl.h,
        secondary_color_s: secondaryHsl.s,
        secondary_color_l: secondaryHsl.l,
      });

      toast({
        title: "Cores atualizadas",
        description: "As cores do sistema foram salvas com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar as cores.",
        variant: "destructive",
      });
    }
  };

  const handleSaveThemeSettings = async () => {
    try {
      await updateSettings({ allow_theme_toggle: allowThemeToggle });

      toast({
        title: "Configurações salvas",
        description: "As preferências de tema foram atualizadas.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível atualizar as configurações.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">
          Personalize a aparência e comportamento do sistema
        </p>
      </div>

      <div className="grid gap-6">
        {/* Color Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Cores do Sistema
            </CardTitle>
            <CardDescription>
              Personalize as cores principais da interface
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color">Cor Primária</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary-color"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-20 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary-color">Cor Secundária</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary-color"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-20 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    placeholder="#8b5cf6"
                  />
                </div>
              </div>
            </div>

            <Button onClick={handleSaveColors} disabled={uploading}>
              Salvar Cores
            </Button>
          </CardContent>
        </Card>

        {/* Logo Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Logo e Favicon
            </CardTitle>
            <CardDescription>
              Personalize a identidade visual do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo-upload">Logo do Sistema</Label>
              {settings?.logo_url && (
                <div className="mb-2">
                  <img src={settings.logo_url} alt="Logo atual" className="h-12 w-auto" />
                </div>
              )}
              <Input
                id="logo-upload"
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={handleLogoUpload}
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground">
                Recomendado: PNG ou SVG, tamanho máximo 2MB
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="favicon-upload">Favicon</Label>
              <Input
                id="favicon-upload"
                type="file"
                accept="image/x-icon,image/png"
                onChange={handleFaviconUpload}
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground">
                Recomendado: ICO ou PNG 32x32, tamanho máximo 500KB
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permissões de Tema
            </CardTitle>
            <CardDescription>
              Configure se os usuários podem alterar o tema do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allow-theme-toggle">
                  Permitir usuários alterarem o tema
                </Label>
                <p className="text-sm text-muted-foreground">
                  Os usuários poderão escolher entre modo claro e escuro
                </p>
              </div>
              <Switch
                id="allow-theme-toggle"
                checked={allowThemeToggle}
                onCheckedChange={setAllowThemeToggle}
              />
            </div>

            <Button onClick={handleSaveThemeSettings} disabled={uploading}>
              Salvar Preferências
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
