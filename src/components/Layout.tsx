import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Building2, LayoutDashboard, MapPin, Users, FileText, Briefcase, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import levLogo from "@/assets/lev-logo.jpg";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "LandBank", href: "/landbank", icon: MapPin },
    { name: "Incorporação", href: "/projects", icon: Building2 },
    { name: "CRM", href: "/crm", icon: Briefcase },
    { name: "Documentos", href: "/documents", icon: FileText },
    { name: "Usuários", href: "/users", icon: Users },
    { name: "Configurações", href: "/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r bg-card">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-3 border-b px-6">
            <img src={levLogo} alt="LEV" className="h-8 w-auto" />
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
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

          {/* User Profile */}
          <div className="border-t p-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                LA
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">LEV Admin</p>
                <p className="text-xs text-muted-foreground truncate">admin@lev.com.br</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen p-8">{children}</main>
    </div>
  );
};

export default Layout;
