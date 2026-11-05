import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  ClipboardList,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  UsersRound,
} from "lucide-react";
import { Link } from "react-router-dom";
import SaaSAccessRequestForm, { type SaaSAccessRequest } from "@/components/saas/SaaSAccessRequestForm";
import { submitWorkspaceAccessRequest } from "@/lib/workspaceAccessRequests";

type PublicSaaSLandingPageProps = {
  accessRequestsEnabled?: boolean;
};

const previewPatients = [
  { name: "Paciente exemplo 01", detail: "Cadastro demonstrativo", initials: "01", color: "bg-[#d8efe7] text-[#1d624f]" },
  { name: "Paciente exemplo 02", detail: "Cadastro demonstrativo", initials: "02", color: "bg-[#fde1d7] text-[#a84f36]" },
  { name: "Paciente exemplo 03", detail: "Cadastro demonstrativo", initials: "03", color: "bg-[#dce9f8] text-[#365f91]" },
];

export default function PublicSaaSLandingPage({ accessRequestsEnabled = false }: PublicSaaSLandingPageProps) {
  const handleAccessRequest = (request: SaaSAccessRequest) => {
    if (!accessRequestsEnabled) return;
    return submitWorkspaceAccessRequest({
      applicantName: request.name,
      professionalEmail: request.professionalEmail,
      phone: request.whatsapp,
      crn: request.crn,
      needCategory: request.needCategory,
      consent: request.consent,
      website: request.website,
    });
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f7f3] text-[#172b25]">
      <header className="border-b border-[#dce5de] bg-[#fbfcfa]">
        <div className="mx-auto flex min-h-[72px] max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-3" aria-label="Nutri SaaS, início">
            <span className="grid size-10 place-items-center rounded-md bg-[#153f34] text-lg font-semibold text-white">n</span>
            <span className="text-base font-semibold">nutri<span className="text-[#43806b]">.</span>saas</span>
          </Link>
          <nav aria-label="Navegação principal" className="hidden items-center gap-7 text-sm font-medium text-[#60716a] md:flex">
            <a className="transition-colors hover:text-[#153f34]" href="#produto">O produto</a>
            <a className="transition-colors hover:text-[#153f34]" href="#fluxo">Como funciona</a>
          </nav>
          <Link
            to="/workspace/login"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#cddbd3] bg-white px-4 text-sm font-semibold text-[#153f34] transition-colors hover:bg-[#edf4ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#397a64] focus-visible:ring-offset-2"
          >
            Entrar <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section id="produto" className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pb-20 sm:pt-20 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12 lg:py-24">
        <div className="relative z-10">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#cddfd5] bg-white px-3 py-1.5 text-xs font-semibold text-[#356a58]">
            <span className="size-2 rounded-full bg-[#e88465]" aria-hidden="true" />
            UM NOVO ESPAÇO DE TRABALHO
          </p>
          <h1 className="max-w-2xl text-[2.6rem] font-semibold leading-[1.08] sm:text-5xl lg:text-[3.5rem]">
            Sua prática nutricional, em um só lugar.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[#53665e] sm:text-lg sm:leading-8">
            Cadastre pacientes no seu workspace e mantenha o acesso profissional sob convite. Uma base organizada para acompanhar sua rotina.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/workspace/login"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#153f34] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#205746] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#397a64] focus-visible:ring-offset-2"
            >
              Acessar o sistema <ArrowRight size={17} aria-hidden="true" />
            </Link>
            {accessRequestsEnabled && (
              <a
                href="#solicitar-acesso"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-[#cddbd3] bg-white px-5 text-sm font-semibold text-[#153f34] transition-colors hover:bg-[#edf4ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#397a64] focus-visible:ring-offset-2"
              >
                Solicitar acesso
              </a>
            )}
          </div>
          {!accessRequestsEnabled && (
            <p className="mt-5 flex items-start gap-2 text-sm leading-6 text-[#61736b]">
              <LockKeyhole className="mt-0.5 shrink-0 text-[#397a64]" size={17} aria-hidden="true" />
              Acesso por convite. Novas solicitações estão temporariamente fechadas.
            </p>
          )}
          <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 border-t border-[#dce5de] pt-6 text-sm text-[#52665d]">
            <span className="inline-flex items-center gap-2"><UsersRound size={17} className="text-[#397a64]" aria-hidden="true" /> Cadastro de pacientes</span>
            <span className="inline-flex items-center gap-2"><KeyRound size={17} className="text-[#d9785d]" aria-hidden="true" /> Acesso por convite</span>
          </div>
        </div>

        <section className="relative mx-auto w-full max-w-[610px]" aria-label="Prévia ilustrativa do painel">
          <div className="absolute -right-3 -top-5 z-10 hidden items-center gap-2 rounded-md border border-[#e5e9e1] bg-white px-3 py-2 text-xs font-medium text-[#596960] shadow-sm sm:flex">
            <span className="size-2 rounded-full bg-[#df8062]" aria-hidden="true" />
            Prévia ilustrativa · dados fictícios
          </div>
          <div className="overflow-hidden rounded-lg border border-[#d7e0d9] bg-white shadow-[0_24px_70px_-34px_rgba(21,63,52,0.36)]">
          <div className="flex h-12 items-center justify-between border-b border-[#e8ede9] px-4 sm:px-5">
              <div className="flex items-center gap-2" aria-hidden="true">
                <span className="size-2.5 rounded-full bg-[#e98568]" />
                <span className="size-2.5 rounded-full bg-[#e9c36b]" />
                <span className="size-2.5 rounded-full bg-[#75ad8b]" />
              </div>
              <span className="text-[11px] font-medium text-[#596960]">workspace.nutri.saas</span>
              <span className="size-6 rounded-full bg-[#dbe8de]" aria-hidden="true" />
            </div>
            <div className="grid min-h-[340px] grid-cols-[64px_minmax(0,1fr)] sm:grid-cols-[148px_minmax(0,1fr)]">
              <aside className="border-r border-[#e8ede9] bg-[#f8faf7] px-2 py-4 sm:px-3" aria-label="Navegação ilustrativa">
                <div className="mb-6 flex items-center justify-center gap-2 sm:justify-start sm:px-2">
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-[#153f34] text-xs font-semibold text-white">n</span>
                  <span className="hidden text-xs font-semibold text-[#2d473c] sm:inline">Nutri SaaS</span>
                </div>
                <div className="space-y-1 text-[11px] font-medium">
                  <div className="flex items-center justify-center gap-2 rounded-md bg-[#e8f1eb] px-2 py-2 text-[#245b48] sm:justify-start">
                    <LayoutDashboard size={15} aria-hidden="true" /><span className="hidden sm:inline">Visão geral</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 rounded-md px-2 py-2 text-[#596960] sm:justify-start">
                    <UsersRound size={15} aria-hidden="true" /><span className="hidden sm:inline">Pacientes</span>
                  </div>
                </div>
                <div className="mt-8 hidden rounded-md border border-[#e1e9e2] bg-white p-3 sm:block">
                  <p className="text-[10px] font-semibold uppercase text-[#596960]">Seu espaço</p>
                  <p className="mt-1 truncate text-xs font-semibold text-[#314b40]">Consultório exemplo</p>
                  <p className="mt-2 inline-flex items-center gap-1 text-[10px] text-[#3b7b64]"><BadgeCheck size={12} aria-hidden="true" /> Acesso controlado</p>
                </div>
              </aside>

              <div className="min-w-0 p-4 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase text-[#596960]">Painel de demonstração</p>
                    <h2 className="mt-1 text-lg font-semibold text-[#1d332a] sm:text-xl">Visão geral</h2>
                  </div>
                  <span className="rounded-full bg-[#fce9e2] px-2.5 py-1 text-[10px] font-semibold text-[#8f402d]">AMBIENTE FICTÍCIO</span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-md border border-[#e2e9e3] p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-2 text-[#596960]"><span className="text-[11px]">Pacientes</span><UsersRound size={15} className="text-[#4e8c71]" aria-hidden="true" /></div>
                    <p className="mt-3 text-2xl font-semibold text-[#1d332a]">12</p>
                    <p className="mt-1 text-[10px] text-[#596960]">Exemplo visual</p>
                  </div>
                  <div className="rounded-md border border-[#e2e9e3] p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-2 text-[#596960]"><span className="text-[11px]">Acessos</span><KeyRound size={15} className="text-[#d9785d]" aria-hidden="true" /></div>
                    <p className="mt-3 text-2xl font-semibold text-[#1d332a]">03</p>
                    <p className="mt-1 text-[10px] text-[#596960]">Convites ilustrativos</p>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-md border border-[#e2e9e3]">
                  <div className="flex items-center justify-between border-b border-[#e8ede9] px-3 py-2.5 sm:px-4">
                    <p className="text-xs font-semibold text-[#354c41]">Cadastros de exemplo</p>
                    <span className="text-[10px] text-[#596960]">Dados fictícios</span>
                  </div>
                  <ul className="divide-y divide-[#edf1ed]">
                    {previewPatients.map((patient) => (
                      <li key={patient.initials} className="flex items-center gap-2.5 px-3 py-2.5 sm:gap-3 sm:px-4">
                        <span className={`grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-semibold ${patient.color}`} aria-hidden="true">{patient.initials}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[11px] font-medium text-[#334a3f]">{patient.name}</span>
                          <span className="block truncate text-[10px] text-[#596960]">{patient.detail}</span>
                        </span>
                        <span className="rounded-full bg-[#edf5ef] px-2 py-1 text-[9px] font-medium text-[#42765f]">Neste espaço</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-[11px] text-[#596960] sm:text-right">Interface ilustrativa; os números e cadastros não são dados reais.</p>
        </section>
      </section>

      <section id="fluxo" className="border-y border-[#dce5de] bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 sm:py-14 lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase text-[#44806b]">Simples e controlado</p>
            <h2 className="mt-3 max-w-lg text-3xl font-semibold leading-tight">Uma base organizada para começar.</h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-[#5c6d64]">
              O piloto reúne cadastro de pacientes no workspace e acesso profissional liberado por convite, com entrada acompanhada pela equipe.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <article className="flex gap-4 rounded-md border border-[#e1e8e2] bg-[#fbfcfa] p-4 sm:p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[#e1f0e8] text-[#34745d]"><UsersRound size={19} aria-hidden="true" /></span>
              <div><h3 className="text-sm font-semibold">Pacientes no seu espaço</h3><p className="mt-1.5 text-xs leading-5 text-[#69786f]">Cadastros organizados dentro do workspace profissional.</p></div>
            </article>
            <article className="flex gap-4 rounded-md border border-[#e1e8e2] bg-[#fbfcfa] p-4 sm:p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[#fce8df] text-[#b45d41]"><KeyRound size={19} aria-hidden="true" /></span>
              <div><h3 className="text-sm font-semibold">Entrada por convite</h3><p className="mt-1.5 text-xs leading-5 text-[#69786f]">A equipe acompanha o acesso de novos profissionais.</p></div>
            </article>
          </div>
        </div>
      </section>

      <section id="solicitar-acesso" className="bg-[#f5f7f3]">
        {accessRequestsEnabled ? (
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 sm:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase text-[#44806b]">Pedido sujeito à análise</p>
              <h2 className="mt-3 text-3xl font-semibold">Solicite acesso ao piloto.</h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-[#5c6d64]">
                Informe seus dados profissionais e selecione uma categoria. O pedido não cria usuário nem workspace; o acesso é liberado somente após triagem e convite.
              </p>
            </div>
            <SaaSAccessRequestForm onSubmit={handleAccessRequest} />
          </div>
        ) : (
          <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-12">
            <div className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-md bg-[#e4efe8] text-[#34745d]"><LockKeyhole size={20} aria-hidden="true" /></span>
              <div>
                <h2 className="text-lg font-semibold">Acesso por convite</h2>
                <p className="mt-1 max-w-xl text-sm leading-6 text-[#607168]">As solicitações públicas estão temporariamente fechadas. Se já recebeu um convite, entre para continuar.</p>
              </div>
            </div>
            <Link to="/workspace/login" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-md border border-[#cddbd3] bg-white px-4 text-sm font-semibold text-[#245b48] transition-colors hover:bg-[#edf4ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#397a64] focus-visible:ring-offset-2 sm:self-auto">
              Entrar no workspace <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        )}
      </section>

      <footer className="border-t border-[#dce5de] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-sm text-[#68776f] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="font-medium text-[#344b40]">nutri.saas <span className="font-normal text-[#596960]">· Acesso profissional por convite</span></span>
          <a className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-[#153f34]" href="mailto:gustavu.dev@gmail.com">
            <ClipboardList size={15} aria-hidden="true" /> Contato para privacidade
          </a>
        </div>
      </footer>
    </main>
  );
}
