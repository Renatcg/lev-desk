import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Building2, LayoutDashboard, MapPin, Users, FileText, Briefcase, Settings, LogOut, Moon, Sun, DollarSign, Palette, Zap, Archive, ChevronDown, ChevronRight, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import levLogo from "@/assets/lev-logo.png";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { settings, loading } = useSystemSettings();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const logoUrl = theme === "dark" 
    ? (settings?.logo_dark_url || settings?.logo_url || levLogo)
    : (settings?.logo_url || levLogo);

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Logout realizado",
      description: "Você saiu do sistema com sucesso.",
    });
  };

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    administrativo: false,
    configuracoes: false,
    antigas: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Projetos", href: "/projects", icon: Building2 },
    { 
      name: "Administrativo", 
      icon: Briefcase,
      key: "administrativo",
      children: [
        { name: "Contratos", href: "/contracts", icon: FileText },
        { name: "Financeiro", href: "/financial", icon: DollarSign },
        { name: "Conciliação Bancária", href: "/conciliacao", icon: DollarSign },
      ]
    },
    { 
      name: "Configurações", 
      icon: Settings,
      key: "configuracoes",
      children: [
        { name: "Usuários", href: "/users", icon: Users },
        { name: "Layout do Sistema", href: "/settings/layout", icon: Palette },
        { name: "Automações", href: "/settings/automations", icon: Zap },
      ]
    },
    { 
      name: "Páginas Antigas", 
      icon: Archive,
      key: "antigas",
      children: [
        { name: "LandBank", href: "/landbank", icon: MapPin },
        { name: "Grupos Econômicos", href: "/grupos-economicos", icon: Building2 },
        { name: "CRM", href: "/crm", icon: Briefcase },
        { name: "Documentos", href: "/documents", icon: FileText },
      ]
    },
  ];

  const renderNavigation = () => (
    <nav className="flex-1 space-y-1 p-4">
      {navigation.map((item) => {
        const Icon = item.icon;
        
        if ('children' in item && item.children) {
          const hasActiveChild = item.children.some(
            child => location.pathname === child.href || location.pathname.startsWith(child.href + '/')
          );
          const isOpen = openSections[item.key || ''] || hasActiveChild;
          
          return (
            <Collapsible
              key={item.name}
              open={isOpen}
              onOpenChange={() => toggleSection(item.key || '')}
            >
              <CollapsibleTrigger
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  hasActiveChild
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1 text-left">{item.name}</span>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-1 pt-1">
                {item.children.map((child) => {
                  const ChildIcon = child.icon;
                  const isActive = location.pathname === child.href || location.pathname.startsWith(child.href + '/');
                  return (
                    <Link
                      key={child.name}
                      to={child.href}
                      onClick={() => isMobile && setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ml-6",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <ChildIcon className="h-4 w-4" />
                      {child.name}
                    </Link>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          );
        }
        
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => isMobile && setMobileMenuOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  const renderUserProfile = () => (
    <div className="border-t p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
          {user?.email?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {user?.user_metadata?.name || "Usuário"}
          </p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
        {settings?.allow_theme_toggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-8 w-8"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start"
        onClick={handleSignOut}
      >
        <LogOut className="h-4 w-4 mr-2" />
        Sair
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 h-16 border-b bg-card z-50 flex items-center px-4">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex h-full flex-col">
                <div className="flex h-16 items-center gap-3 border-b px-6">
                  <img src={logoUrl} alt="LEV" className="h-8 w-auto" />
                </div>
                {renderNavigation()}
                {renderUserProfile()}
              </div>
            </SheetContent>
          </Sheet>
          <img src={logoUrl} alt="LEV" className="h-8 w-auto ml-4" />
        </header>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="fixed left-0 top-0 h-full w-64 border-r bg-card">
          <div className="flex h-full flex-col">
            <div className="flex h-16 items-center gap-3 border-b px-6">
              <img src={logoUrl} alt="LEV" className="h-8 w-auto" />
            </div>
            {renderNavigation()}
            {renderUserProfile()}
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className={cn(
        "min-h-screen p-8",
        isMobile ? "pt-24" : "ml-64"
      )}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
