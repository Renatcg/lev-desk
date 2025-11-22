import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LandBank from "./pages/LandBank";
import Projects from "./pages/Projects";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <Layout>
                <Dashboard />
              </Layout>
            }
          />
          <Route
            path="/landbank"
            element={
              <Layout>
                <LandBank />
              </Layout>
            }
          />
          <Route
            path="/projects"
            element={
              <Layout>
                <Projects />
              </Layout>
            }
          />
          <Route
            path="/crm"
            element={
              <Layout>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold mb-2">CRM</h2>
                  <p className="text-muted-foreground">Em desenvolvimento</p>
                </div>
              </Layout>
            }
          />
          <Route
            path="/documents"
            element={
              <Layout>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold mb-2">Documentos</h2>
                  <p className="text-muted-foreground">Em desenvolvimento</p>
                </div>
              </Layout>
            }
          />
          <Route
            path="/users"
            element={
              <Layout>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold mb-2">Usuários</h2>
                  <p className="text-muted-foreground">Em desenvolvimento</p>
                </div>
              </Layout>
            }
          />
          <Route
            path="/settings"
            element={
              <Layout>
                <div className="text-center py-12">
                  <h2 className="text-2xl font-bold mb-2">Configurações</h2>
                  <p className="text-muted-foreground">Em desenvolvimento</p>
                </div>
              </Layout>
            }
          />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
