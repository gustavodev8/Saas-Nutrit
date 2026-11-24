import { Activity, BookOpen, CalendarDays, ClipboardList, LayoutDashboard, Mail, Users, Utensils } from "lucide-react";
import { Link } from "react-router-dom";
import SaaSAccessRequestForm, { type SaaSAccessRequest } from "@/components/saas/SaaSAccessRequestForm";
import { submitWorkspaceAccessRequest } from "@/lib/workspaceAccessRequests";

type PublicSaaSLandingPageProps = {
  accessRequestsEnabled?: boolean;
};

const previewPatients = [
  { initials: "AM", name: "Ana Martins", detail: "Acompanhamento", date: "12 nov" },
  { initials: "RC", name: "Rafael Costa", detail: "Plano alimentar", date: "10 nov" },
  { initials: "BL", name: "Beatriz Lima", detail: "Avaliação", date: "08 nov" },
];

function ProductPreview() {
  return (
    <figure aria-label="Prévia ilustrativa do painel" className="mx-auto max-w-6xl">
      <figcaption className="mb-2 text-right text-xs text-[#d3e6dc]">Prévia ilustrativa · dados fictícios</figcaption>
      <div aria-hidden="true" className="flex border border-[#cadbd2] bg-white text-[#1a2f26] shadow-[0_16px_48px_rgba(2,25,18,0.2)]">
        <aside aria-hidden="true" className="hidden w-44 shrink-0 border-r border-[#e1e8e3] bg-[#f8faf8] px-3 py-4 sm:block sm:[@media(max-height:720px)]:hidden lg:w-52">
          <div className="flex items-center gap-2 border-b border-[#e1e8e3] pb-4 text-sm font-semibold text-[#166b50]">
            <span className="grid size-7 place-items-center rounded bg-[#dcefe4]"><LayoutDashboard size={14} /></span>Nutrit
          </div>
          <div className="mt-4 space-y-1 text-xs font-medium text-[#667870]">
            <div className="flex items-center gap-2 rounded bg-[#e6f2eb] px-2 py-2 text-[#166b50]"><LayoutDashboard size={14} /> Início</div>
            <div className="flex items-center gap-2 px-2 py-2"><Users size={14} /> Pacientes</div>
            <div className="flex items-center gap-2 px-2 py-2"><CalendarDays size={14} /> Agenda</div>
            <div className="flex items-center gap-2 px-2 py-2"><BookOpen size={14} /> Modelos</div>
            <div className="flex items-center gap-2 px-2 py-2"><Utensils size={14} /> Alimentos</div>
          </div>
        </aside>
        <div className="min-w-0 flex-1 bg-[#f7f9f7] px-3 py-3 sm:px-5 sm:py-4 lg:px-7">
          <div className="flex items-center justify-between gap-3 border-b border-[#dce6df] pb-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-[#166b50] sm:hidden">Nutrit</p>
              <p className="truncate text-sm font-semibold sm:text-base">Visão geral da área clínica</p>
              <p className="text-[11px] text-[#667870]">Acompanhamento em um só lugar</p>
            </div>
            <span className="hidden rounded bg-[#166b50] px-3 py-2 text-[11px] font-semibold text-white sm:inline-flex">Ver pacientes</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden border border-[#dce6df] bg-[#dce6df] lg:grid-cols-4">
            {[
              { label: "Pacientes", value: "24", icon: Users },
              { label: "Novos este mês", value: "3", icon: Activity },
              { label: "Consultas", value: "8", icon: CalendarDays },
              { label: "Avaliados", value: "12", icon: ClipboardList },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className={`min-h-14 items-center justify-between bg-white px-3 py-2 sm:min-h-16 ${label === "Consultas" || label === "Avaliados" ? "hidden sm:flex" : "flex"}`}>
                <div><p className="text-[10px] text-[#667870]">{label}</p><p className="text-lg font-semibold leading-tight">{value}</p></div>
                <Icon size={15} className="text-[#166b50]" aria-hidden="true" />
              </div>
            ))}
          </div>
          <div className="mt-3 hidden border border-[#dce6df] bg-white sm:block sm:[@media(max-height:720px)]:hidden">
            <div className="flex items-center justify-between border-b border-[#e5ebe6] px-3 py-2 text-[11px] font-semibold">
              <span>Pacientes recentes</span><span className="text-[#166b50]">Ver todos</span>
            </div>
            {previewPatients.map((patient) => (
              <div key={patient.name} className="flex items-center gap-2 border-b border-[#edf1ed] px-3 py-1.5 last:border-b-0">
                <span className="grid size-6 shrink-0 place-items-center rounded bg-[#e6f2eb] text-[9px] font-semibold text-[#166b50]">{patient.initials}</span>
                <span className="min-w-0 flex-1 truncate text-[11px] font-medium">{patient.name}<span className="ml-2 hidden font-normal text-[#667870] sm:inline">{patient.detail}</span></span>
                <span className="shrink-0 text-[10px] text-[#667870]">{patient.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </figure>
  );
}

export default function PublicSaaSLandingPage({ accessRequestsEnabled = false }: PublicSaaSLandingPageProps) {
  const handleAccessRequest = (request: SaaSAccessRequest) => submitWorkspaceAccessRequest({
    applicantName: request.name,
    professionalEmail: request.professionalEmail,
    phone: request.whatsapp,
    crn: request.crn,
    needCategory: request.needCategory,
    consent: request.consent,
    website: request.website,
  });

  return (
    <main className="min-h-screen bg-[#f5f8f6] text-[#172b25]">
      <header className="border-b border-[#d7e4dc] bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" aria-label="Nutrit, início" className="flex items-center gap-2 rounded-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166b50]">
            <span className="grid size-9 place-items-center rounded bg-[#153f34] text-lg text-white">N</span>
            <span className="text-lg text-[#153f34]">Nutrit<span className="text-[#bd764e]">.</span></span>
          </Link>
          <nav aria-label="Navegação principal" className="hidden items-center gap-6 text-sm font-medium text-[#50655b] md:flex">
            <a href="#plataforma" className="rounded-sm hover:text-[#153f34] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166b50]">Plataforma</a>
            <a href="#preco" className="rounded-sm hover:text-[#153f34] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166b50]">Preço</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/workspace/login" className="inline-flex min-h-10 items-center rounded-md px-2 py-2 text-sm font-semibold text-[#153f34] motion-safe:transition-colors hover:bg-[#edf4ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166b50]">Entrar</Link>
            <Link to="/workspace/signup" className="hidden min-h-10 items-center rounded-md bg-[#153f34] px-4 py-2 text-sm font-semibold text-white motion-safe:transition-colors hover:bg-[#246148] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166b50] sm:inline-flex">Começar grátis</Link>
          </div>
        </div>
      </header>

      <section className="bg-[#12372f] px-4 pb-5 pt-6 text-white sm:px-6 sm:pt-9 lg:px-8">
        <div className="mx-auto max-w-6xl text-center">
          <p className="hidden text-sm font-medium text-[#a7d7bf] sm:block">Um espaço de trabalho para nutricionistas</p>
          <h1 className="mt-2 text-4xl font-semibold leading-tight sm:text-5xl">Nutrit</h1>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-6 text-[#e0eee6] sm:text-lg sm:leading-7">Sua prática nutricional, em um só lugar. Pacientes, registros clínicos e planos alimentares juntos.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3 sm:mt-5">
            <Link to="/workspace/signup" className="inline-flex min-h-11 items-center rounded-md bg-[#e0f0e6] px-5 py-2 text-sm font-semibold text-[#12372f] motion-safe:transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Criar workspace grátis</Link>
            <a href="#plataforma" className="hidden min-h-11 items-center rounded-md border border-[#82ad97] px-5 py-2 text-sm font-semibold text-white motion-safe:transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:inline-flex">Conhecer a plataforma</a>
          </div>
          <p className="mt-2 text-sm text-[#c8e3d4] sm:mt-3">30 dias grátis após confirmar o e-mail. Depois, R$79,90/mês.</p>
        </div>
        <div className="mt-4 sm:mt-5"><ProductPreview /></div>
      </section>

      <section id="plataforma" className="scroll-mt-8 border-b border-[#d7e4dc] bg-white px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[#166b50]">Na rotina clínica</p>
            <h2 className="mt-1 text-2xl font-semibold leading-tight text-[#153f34] sm:text-3xl">Do cadastro ao acompanhamento</h2>
          </div>
          <div className="mt-7 grid gap-6 border-t border-[#d7e4dc] pt-6 md:grid-cols-3 md:gap-8">
            {[
              { icon: Users, title: "Pacientes", description: "Dados cadastrais e histórico organizados no prontuário." },
              { icon: ClipboardList, title: "Registros clínicos", description: "Anamnese, medidas e consultas reunidas por paciente." },
              { icon: BookOpen, title: "Planos alimentares", description: "Planejamento alimentar ligado ao acompanhamento individual." },
            ].map(({ icon: Icon, title, description }) => (
              <article key={title} className="border-l-2 border-[#bdd8c6] pl-4">
                <Icon size={19} className="text-[#166b50]" aria-hidden="true" />
                <h3 className="mt-3 text-lg font-semibold text-[#153f34]">{title}</h3>
                <p className="mt-1 text-base leading-6 text-[#50655b]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="preco" className="scroll-mt-8 px-4 py-11 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 border-t-2 border-[#166b50] pt-6 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] md:items-end md:gap-16">
          <div>
            <p className="text-sm font-semibold text-[#166b50]">Plano Nutrit</p>
            <h2 className="mt-2 text-2xl font-semibold text-[#153f34] sm:text-3xl">30 dias para começar</h2>
            <p className="mt-3 max-w-lg text-base leading-7 text-[#50655b]">Crie seu workspace. O período gratuito começa após a confirmação do e-mail.</p>
          </div>
          <div className="md:text-right">
            <p className="text-3xl font-semibold text-[#153f34]">R$79,90<span className="text-base font-normal text-[#50655b]">/mês depois do período gratuito</span></p>
            <Link to="/workspace/signup" className="mt-4 inline-flex min-h-11 items-center rounded-md bg-[#153f34] px-5 py-2 text-sm font-semibold text-white motion-safe:transition-colors hover:bg-[#246148] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166b50]">Criar meu workspace</Link>
          </div>
        </div>
        {accessRequestsEnabled && (
          <div id="solicitar-acesso" className="mx-auto mt-12 max-w-6xl scroll-mt-6 border-t border-[#d7e4dc] pt-8">
            <div className="max-w-xl">
              <h3 className="text-lg font-semibold text-[#153f34]">Prefere falar com a equipe?</h3>
              <p className="mb-5 mt-1 text-sm leading-6 text-[#50655b]">Envie um pedido para contato. O pedido não cria usuário nem workspace.</p>
              <SaaSAccessRequestForm onSubmit={handleAccessRequest} />
            </div>
          </div>
        )}
      </section>

      <footer className="border-t border-[#d7e4dc] bg-white px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-sm text-[#50655b]">
          <span className="font-semibold text-[#153f34]">Nutrit</span>
          <a href="mailto:gustavu.dev@gmail.com" className="inline-flex items-center gap-2 underline underline-offset-4 hover:text-[#153f34] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166b50]"><Mail size={15} aria-hidden="true" />Contato para privacidade</a>
        </div>
      </footer>
    </main>
  );
}
