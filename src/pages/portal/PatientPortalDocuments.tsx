import { useEffect, useState } from "react";
import { ArrowRight, CalendarCheck, ClipboardList, FileText, FlaskConical, Paperclip } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePatientPortalAuth } from "@/contexts/usePatientPortalAuth";
import {
  fetchExamRequests,
  fetchPortalConsultationRecords,
  fetchPatientReports,
  type ConsultationRecord,
  type PatientExamRequest,
  type PatientReport,
} from "@/lib/supabase";
import { formatPortalDate, formatPortalStatus } from "@/pages/portal/portalUtils";

export default function PatientPortalDocuments() {
  const { patient } = usePatientPortalAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<PatientReport[]>([]);
  const [examRequests, setExamRequests] = useState<PatientExamRequest[]>([]);
  const [records, setRecords] = useState<ConsultationRecord[]>([]);

  useEffect(() => {
    if (!patient?.id) return;

    setLoading(true);
    Promise.all([
      fetchPatientReports(patient.id),
      fetchExamRequests(patient.id),
      fetchPortalConsultationRecords(patient.id, patient.email),
    ])
      .then(([nextReports, nextExamRequests, nextRecords]) => {
        setReports(nextReports);
        setExamRequests(nextExamRequests);
        setRecords(nextRecords);
      })
      .finally(() => setLoading(false));
  }, [patient?.email, patient?.id]);

  const materialRecords = records.filter(
    (record) => (record.files?.length ?? 0) > 0 || Boolean(record.next_steps?.trim()),
  );

  return (
    <div className="space-y-4">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Documentos</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
          Exames e relatorios
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Aqui voce acompanha os pedidos de exame e relatorios liberados no prontuario.
        </p>
      </section>

      {loading ? (
        <Card className="rounded-3xl border-border/60">
          <CardContent className="p-5 text-sm text-muted-foreground">
            Carregando documentos...
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-3xl border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-primary">
              <FlaskConical size={18} />
              <CardTitle className="text-lg">Exames</CardTitle>
            </div>
            <CardDescription>Solicitacoes registradas e respectivos resultados.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {examRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum exame solicitado ate o momento.</p>
            ) : (
              examRequests.map((request) => (
                <div key={request.id} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {request.protocol?.name || "Solicitacao de exames"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {request.created_at ? formatPortalDate(request.created_at.slice(0, 10)) : "Data nao informada"}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      {formatPortalStatus(request.status)}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1">
                    {(request.items ?? []).slice(0, 4).map((item) => (
                      <p key={`${request.id}-${item.id}-${item.name}`} className="text-sm text-foreground">
                        {item.name}
                      </p>
                    ))}
                    {(request.items?.length ?? 0) > 4 ? (
                      <p className="text-xs text-muted-foreground">
                        + {(request.items?.length ?? 0) - 4} itens adicionais
                      </p>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-primary">
              <FileText size={18} />
              <CardTitle className="text-lg">Relatorios</CardTitle>
            </div>
            <CardDescription>Documentos clinicos liberados para acompanhamento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum relatorio disponivel ainda.</p>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="rounded-2xl border border-border/60 bg-muted/20 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl bg-primary/10 p-2 text-primary">
                      <ClipboardList size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{report.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPortalDate(report.report_date)}
                      </p>
                      <p className="mt-2 line-clamp-4 text-sm text-foreground/80">
                        {report.report_text}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-primary">
            <Paperclip size={18} />
            <CardTitle className="text-lg">Materiais e orientacoes</CardTitle>
          </div>
          <CardDescription>
            Arquivos enviados pela clinica e proximos passos registrados apos suas consultas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {materialRecords.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum material complementar foi liberado ainda.
            </p>
          ) : (
            materialRecords.map((record) => (
              <div
                key={record.id ?? `${record.booking_group_id}-${record.created_at}`}
                className="rounded-2xl border border-border/60 bg-muted/20 p-4"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  <span>Consulta</span>
                  {record.created_at ? <span>{formatPortalDate(record.created_at.slice(0, 10))}</span> : null}
                </div>

                {record.next_steps?.trim() ? (
                  <div className="mt-3 rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3">
                    <div className="mb-2 flex items-center gap-2 text-primary">
                      <CalendarCheck size={16} />
                      <p className="text-sm font-semibold">Proximos passos</p>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-foreground/80">
                      {record.next_steps}
                    </p>
                  </div>
                ) : null}

                {(record.files?.length ?? 0) > 0 ? (
                  <div className="mt-3 space-y-2">
                    {record.files?.map((file, index) => (
                      <a
                        key={`${file.url}-${index}`}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm text-foreground transition-colors hover:border-primary/30 hover:text-primary"
                      >
                        <Paperclip size={15} className="shrink-0" />
                        <span className="flex-1 truncate">{file.name}</span>
                        <ArrowRight size={15} className="shrink-0" />
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
