import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Upload, Palette, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function Settings() {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");
  const [secondaryColor, setSecondaryColor] = useState("#8b5cf6");
  const [allowThemeToggle, setAllowThemeToggle] = useState(true);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you'd upload this to storage
      toast({
        title: "Logo atualizada",
        description: "A nova logo foi carregada com sucesso.",
      });
    }
  };

  const handleFaviconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you'd upload this and update the link tag
      toast({
        title: "Favicon atualizado",
        description: "O novo favicon foi carregado com sucesso.",
      });
    }
  };

  const handleSaveColors = () => {
    // In a real app, you'd save these to a database and update CSS variables
    document.documentElement.style.setProperty('--primary', primaryColor);
    document.documentElement.style.setProperty('--secondary', secondaryColor);
    
    toast({
      title: "Cores atualizadas",
      description: "As cores do sistema foram salvas com sucesso.",
    });
  };

  const handleSaveThemeSettings = () => {
    // In a real app, you'd save this preference to database
    localStorage.setItem('allowThemeToggle', allowThemeToggle.toString());
    
    toast({
      title: "Configurações salvas",
      description: "As preferências de tema foram atualizadas.",
    });
  };

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

            <Button onClick={handleSaveColors}>
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
              <div className="flex items-center gap-4">
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="flex-1"
                />
                <Button variant="outline" size="sm">
                  Upload
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Recomendado: PNG ou SVG, tamanho máximo 2MB
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="favicon-upload">Favicon</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="favicon-upload"
                  type="file"
                  accept="image/x-icon,image/png"
                  onChange={handleFaviconUpload}
                  className="flex-1"
                />
                <Button variant="outline" size="sm">
                  Upload
                </Button>
              </div>
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
              {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              Tema e Aparência
            </CardTitle>
            <CardDescription>
              Configure o tema e permissões de alteração pelos usuários
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Tema Atual</Label>
                <p className="text-sm text-muted-foreground">
                  {theme === "dark" ? "Modo Escuro" : "Modo Claro"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("light")}
                >
                  <Sun className="h-4 w-4 mr-2" />
                  Claro
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="h-4 w-4 mr-2" />
                  Escuro
                </Button>
              </div>
            </div>

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

            <Button onClick={handleSaveThemeSettings}>
              Salvar Preferências de Tema
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
