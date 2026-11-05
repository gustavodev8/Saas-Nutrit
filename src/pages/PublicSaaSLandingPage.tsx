import { ArrowRight, ClipboardList, KeyRound, UserRoundCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SaaSAccessRequestForm, { type SaaSAccessRequest } from "@/components/saas/SaaSAccessRequestForm";
import { submitWorkspaceAccessRequest } from "@/lib/workspaceAccessRequests";

const accessSteps = [
  { number: "01", title: "Envie sua solicitação", icon: ClipboardList },
  { number: "02", title: "A equipe faz a triagem", icon: UserRoundCheck },
  { number: "03", title: "Receba um convite", icon: KeyRound },
];

type PublicSaaSLandingPageProps = {
  accessRequestsEnabled?: boolean;
};

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
    <main className="min-h-screen bg-[#f5f8f6] text-[#142a25]">
      <header className="border-b border-[#dce7e1] bg-white">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3 font-semibold" aria-label="Nutri SaaS">
            <span className="grid size-9 place-items-center rounded-md bg-[#123b32] text-sm font-bold text-white">N</span>
            <span>Nutri SaaS</span>
          </Link>
          <Button variant="outline" asChild>
            <Link to="/workspace/login">Entrar</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-20">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 border-l-4 border-[#e28a54] pl-3 text-sm font-semibold text-[#35675b]">
            Gestão para nutricionistas
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
            Um espaço de gestão pensado para nutricionistas.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#4f655e]">
            {accessRequestsEnabled
              ? "Organize a rotina profissional em um workspace. O acesso começa com uma solicitação analisada pela equipe e, quando aprovado, é liberado por convite."
              : "Organize a rotina profissional em um workspace. No momento, o acesso está disponível somente por convite; novas solicitações estão temporariamente fechadas."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link to="/workspace/login">Entrar no sistema <ArrowRight aria-hidden="true" /></Link>
            </Button>
            {accessRequestsEnabled && <Button size="lg" variant="outline" asChild><a href="#solicitar-acesso">Pedir acesso</a></Button>}
          </div>
        </div>

        <aside className="bg-[#123b32] px-6 py-7 text-white sm:px-8 sm:py-9" aria-label={accessRequestsEnabled ? "Etapas para solicitar acesso" : "Acesso por convite"}>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#a9cec0]">{accessRequestsEnabled ? "Acesso por triagem" : "Acesso por convite"}</p>
          <h2 className="mt-2 text-2xl font-semibold">{accessRequestsEnabled ? "A equipe acompanha cada solicitação." : "Novas solicitações estão temporariamente fechadas."}</h2>
          {accessRequestsEnabled ? (
            <ol className="mt-8 divide-y divide-white/15">
              {accessSteps.map(({ number, title, icon: Icon }) => (
                <li key={number} className="flex items-center gap-4 py-5 first:pt-0 last:pb-0">
                  <span className="grid size-11 shrink-0 place-items-center rounded-md bg-white/10 text-[#c9e2d7]"><Icon size={20} aria-hidden="true" /></span>
                  <span className="flex items-center gap-3"><span className="font-mono text-sm text-[#a9cec0]">{number}</span><span className="font-medium">{title}</span></span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 leading-7 text-[#d7e8e1]">O acesso ao sistema continua disponível para profissionais que já receberam um convite.</p>
          )}
        </aside>
      </section>

      <section id="solicitar-acesso" className="scroll-mt-6 border-t border-[#dce7e1] bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 sm:py-16 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
          <div>
            <p className="text-sm font-semibold text-[#35675b]">{accessRequestsEnabled ? "Pedido sujeito à análise" : "Acesso por convite"}</p>
            <h2 className="mt-2 text-3xl font-semibold">{accessRequestsEnabled ? "Solicitar acesso" : "Solicitações temporariamente fechadas"}</h2>
            <p className="mt-4 max-w-md leading-7 text-[#4f655e]">
              {accessRequestsEnabled
                ? "Informe seus dados profissionais e selecione uma categoria. O pedido não cria usuário nem workspace; o acesso é liberado somente após triagem e convite."
                : "No momento, não estamos recebendo novos pedidos de acesso. O sistema permanece acessível somente por convite da equipe."}
            </p>
          </div>
          {accessRequestsEnabled && <SaaSAccessRequestForm onSubmit={handleAccessRequest} />}
        </div>
      </section>

      <footer className="border-t border-[#dce7e1] px-5 py-6 text-center text-sm text-[#60756e]">
        <span>Nutri SaaS · Acesso profissional por convite</span>
        <span className="mx-2" aria-hidden="true">·</span>
        <a className="underline underline-offset-4" href="mailto:gustavu.dev@gmail.com">Contato para privacidade</a>
      </footer>
    </main>
  );
}
