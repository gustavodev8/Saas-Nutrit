import { ArrowRight, ArrowUpRight, Check, ClipboardList, LogIn } from "lucide-react";
import { Link } from "react-router-dom";

type PublicSaaSLandingPageProps = {
  accessRequestsEnabled?: boolean;
};

export default function PublicSaaSLandingPage({ accessRequestsEnabled: _unused = false }: PublicSaaSLandingPageProps) {
  return (
    <>
      <style>{`
        @keyframes floatA {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-18px) rotate(8deg); }
        }
        @keyframes floatB {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-13px) rotate(-6deg); }
        }
        @keyframes floatC {
          0%,100% { transform: translateY(0px) rotate(5deg); }
          50% { transform: translateY(-22px) rotate(-5deg); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(22px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fa { animation: floatA 6s ease-in-out infinite; }
        .fb { animation: floatB 8s ease-in-out infinite; animation-delay: -3s; }
        .fc { animation: floatC 7s ease-in-out infinite; animation-delay: -1.5s; }
        .fd { animation: floatA 9s ease-in-out infinite; animation-delay: -4s; }
        .fe { animation: floatB 5s ease-in-out infinite; animation-delay: -2s; }
        .ff { animation: floatA 7.5s ease-in-out infinite; animation-delay: -5s; }
        .fup1 { animation: fadeSlideUp 0.65s ease-out 0.1s both; }
        .fup2 { animation: fadeSlideUp 0.65s ease-out 0.25s both; }
        .fup3 { animation: fadeSlideUp 0.65s ease-out 0.4s both; }
        .fup4 { animation: fadeSlideUp 0.65s ease-out 0.55s both; }
      `}</style>

      <main className="min-h-screen overflow-hidden bg-[#f5f7f3] text-[#172b25]">

        {/* ── HEADER ── */}
        <header className="sticky top-0 z-50 border-b border-[#dce5de] bg-[#fbfcfa]/90 backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 sm:px-8">
            <Link to="/" className="flex items-center gap-2.5" aria-label="Nutrit, início">
              <span className="grid size-9 place-items-center rounded-md bg-[#153f34] text-sm font-bold text-white">N</span>
              <span className="text-base font-semibold tracking-tight">Nutrit<span className="text-[#166b50]">.</span></span>
            </Link>
            <nav aria-label="Navegação principal" className="hidden items-center gap-6 text-sm font-medium text-[#53665e] md:flex">
              <a href="#funcionalidades" className="transition-colors hover:text-[#153f34]">Funcionalidades</a>
              <a href="#migracao" className="transition-colors hover:text-[#153f34]">Migração de dados</a>
              <a href="#preco" className="transition-colors hover:text-[#153f34]">Preço</a>
            </nav>
            <div className="flex items-center gap-2">
              <Link
                to="/workspace/login"
                className="hidden items-center gap-1.5 text-sm font-medium text-[#53665e] transition-colors hover:text-[#153f34] sm:inline-flex"
              >
                <LogIn size={15} aria-hidden="true" /> Entrar
              </Link>
              <Link
                to="/workspace/signup"
                className="inline-flex items-center gap-1.5 rounded-md bg-[#153f34] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1f5546] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#397a64]"
              >
                Começar grátis <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </header>

        {/* ── HERO ── */}
        <section className="relative overflow-hidden px-5 pb-20 pt-20 sm:px-8 sm:pb-28 sm:pt-28">
          {/* Floating leaf / food animations */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none overflow-hidden">
            {/* Large leaf left */}
            <span className="fa absolute left-[7%] top-[18%] text-[#166b50]">
              <svg width="44" height="54" viewBox="0 0 44 54" fill="currentColor" opacity="0.18">
                <path d="M22 2C22 2 2 11 2 31C2 42 10 52 22 52C34 52 42 42 42 31C42 11 22 2 22 2ZM22 47C14 47 7 39 7 31C7 20 17 13 22 9C27 13 37 20 37 31C37 39 30 47 22 47Z"/>
                <rect x="21" y="45" width="2" height="7" rx="1"/>
              </svg>
            </span>
            {/* Medium leaf top right */}
            <span className="fb absolute right-[11%] top-[16%] text-[#166b50]">
              <svg width="32" height="40" viewBox="0 0 44 54" fill="currentColor" opacity="0.15">
                <path d="M22 2C22 2 2 11 2 31C2 42 10 52 22 52C34 52 42 42 42 31C42 11 22 2 22 2ZM22 47C14 47 7 39 7 31C7 20 17 13 22 9C27 13 37 20 37 31C37 39 30 47 22 47Z"/>
                <rect x="21" y="45" width="2" height="7" rx="1"/>
              </svg>
            </span>
            {/* Small leaf lower right */}
            <span className="fc absolute right-[18%] top-[62%] text-[#153f34]">
              <svg width="26" height="32" viewBox="0 0 44 54" fill="currentColor" opacity="0.12">
                <path d="M22 2C22 2 2 11 2 31C2 42 10 52 22 52C34 52 42 42 42 31C42 11 22 2 22 2Z"/>
              </svg>
            </span>
            {/* Tiny leaf lower left */}
            <span className="fd absolute left-[22%] top-[70%] text-[#166b50]">
              <svg width="22" height="28" viewBox="0 0 44 54" fill="currentColor" opacity="0.13">
                <path d="M22 2C22 2 2 11 2 31C2 42 10 52 22 52C34 52 42 42 42 31C42 11 22 2 22 2Z"/>
              </svg>
            </span>
            {/* Apple shape right */}
            <span className="fe absolute right-[6%] top-[48%] text-[#166b50]">
              <svg width="38" height="42" viewBox="0 0 50 55" fill="currentColor" opacity="0.13">
                <path d="M36 10C36 10 40 2 34 0C34 0 28 2 30 10C26 10 8 13 8 29C8 43 17 55 25 55C33 55 42 43 42 29C42 13 40 10 36 10ZM25 50C19 50 13 42 13 29C13 19 21 15 25 15C29 15 37 19 37 29C37 42 31 50 25 50Z"/>
                <path d="M25 10C25 10 23 4 28 1" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round"/>
              </svg>
            </span>
            {/* Wheat/grain upper right */}
            <span className="ff absolute right-[30%] top-[9%] text-[#43806b]">
              <svg width="16" height="44" viewBox="0 0 20 52" fill="currentColor" opacity="0.18">
                <rect x="9" y="0" width="2" height="52" rx="1"/>
                <ellipse cx="10" cy="12" rx="8" ry="5" transform="rotate(-35 10 12)"/>
                <ellipse cx="10" cy="22" rx="8" ry="5" transform="rotate(35 10 22)"/>
                <ellipse cx="10" cy="32" rx="8" ry="5" transform="rotate(-35 10 32)"/>
                <ellipse cx="10" cy="42" rx="8" ry="5" transform="rotate(35 10 42)"/>
              </svg>
            </span>
            {/* Small leaf far left mid */}
            <span className="fb absolute left-[3%] top-[55%] text-[#43806b]" style={{animationDelay: '-6.5s'}}>
              <svg width="20" height="26" viewBox="0 0 44 54" fill="currentColor" opacity="0.14">
                <path d="M22 2C22 2 2 11 2 31C2 42 10 52 22 52C34 52 42 42 42 31C42 11 22 2 22 2Z"/>
              </svg>
            </span>
          </div>

          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <div className="fup1 mb-6 inline-flex items-center gap-2 rounded-full border border-[#c8ddd2] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#2a6650]">
              <span className="size-1.5 rounded-full bg-[#166b50]" aria-hidden="true" />
              30 dias grátis · Sem cartão de crédito
            </div>
            <h1 className="fup2 mx-auto max-w-3xl text-[2.8rem] font-semibold leading-[1.07] tracking-tight text-[#131f1b] sm:text-5xl lg:text-[3.8rem]">
              O sistema que acompanha cada consulta sua.
            </h1>
            <p className="fup3 mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#4a5e57] sm:text-xl">
              Prontuários, planos alimentares, medições e toda a evolução dos seus pacientes — organizados em um único lugar. E se você já usa outro sistema, migramos tudo para você.
            </p>
            <div className="fup4 mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/workspace/signup"
                className="inline-flex min-h-12 items-center gap-2 rounded-md bg-[#153f34] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#1f5546] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#397a64]"
              >
                Criar meu workspace grátis <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link
                to="/workspace/login"
                className="inline-flex min-h-12 items-center gap-2 rounded-md border border-[#cddbd3] bg-white px-6 text-sm font-semibold text-[#153f34] transition-colors hover:bg-[#edf4ef]"
              >
                Já tenho conta <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <p className="mt-5 text-xs text-[#7a918a]">1 mês grátis. Depois R$79,90/mês. Cancele quando quiser.</p>
          </div>
        </section>

        {/* ── STATS STRIP ── */}
        <div className="border-y border-[#dde6df] bg-white">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-px sm:grid-cols-4">
            {[
              { n: "30 dias", label: "de trial completo" },
              { n: "R$79,90", label: "por mês após o trial" },
              { n: "100%", label: "migração de dados" },
              { n: "0 restrições", label: "durante o período grátis" },
            ].map(({ n, label }) => (
              <div key={label} className="flex flex-col items-center px-4 py-6 text-center">
                <span className="text-2xl font-semibold text-[#153f34]">{n}</span>
                <span className="mt-1 text-xs text-[#5e7069]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── FEATURES ── */}
        <section id="funcionalidades" className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#166b50]">O que está incluído</p>
            <h2 className="mt-3 text-3xl font-semibold text-[#141e1a] sm:text-4xl">Tudo que você precisa, sem complexidade.</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
                    <circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 014-4h6a4 4 0 014 4v2"/>
                    <path d="M19 8v6m-3-3h6"/>
                  </svg>
                ),
                title: "Prontuários de pacientes",
                desc: "Cadastre e acompanhe a evolução de cada paciente com histórico completo de consultas.",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
                    <rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6m-6 4h4"/>
                  </svg>
                ),
                title: "Planos alimentares",
                desc: "Monte dietas personalizadas com tabela nutricional integrada e modelos reutilizáveis.",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
                    <path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 4-6"/>
                  </svg>
                ),
                title: "Medições e evolução",
                desc: "Registre peso, IMC, dobras cutâneas e acompanhe gráficos de progresso a cada consulta.",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/>
                    <path d="M16 3.13a4 4 0 010 7.75"/>
                  </svg>
                ),
                title: "Equipe no workspace",
                desc: "Adicione assistentes ao seu espaço com controle de acesso por função.",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
                    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                  </svg>
                ),
                title: "Modelos e templates",
                desc: "Crie modelos de plano, anamnese e recomendações para usar em múltiplos pacientes.",
              },
              {
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="22" height="22">
                    <ellipse cx="12" cy="12" rx="10" ry="4"/>
                    <path d="M2 12c0 4.418 4.477 8 10 8s10-3.582 10-8"/>
                    <path d="M2 12V8c0-4.418 4.477-8 10-8s10 3.582 10 8v4"/>
                  </svg>
                ),
                title: "Banco de alimentos (TACO)",
                desc: "Mais de 12.000 alimentos com tabela TACO integrada para montar dietas com precisão.",
              },
            ].map(({ icon, title, desc }) => (
              <article key={title} className="rounded-xl border border-[#e1e9e3] bg-white p-6 transition-shadow hover:shadow-sm">
                <span className="mb-4 grid size-10 place-items-center rounded-lg bg-[#ddf0e8] text-[#166b50]" aria-hidden="true">
                  {icon}
                </span>
                <h3 className="font-semibold text-[#1a2f26]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5c6e66]">{desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── DATA MIGRATION HIGHLIGHT ── */}
        <section id="migracao" className="relative overflow-hidden bg-[#153f34] px-5 py-16 sm:px-8 sm:py-24">
          {/* Decorative leaves for dark section */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none overflow-hidden">
            <span className="fc absolute -right-8 top-6 text-white" style={{opacity: 0.05}}>
              <svg width="160" height="200" viewBox="0 0 44 54" fill="currentColor">
                <path d="M22 2C22 2 2 11 2 31C2 42 10 52 22 52C34 52 42 42 42 31C42 11 22 2 22 2Z"/>
              </svg>
            </span>
            <span className="fa absolute -left-6 bottom-4 text-white" style={{opacity: 0.04}}>
              <svg width="130" height="160" viewBox="0 0 44 54" fill="currentColor">
                <path d="M22 2C22 2 2 11 2 31C2 42 10 52 22 52C34 52 42 42 42 31C42 11 22 2 22 2Z"/>
              </svg>
            </span>
          </div>
          <div className="relative z-10 mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:items-center lg:gap-20">
            <div>
              <span className="mb-4 inline-block rounded-full border border-[#2a6650] px-3 py-1 text-xs font-semibold text-[#7ecbb3]">
                Diferencial exclusivo
              </span>
              <h2 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">
                Seus dados não ficam pra trás quando você muda de sistema.
              </h2>
              <p className="mt-5 text-base leading-7 text-[#9bbfb3]">
                Migramos todo o histórico dos seus pacientes do seu sistema atual para o Nutrit — prontuários, planos alimentares, medições e consultas anteriores. Sem perda de dados, sem digitação manual.
              </p>
              <ul className="mt-8 space-y-3">
                {[
                  "Histórico completo de pacientes importado",
                  "Planos alimentares convertidos automaticamente",
                  "Sem período de downtime para a sua clínica",
                  "Suporte dedicado durante toda a migração",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-[#1f5546] text-[#7ecbb3]">
                      <Check size={12} aria-hidden="true" />
                    </span>
                    <span className="text-sm text-[#c5ddd8]">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-10">
                <Link
                  to="/workspace/signup"
                  className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-semibold text-[#153f34] transition-colors hover:bg-[#edf4ef]"
                >
                  Começar com migração gratuita <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>
            {/* Migration visual */}
            <div className="rounded-xl border border-[#1f5546] bg-[#102e25] p-6">
              <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-[#4fa88c]">Migração de dados</p>
              <div className="space-y-3">
                {[
                  { label: "Pacientes", n: "143" },
                  { label: "Planos alimentares", n: "89" },
                  { label: "Medições registradas", n: "412" },
                  { label: "Consultas anteriores", n: "521" },
                ].map(({ label, n }) => (
                  <div key={label} className="flex items-center justify-between rounded-lg border border-[#1f5546] bg-[#153f34] px-4 py-3">
                    <span className="text-sm font-medium text-[#c0d8d1]">{label}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-white">{n}</span>
                      <span className="rounded-full bg-[#1a5e44] px-2.5 py-0.5 text-[11px] font-semibold text-[#7ecbb3]">
                        <Check size={10} className="mr-0.5 inline" aria-hidden="true" />Migrado
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-lg bg-[#1a5e44] px-4 py-3">
                <p className="text-xs text-[#9fd4c5]">Tempo de migração</p>
                <p className="mt-0.5 text-sm font-semibold text-white">Concluída em até 24 horas</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="mb-12 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#166b50]">Em 3 passos</p>
            <h2 className="mt-3 text-3xl font-semibold text-[#141e1a] sm:text-4xl">Pronto para usar hoje.</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                n: "01",
                title: "Crie seu workspace",
                desc: "Cadastre-se em segundos. Seu workspace é criado automaticamente com o nome da sua clínica.",
              },
              {
                n: "02",
                title: "30 dias grátis",
                desc: "Use todas as funcionalidades sem restrição. Sem precisar inserir cartão de crédito.",
              },
              {
                n: "03",
                title: "Continue crescendo",
                desc: "Após o trial, apenas R$79,90/mês. Cancele quando quiser — seus dados ficam com você.",
              },
            ].map(({ n, title, desc }) => (
              <div key={n} className="relative rounded-xl border border-[#e1e9e3] bg-white p-7">
                <span className="select-none text-5xl font-bold leading-none text-[#e8f0eb]">{n}</span>
                <h3 className="mt-3 text-base font-semibold text-[#1a2f26]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#5c6e66]">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="preco" className="border-y border-[#dde6df] bg-white px-5 py-16 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#166b50]">Preço simples</p>
            <h2 className="mt-3 text-3xl font-semibold text-[#141e1a] sm:text-4xl">
              Comece grátis. Pague só quando gostar.
            </h2>
            <p className="mt-4 text-base text-[#5a6e66]">30 dias de trial completo, sem cartão. Depois, R$79,90/mês.</p>
            <div className="mt-10 overflow-hidden rounded-2xl border border-[#c8ddd2] bg-[#f7faf8] text-left">
              <div className="bg-[#153f34] px-7 py-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#7ecbb3]">Plano Starter</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold text-white">R$79,90</span>
                  <span className="text-sm text-[#9bbfb3]">/mês</span>
                </div>
                <p className="mt-1 text-sm text-[#9bbfb3]">Primeiro mês grátis. Sem cartão agora.</p>
              </div>
              <div className="px-7 py-6">
                <ul className="space-y-3">
                  {[
                    "Pacientes ilimitados",
                    "Planos alimentares e modelos",
                    "Medições e gráficos de evolução",
                    "Banco de alimentos TACO",
                    "Equipe no workspace",
                    "Migração de dados incluída",
                    "Suporte por e-mail e WhatsApp",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-[#2a3f35]">
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#ddf0e8] text-[#166b50]">
                        <Check size={12} aria-hidden="true" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/workspace/signup"
                  className="mt-7 flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-[#153f34] text-sm font-semibold text-white transition-colors hover:bg-[#1f5546] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#397a64]"
                >
                  Criar workspace grátis <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <p className="mt-3 text-center text-xs text-[#7a918a]">Cancele a qualquer momento. Seus dados são seus.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className="bg-[#f5f7f3] px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold text-[#141e1a] sm:text-4xl">Pronto para organizar sua clínica?</h2>
            <p className="mt-4 text-base text-[#5a6e66]">Comece agora com 30 dias grátis. Sem burocracia, sem cartão de crédito.</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/workspace/signup"
                className="inline-flex min-h-12 items-center gap-2 rounded-md bg-[#153f34] px-7 text-sm font-semibold text-white transition-colors hover:bg-[#1f5546]"
              >
                Começar agora — é grátis <ArrowRight size={17} aria-hidden="true" />
              </Link>
              <Link
                to="/workspace/login"
                className="inline-flex min-h-12 items-center gap-2 rounded-md border border-[#cddbd3] bg-white px-7 text-sm font-semibold text-[#153f34] transition-colors hover:bg-[#edf4ef]"
              >
                Já tenho conta
              </Link>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-[#dce5de] bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-sm text-[#68776f] sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div className="flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-md bg-[#153f34] text-xs font-bold text-white">N</span>
              <span className="font-semibold text-[#1a2f26]">Nutrit</span>
              <span className="text-[#9aada5]">· Gestão nutricional profissional</span>
            </div>
            <a
              className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-[#153f34]"
              href="mailto:gustavu.dev@gmail.com"
            >
              <ClipboardList size={15} aria-hidden="true" /> Contato e privacidade
            </a>
          </div>
        </footer>
      </main>
    </>
  );
}
