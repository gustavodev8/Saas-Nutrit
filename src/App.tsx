import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, Outlet, useLocation } from "react-router-dom";
import { Component, useEffect, lazy, Suspense, type ErrorInfo, type ReactNode } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Contexts
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ContentProvider } from "@/contexts/ContentContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { PatientPortalAuthProvider } from "@/contexts/PatientPortalAuthContext";
import { PatientPortalSettingsProvider } from "@/contexts/PatientPortalSettingsContext";
import { WorkspaceAuthProvider } from "@/contexts/WorkspaceAuthContext";
import { SaaSPilotRouteGate } from "@/components/SaaSPilotRouteGate";
import { isSaaSPilotModeEnabled } from "@/lib/saasPilotMode";

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

// Workspace (SaaS)
const WorkspaceLogin = lazy(() => import("./pages/workspace/WorkspaceLogin"));
const WorkspaceForgotPasswordPage = lazy(() => import("./pages/workspace/WorkspaceForgotPasswordPage"));
const WorkspacePatientsPage = lazy(() => import("./pages/workspace/WorkspacePatientsPage"));
const WorkspacePatientDetailPage = lazy(() => import("./pages/workspace/WorkspacePatientDetailPage"));
const WorkspaceMealPlanPage = lazy(() => import("./pages/workspace/WorkspaceMealPlanPage"));
const WorkspaceModelosPage = lazy(() => import("./pages/workspace/WorkspaceModelosPage").then(m => ({ default: m.WorkspaceModelosPage })));
const WorkspaceModeloDetailPage = lazy(() => import("./pages/workspace/WorkspaceModeloDetailPage").then(m => ({ default: m.WorkspaceModeloDetailPage })));
const WorkspaceDashboardPage = lazy(() => import("./pages/workspace/WorkspaceDashboardPage").then(m => ({ default: m.WorkspaceDashboardPage })));
const WorkspaceAlimentosPage = lazy(() => import("./pages/workspace/WorkspaceAlimentosPage").then(m => ({ default: m.WorkspaceAlimentosPage })));
const WorkspaceAcceptInvitationPage = lazy(() => import("./pages/workspace/WorkspaceAcceptInvitationPage"));
const WorkspaceSettingsPage = lazy(() => import("./pages/workspace/WorkspaceSettingsPage"));
const WorkspaceRelatorioAntropometrico = lazy(() => import("./pages/workspace/WorkspaceRelatorioAntropometrico"));
const WorkspaceAgendaPage = lazy(() => import("./pages/workspace/WorkspaceAgendaPage"));
const WorkspacePublicBookingPage = lazy(() => import("./pages/WorkspacePublicBookingPage"));
const WorkspaceSignupPage = lazy(() => import("./pages/workspace/WorkspaceSignupPage"));
const WorkspaceProtectedRoute = lazy(() => import("@/components/workspace/WorkspaceProtectedRoute"));
const WorkspaceShell = lazy(() => import("@/components/workspace/WorkspaceShell"));
const WorkspaceTrialGate = lazy(() => import("@/components/workspace/WorkspaceTrialGate").then(m => ({ default: m.WorkspaceTrialGate })));
const PublicSaaSLandingPage = lazy(() => import("./pages/PublicSaaSLandingPage"));
const SaaSAdminPage = lazy(() => import("./pages/SaaSAdminPage"));
const PlatformInvitationsPage = lazy(() => import("./pages/platform/PlatformInvitationsPage"));
const PlatformResetPasswordPage = lazy(() => import("./pages/platform/PlatformResetPasswordPage"));

const isSaaSPilotMode = isSaaSPilotModeEnabled(import.meta.env.VITE_SAAS_PILOT_MODE);
const isSaaSAccessRequestsEnabled = import.meta.env.VITE_SAAS_ACCESS_REQUESTS_ENABLED === "true";

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

  componentDidCatch(_error: Error, _info: ErrorInfo): void {}

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

const WorkspaceRoot = () => (
  <WorkspaceAuthProvider>
    <Outlet />
  </WorkspaceAuthProvider>
);

const App = () => (
  <ThemeProvider>
  <QueryClientProvider client={queryClient}>
    <ContentProvider>
      <PatientPortalSettingsProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <SaaSPilotRouteGate enabled={isSaaSPilotMode}>
                <ScrollToTop />
                <RouteErrorBoundary>
                <Suspense fallback={<RouteLoadingFallback />}>
                <Routes>

                {/* Landing / SaaS */}
                <Route path="/" element={isSaaSPilotMode ? <PublicSaaSLandingPage accessRequestsEnabled={isSaaSAccessRequestsEnabled} /> : <Index />} />

                {/* Public pages */}
                <Route path="/consultas" element={<ConsultasPage />} />
                <Route path="/resultados" element={<ResultadosPage />} />
                <Route path="/loja" element={<LojaPage />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/privacidade" element={<PrivacidadePage />} />
                <Route path="/produto/:id" element={<ProdutoPage />} />
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

                {/* Workspace public booking page (no auth required) */}
                <Route path="/agendar/:slug" element={<WorkspacePublicBookingPage />} />

                <Route path="/pagamento/sucesso" element={<PaymentSuccess />} />
                <Route path="/pagamento/pendente" element={<PaymentPending />} />
                <Route path="/pagamento/erro" element={<PaymentFailure />} />

                {/* Platform (SaaS infra) */}
                <Route path="/platform/invitations" element={<PlatformInvitationsPage accessRequestsEnabled={isSaaSAccessRequestsEnabled} />} />
                <Route path="/platform/reset-password" element={<PlatformResetPasswordPage />} />

                {/* Workspace (SaaS area clínica) */}
                <Route path="/workspace/signup" element={<WorkspaceSignupPage />} />
                <Route path="/workspace/forgot-password" element={<WorkspaceForgotPasswordPage />} />
                <Route path="/workspace" element={<WorkspaceRoot />}>
                  <Route path="accept" element={<WorkspaceAcceptInvitationPage />} />
                  <Route path="login" element={<WorkspaceLogin />} />
                  <Route
                    element={
                      <WorkspaceProtectedRoute>
                        <WorkspaceTrialGate>
                          <WorkspaceShell />
                        </WorkspaceTrialGate>
                      </WorkspaceProtectedRoute>
                    }
                  >
                    <Route index element={<WorkspaceDashboardPage />} />
                    <Route path="patients" element={<WorkspacePatientsPage />} />
                    <Route path="patients/:id" element={<WorkspacePatientDetailPage />} />
                    <Route path="patients/:id/plan/:planId" element={<WorkspaceMealPlanPage />} />
                    <Route path="patients/:id/relatorio-antropometrico" element={<WorkspaceRelatorioAntropometrico />} />
                    <Route path="modelos" element={<WorkspaceModelosPage />} />
                    <Route path="modelos/:templateId" element={<WorkspaceModeloDetailPage />} />
                    <Route path="agenda" element={<WorkspaceAgendaPage />} />
                    <Route path="alimentos" element={<WorkspaceAlimentosPage />} />
                    <Route path="configuracoes" element={<WorkspaceSettingsPage />} />
                  </Route>
                </Route>

                {/* SaaS Admin */}
                <Route path="/saas-admin" element={<SaaSAdminPage />} />

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
                  <Route path="*" element={<Navigate to="/admin" replace />} />
                </Route>

                {/* 404 / fallback */}
                <Route path="*" element={isSaaSPilotMode ? <Navigate to="/workspace/login" replace /> : <NotFound />} />

                </Routes>
                </Suspense>
                </RouteErrorBoundary>
              </SaaSPilotRouteGate>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </PatientPortalSettingsProvider>
    </ContentProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
