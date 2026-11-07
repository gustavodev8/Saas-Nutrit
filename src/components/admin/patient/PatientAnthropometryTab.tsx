import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Eye, Loader2, Pencil, Scale, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AnthropometryWizard } from "@/components/admin/AnthropometryWizard";
import type {
  MeasurementForm,
  OfficialAnthropometrySource,
} from "@/components/admin/anthropometryTypes";
import { BMIBadge } from "@/components/admin/patient/anthropometry/BMIBadge";
import { WorkspaceMeasurementReport } from "@/components/admin/patient/WorkspaceMeasurementReport";
import { useConsultation } from "@/contexts/ConsultationContext";
import {
  buildAnthropometryPayload,
  buildLatestMeasurementSummary,
  calcBMI,
  formatMeasurementHistoryCount,
  toMeasurementRecord,
} from "@/lib/patientAnthropometry";
import type { SkinfoldProtocol } from "@/lib/anthropometryUtils";
import { calculateFourComponentAnthropometry } from "@/lib/fourComponentAnthropometry";
import {
  deleteMeasurement,
  fetchMeasurements,
  insertMeasurement,
  type Measurement,
  type Patient,
  updateMeasurement,
} from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  createWorkspaceMeasurement,
  fetchWorkspaceMeasurements,
  isWorkspaceMeasurementsEnabled,
  updateWorkspaceMeasurement,
  WORKSPACE_MEASUREMENTS_GATE_MESSAGE,
} from "@/lib/workspaceMeasurements";
import type { WorkspaceMeasurement } from "@/lib/workspaceMeasurements";
import type { WorkspacePatient } from "@/lib/workspacePatients";

interface PatientAnthropometryTabProps {
  patientId: string;
  patient: Patient;
  workspaceId?: string;
  workspaceName?: string;
  workspacePatient?: WorkspacePatient;
}

interface PatientAnthropometryContentProps extends PatientAnthropometryTabProps {
  onMeasurementSaved?: (measurement: Measurement) => void;
}

function formatDate(dateStr: string) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function PatientAnthropometryTab({
  ...props
}: PatientAnthropometryTabProps) {
  if (props.workspaceId !== undefined) {
    return <PatientAnthropometryContent {...props} />;
  }
  return <LegacyPatientAnthropometryTab {...props} />;
}

function LegacyPatientAnthropometryTab(props: PatientAnthropometryTabProps) {
  const { setMeasurement } = useConsultation();
  return <PatientAnthropometryContent {...props} onMeasurementSaved={setMeasurement} />;
}

function PatientAnthropometryContent({
  patientId,
  patient,
  workspaceId,
  workspaceName,
  workspacePatient,
  onMeasurementSaved,
}: PatientAnthropometryContentProps) {
  const pid = Number(patientId);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<Measurement | null>(
    null,
  );
  const [workspaceError, setWorkspaceError] = useState("");
  const [workspaceReport, setWorkspaceReport] = useState<{ scope: string; measurementId: number } | null>(null);
  const workspaceMode = workspaceId !== undefined;
  const workspaceScope = `${workspaceId ?? "legacy"}:${pid}`;

  useEffect(() => {
    let active = true;

    if (workspaceMode) {
      setMeasurements([]);
      setEditingMeasurement(null);
      setWorkspaceError("");
      if (!isWorkspaceMeasurementsEnabled()) {
        setWorkspaceError(WORKSPACE_MEASUREMENTS_GATE_MESSAGE);
        setLoading(false);
        return () => { active = false; };
      }
      if (!workspacePatient || workspacePatient.workspace_id !== workspaceId) {
        setWorkspaceError("Não foi possível validar o escopo deste paciente.");
        setLoading(false);
        return () => { active = false; };
      }
      setLoading(true);
      fetchWorkspaceMeasurements(workspaceId, workspacePatient.id)
        .then((data) => { if (active) setMeasurements(data); })
        .catch((error: unknown) => {
          if (active) setWorkspaceError(error instanceof Error ? error.message : WORKSPACE_MEASUREMENTS_GATE_MESSAGE);
        })
        .finally(() => { if (active) setLoading(false); });

      return () => { active = false; };
    }

    fetchMeasurements(pid)
      .then((data) => {
        if (active) {
          setMeasurements(data);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [pid, workspaceId, workspaceMode, workspacePatient]);

  const handleSave = async (
    form: MeasurementForm,
    protocol: SkinfoldProtocol,
    officialSource: OfficialAnthropometrySource,
    editingId?: number,
  ): Promise<boolean> => {
    setSaving(true);
    try {
      if (workspaceMode) {
        if (!workspaceId || !workspacePatient || workspacePatient.workspace_id !== workspaceId) {
          throw new Error("Não foi possível validar o escopo deste paciente.");
        }
        const result = editingId
          ? await updateWorkspaceMeasurement(workspaceId, workspacePatient, editingId, form, protocol, officialSource)
          : await createWorkspaceMeasurement(workspaceId, workspacePatient, form, protocol, officialSource);
        setMeasurements((current) => editingId
          ? current.map((measurement) => measurement.id === editingId ? result : measurement)
          : [result, ...current].sort((a, b) => b.assessment_date.localeCompare(a.assessment_date) || (b.id ?? 0) - (a.id ?? 0)));
        setEditingMeasurement(null);
        setWorkspaceError("");
        toast.success(editingId ? "Avaliação atualizada!" : "Avaliação registrada!");
        return true;
      }
      const payload = await buildAnthropometryPayload({
        form,
        patientId: pid,
        patientGender: patient.gender,
        patientBirthDate: patient.birth_date,
        protocol,
        officialSource,
      });

      if (editingId) {
        const result = await updateMeasurement(
          editingId,
          toMeasurementRecord(payload),
        );
        if (result) {
          setMeasurements((current) =>
            current.map((measurement) =>
              measurement.id === editingId ? result : measurement,
            ),
          );
          onMeasurementSaved?.(result);
          toast.success("Avaliação atualizada!");
          setEditingMeasurement(null);
        } else {
          toast.error("Erro ao atualizar avaliação.");
          return false;
        }
      } else {
        const result = await insertMeasurement(toMeasurementRecord(payload));
        if (result) {
          setMeasurements((current) => [result, ...current]);
          onMeasurementSaved?.(result);
          toast.success("Avaliação registrada!");
        } else {
          toast.error("Erro ao salvar avaliação.");
          return false;
        }
        return true;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[handleSave] exceção:", error);
      toast.error(`Erro ao salvar: ${message}`);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (measurementId: number) => {
    if (workspaceMode) return;
    if (!confirm("Excluir avaliação?")) return;
    if (await deleteMeasurement(measurementId)) {
      setMeasurements((current) =>
        current.filter((measurement) => measurement.id !== measurementId),
      );
      toast.success("Removida.");
    }
  };

  const latest = measurements[0];
  const latestBmi = latest ? calcBMI(latest.weight, latest.height) : null;
  const latestSummary = buildLatestMeasurementSummary(latest, latestBmi);
  const latestFourComponent = latest &&
    latest.weight != null &&
    latest.height != null &&
    latest.body_fat != null &&
    latest.biestyloid_diameter_mm != null &&
    latest.biepicondylar_femur_diameter_mm != null &&
    latest.four_component_reference
    ? calculateFourComponentAnthropometry({
        weightKg: latest.weight,
        heightCm: latest.height,
        bodyFatPct: latest.body_fat,
        biestyloidDiameterMm: latest.biestyloid_diameter_mm,
        biepicondylarFemurDiameterMm: latest.biepicondylar_femur_diameter_mm,
        reference: latest.four_component_reference,
      }).result
    : null;

  const selectedWorkspaceMeasurement = workspaceMode && workspaceReport?.scope === workspaceScope
    ? measurements.find((measurement) => measurement.id === workspaceReport.measurementId
      && "workspace_id" in measurement && measurement.workspace_id === workspaceId && measurement.patient_id === pid)
    : null;

  if (selectedWorkspaceMeasurement && workspaceId) {
    return (
      <WorkspaceMeasurementReport
        measurementId={selectedWorkspaceMeasurement.id!}
        measurements={measurements as WorkspaceMeasurement[]}
        workspaceId={workspaceId}
        patientId={pid}
        patientName={patient.name}
        workspaceName={workspaceName?.trim() || "Workspace"}
        gender={patient.gender === "M" || patient.gender === "F" ? patient.gender : null}
        birthDate={patient.birth_date ?? null}
        onBack={() => setWorkspaceReport(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {workspaceMode && workspaceError && (
        <p role="alert" className="rounded-md border border-amber-500/40 bg-amber-50 p-3 text-sm text-amber-900">
          {workspaceError}
        </p>
      )}
      {latest && (
        <div className="space-y-3">
          <div className="flex items-stretch gap-0 border border-border rounded-md overflow-hidden">
            <div className="px-4 py-3.5 bg-muted/50 border-r border-border flex flex-col justify-center shrink-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Última
              </p>
              <p className="text-sm font-medium text-foreground mt-0.5">
                {latest.assessment_date ? formatDate(latest.assessment_date) : "—"}
              </p>
            </div>
            {latestSummary.map((item, index) => (
              <div
                key={item.label}
                className={`flex-1 px-4 py-3.5 bg-card flex flex-col justify-center min-w-0${
                  index > 0 ? " border-l border-border" : ""
                }`}
              >
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  {item.label}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <p className="text-[15px] font-bold tabular-nums text-foreground">
                    {item.value}
                  </p>
                  {item.badge && <BMIBadge bmi={item.badge} />}
                </div>
              </div>
            ))}
          </div>
          {latestFourComponent && (
            <div className="rounded-md border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-xs font-semibold text-primary">Estimativa antropométrica de quatro componentes</p>
              <p className="mt-1 text-sm text-foreground">
                Gorda {latestFourComponent.fatMassKg} kg · Óssea {latestFourComponent.boneMassKg} kg · Residual {latestFourComponent.residualMassKg} kg · Muscular estimada {latestFourComponent.estimatedMuscleMassKg} kg
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Estimativa antropométrica, não diagnóstico ou densitometria.</p>
            </div>
          )}
        </div>
      )}

      {!workspaceMode && measurements.length > 0 && (
        <div className="flex justify-end">
          <Link to={`/admin/pacientes/${patientId}/relatorio-antropometrico`}>
            <Button variant="outline" size="sm" className="h-8 rounded-md text-sm gap-1.5">
              <Eye size={13} /> Ver Relatório
            </Button>
          </Link>
        </div>
      )}

      {(!workspaceMode || (!workspaceError && !loading)) && (
        <AnthropometryWizard
          patient={patient}
          latestMeasurement={measurements[0] ?? null}
          editingMeasurement={editingMeasurement}
          onSave={handleSave}
          onCancelEdit={() => setEditingMeasurement(null)}
          saving={saving}
        />
      )}

      {workspaceMode && workspaceError ? null : loading ? (
        <div className="flex items-center justify-center h-24">
          <Loader2 className="animate-spin text-primary" size={22} />
        </div>
      ) : measurements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2 border border-border rounded-md bg-card text-muted-foreground">
          <Scale size={26} className="opacity-30" />
          <p className="text-sm text-center">
            Registre a primeira avaliação para liberar histórico e comparações.
          </p>
        </div>
      ) : (
        <div className="border border-border rounded-md overflow-hidden bg-card">
          <div className="px-5 py-3.5 border-b border-border bg-muted/30 flex items-center gap-2">
            <Activity size={15} className="text-muted-foreground" />
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Histórico · {measurements.length} {measurements.length === 1 ? "avaliação" : "avaliações"}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-border">
                  {[
                    "Data",
                    "Peso",
                    "Altura",
                    "IMC",
                    "% Gordura",
                    "Protocolo",
                    "Cintura",
                    "",
                  ].map((column, index) => (
                    <th
                      key={column}
                      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/50${
                        index === 0 ? " text-left" : " text-right"
                      }${index === 7 ? " w-28" : ""}`}
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {measurements.map((measurement, index) => {
                  const bmi = calcBMI(measurement.weight, measurement.height);
                  return (
                    <tr
                      key={measurement.id}
                      className={`border-b border-border/60 last:border-0 hover:bg-muted/30 transition-colors${
                        index === 0 ? " bg-primary/[0.03]" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {index === 0 && (
                            <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary">
                              Recente
                            </span>
                          )}
                          {measurement.assessment_date
                            ? formatDate(measurement.assessment_date)
                            : "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">
                        {measurement.weight ? `${measurement.weight} kg` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">
                        {measurement.height ? `${measurement.height} cm` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">
                        {bmi ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="font-semibold tabular-nums">{bmi}</span>
                            <BMIBadge bmi={bmi} />
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">
                        {measurement.body_fat != null
                          ? `${measurement.body_fat}%`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                        {measurement.sf_protocol ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-sm tabular-nums">
                        {measurement.waist ? `${measurement.waist} cm` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          {!workspaceMode && <Link
                            to={`/admin/pacientes/${patientId}/relatorio-antropometrico?measurement=${measurement.id}`}
                            className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Abrir detalhes"
                          >
                            <Eye size={14} />
                          </Link>}
                          {workspaceMode && <button
                            type="button"
                            onClick={() => setWorkspaceReport({ scope: workspaceScope, measurementId: measurement.id! })}
                            className="flex h-7 items-center justify-center rounded px-2 text-xs font-medium text-muted-foreground hover:bg-primary/10 hover:text-primary"
                            aria-label={`Abrir relatório da avaliação de ${formatDate(measurement.assessment_date)}`}
                          >
                            <Eye size={14} aria-hidden="true" />
                            <span className="ml-1">Detalhes</span>
                          </button>}
                          <button
                            onClick={() => {
                              setEditingMeasurement(measurement);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Editar avaliação"
                            aria-label="Editar avaliação"
                          >
                            <Pencil size={14} />
                          </button>
                          {!workspaceMode && <button
                            onClick={() => handleDelete(measurement.id!)}
                            className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            aria-label="Excluir avaliação"
                          >
                            <Trash2 size={14} />
                          </button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-border/60 bg-muted/30">
            <p className="text-xs text-muted-foreground">
              {formatMeasurementHistoryCount(measurements.length)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
