import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, Outlet, useLocation } from "react-router-dom";
import { Component, useEffect, lazy, Suspense, type ErrorInfo, type ReactNode } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Contexts
import { ContentProvider } from "@/contexts/ContentContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { PatientPortalAuthProvider } from "@/contexts/PatientPortalAuthContext";
import { PatientPortalSettingsProvider } from "@/contexts/PatientPortalSettingsContext";

// Route modules load only when their URL is active.
const Index = lazy(() => import("./pages/Index"));
const ConsultasPage = lazy(() => import("./pages/ConsultasPage"));
const ResultadosPage = lazy(() => import("./pages/ResultadosPage"));
const LojaPage = lazy(() => import("./pages/LojaPage"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const ProdutoPage = lazy(() => import("./pages/ProdutoPage"));
const BookingPage = lazy(() => import("./pages/BookingPage"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentPending = lazy(() => import("./pages/PaymentPending"));
const PaymentFailure = lazy(() => import("./pages/PaymentFailure"));
const PrivacidadePage = lazy(() => import("./pages/PrivacidadePage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminLayout = lazy(() => import("@/components/admin/AdminLayout"));
const ProtectedRoute = lazy(() => import("@/components/admin/ProtectedRoute"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminPerfil = lazy(() => import("./pages/admin/AdminPerfil"));
const AdminHero = lazy(() => import("./pages/admin/AdminHero"));
const AdminSobre = lazy(() => import("./pages/admin/AdminSobre"));
const AdminServicos = lazy(() => import("./pages/admin/AdminServicos"));
const AdminPrecos = lazy(() => import("./pages/admin/AdminPrecos"));
const AdminHorarios = lazy(() => import("./pages/admin/AdminHorarios"));
const AdminDepoimentos = lazy(() => import("./pages/admin/AdminDepoimentos"));
const AdminFAQ = lazy(() => import("./pages/admin/AdminFAQ"));
const AdminCTA = lazy(() => import("./pages/admin/AdminCTA"));
const AdminContato = lazy(() => import("./pages/admin/AdminContato"));
const AdminModalidades = lazy(() => import("./pages/admin/AdminModalidades"));
const AdminProdutosDigitais = lazy(() => import("./pages/admin/AdminProdutosDigitais"));
const AdminResultados = lazy(() => import("./pages/admin/AdminResultados"));
const AdminSenha = lazy(() => import("./pages/admin/AdminSenha"));
const AdminPagamentos = lazy(() => import("./pages/admin/AdminPagamentos"));
const AdminDisponibilidade = lazy(() => import("./pages/admin/AdminDisponibilidade"));
const AdminAgendamentos = lazy(() => import("./pages/admin/AdminAgendamentos"));
const AdminBlog = lazy(() => import("./pages/admin/AdminBlog"));
const AdminPacientes = lazy(() => import("./pages/admin/AdminPacientes"));
const AdminPaciente = lazy(() => import("./pages/admin/AdminPaciente"));
const AdminPlanoAlimentar = lazy(() => import("./pages/admin/AdminPlanoAlimentar"));
const AdminRelatorioAntropometrico = lazy(() => import("./pages/admin/AdminRelatorioAntropometrico"));
const PatientLayout = lazy(() => import("./pages/admin/PatientLayout"));
const AdminAlimentos = lazy(() => import("./pages/admin/AdminAlimentos"));
const AdminBiblioteca = lazy(() => import("./pages/admin/AdminBiblioteca"));
const AdminTemplates = lazy(() => import("./pages/admin/AdminTemplates"));
const AdminTemplateEditor = lazy(() => import("./pages/admin/AdminTemplateEditor"));
const AdminFerramentas = lazy(() => import("./pages/admin/AdminFerramentas"));
const AdminLoja = lazy(() => import("./pages/admin/AdminLoja"));
const AdminDesconto = lazy(() => import("./pages/admin/AdminDesconto"));
const AdminDisparo = lazy(() => import("./pages/admin/AdminDisparo"));
const AdminLeads = lazy(() => import("./pages/admin/AdminLeads"));
const AdminAuditoria = lazy(() => import("./pages/admin/AdminAuditoria"));
const AdminOperacao = lazy(() => import("./pages/admin/AdminOperacao"));
const AdminPortal = lazy(() => import("./pages/admin/AdminPortal"));
const PatientPortalProtectedRoute = lazy(() => import("@/components/patient/PatientPortalProtectedRoute"));
const PatientPortalLogin = lazy(() => import("./pages/portal/PatientPortalLogin"));
const PatientPortalLayout = lazy(() => import("./pages/portal/PatientPortalLayout"));
const PatientPortalHome = lazy(() => import("./pages/portal/PatientPortalHome"));
const PatientPortalPlan = lazy(() => import("./pages/portal/PatientPortalPlan"));
const PatientPortalTraining = lazy(() => import("./pages/portal/PatientPortalTraining"));
const PatientPortalConsultas = lazy(() => import("./pages/portal/PatientPortalConsultas"));
const PatientPortalDocuments = lazy(() => import("./pages/portal/PatientPortalDocuments"));
const queryClient = new QueryClient();

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const RouteLoadingFallback = () => (
  <div className="flex min-h-[35vh] items-center justify-center p-6 text-sm text-muted-foreground" role="status" aria-live="polite">
    Carregando página…
  </div>
);

class RouteErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // A reload obtains the current hashed route chunk after a new deployment.
  }

  render(): ReactNode {
    if (this.state.failed) {
      return (
        <div className="flex min-h-[35vh] flex-col items-center justify-center gap-3 p-6 text-center" role="alert">
          <p className="text-sm text-muted-foreground">Não foi possível carregar esta página.</p>
          <button type="button" onClick={() => window.location.reload()} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
            Atualizar página
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const PatientPortalRoot = () => (
  <PatientPortalAuthProvider>
    <Outlet />
  </PatientPortalAuthProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ContentProvider>
      <PatientPortalSettingsProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <RouteErrorBoundary>
              <Suspense fallback={<RouteLoadingFallback />}>
              <Routes>
              {/* Landing page */}
              <Route path="/" element={<Index />} />

              {/* Public pages */}
              <Route path="/consultas" element={<ConsultasPage />} />
              <Route path="/resultados" element={<ResultadosPage />} />
              <Route path="/loja" element={<LojaPage />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/privacidade" element={<PrivacidadePage />} />

              {/* Product detail pages */}
              <Route path="/produto/:id" element={<ProdutoPage />} />

              {/* Booking page */}
              <Route path="/agendar/:planIndex" element={<BookingPage />} />

              {/* Patient portal */}
              <Route path="/portal" element={<PatientPortalRoot />}>
                <Route path="login" element={<PatientPortalLogin />} />
                <Route
                  element={
                    <PatientPortalProtectedRoute>
                      <PatientPortalLayout />
                    </PatientPortalProtectedRoute>
                  }
                >
                  <Route index element={<PatientPortalHome />} />
                  <Route path="plano" element={<PatientPortalPlan />} />
                  <Route path="treinos" element={<PatientPortalTraining />} />
                  <Route path="consultas" element={<PatientPortalConsultas />} />
                  <Route path="documentos" element={<PatientPortalDocuments />} />
                </Route>
              </Route>

              {/* Payment status pages */}
              <Route path="/pagamento/sucesso" element={<PaymentSuccess />} />
              <Route path="/pagamento/pendente" element={<PaymentPending />} />
              <Route path="/pagamento/erro" element={<PaymentFailure />} />

              {/* Admin login */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Admin panel (protected) */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="perfil" element={<AdminPerfil />} />
                <Route path="hero" element={<AdminHero />} />
                <Route path="sobre" element={<AdminSobre />} />
                <Route path="servicos" element={<AdminServicos />} />
                <Route path="precos" element={<AdminPrecos />} />
                <Route path="horarios" element={<AdminHorarios />} />
                <Route path="depoimentos" element={<AdminDepoimentos />} />
                <Route path="faq" element={<AdminFAQ />} />
                <Route path="cta" element={<AdminCTA />} />
                <Route path="auditoria" element={<AdminAuditoria />} />
                <Route path="operacao" element={<AdminOperacao />} />
                <Route path="portal" element={<AdminPortal />} />
                <Route path="contato" element={<AdminContato />} />
                <Route path="modalidades" element={<AdminModalidades />} />
                <Route path="produtos" element={<AdminProdutosDigitais />} />
                <Route path="resultados" element={<AdminResultados />} />
                <Route path="senha" element={<AdminSenha />} />
                <Route path="pagamentos" element={<AdminPagamentos />} />
                <Route path="disponibilidade" element={<AdminDisponibilidade />} />
                <Route path="agendamentos" element={<AdminAgendamentos />} />
                <Route path="blog" element={<AdminBlog />} />
                <Route path="pacientes" element={<AdminPacientes />} />
                {/* Patient sub-routes share ConsultationContext via PatientLayout */}
                <Route path="pacientes/:id" element={<PatientLayout />}>
                  <Route index element={<AdminPaciente />} />
                  <Route path="plano/:planId" element={<AdminPlanoAlimentar />} />
                  <Route path="relatorio-antropometrico" element={<AdminRelatorioAntropometrico />} />
                </Route>
                <Route path="alimentos" element={<AdminAlimentos />} />
                <Route path="biblioteca" element={<AdminBiblioteca />} />
                <Route path="modelos" element={<AdminTemplates />} />
                <Route path="modelos/:templateId" element={<AdminTemplateEditor />} />
                <Route path="loja" element={<AdminLoja />} />
                <Route path="desconto" element={<AdminDesconto />} />
                <Route path="disparo" element={<AdminDisparo />} />
                <Route path="leads" element={<AdminLeads />} />
                <Route path="ferramentas" element={<AdminFerramentas />} />
                {/* Fallback inside admin */}
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
              </RouteErrorBoundary>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </PatientPortalSettingsProvider>
    </ContentProvider>
  </QueryClientProvider>
);

export default App;
