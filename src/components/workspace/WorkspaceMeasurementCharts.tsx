import { useEffect, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { fetchWorkspaceMeasurements, type WorkspaceMeasurement } from "@/lib/workspaceMeasurements";

interface Props {
  workspaceId: string;
  patientId: number;
}

type Pt = {
  date: string;
  weight?: number;
  body_fat?: number;
  lean_mass?: number;
  waist?: number;
  hip?: number;
};

const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

function buildPoints(ms: WorkspaceMeasurement[]): Pt[] {
  return [...ms]
    .sort((a, b) => a.assessment_date.localeCompare(b.assessment_date))
    .map((m) => ({
      date:      fmtDate(m.assessment_date),
      weight:    m.weight    ?? undefined,
      body_fat:  m.body_fat  ?? undefined,
      lean_mass: m.lean_mass ?? undefined,
      waist:     m.waist     ?? undefined,
      hip:       m.hip       ?? undefined,
    }));
}

function hasData(pts: Pt[], key: keyof Pt) {
  return pts.filter((p) => p[key] != null).length >= 2;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-border bg-card px-3 py-2 text-xs shadow-md">
      <p className="font-semibold mb-1 text-muted-foreground">{label}</p>
      {payload.map((e: { name: string; value: number; unit?: string; color: string }) => (
        <p key={e.name} style={{ color: e.color }}>
          {e.name}: <span className="font-semibold">{e.value?.toFixed(1)}{e.unit ?? ""}</span>
        </p>
      ))}
    </div>
  );
}

function MiniChart({
  title,
  pts,
  lines,
}: {
  title: string;
  pts: Pt[];
  lines: Array<{ key: keyof Pt; color: string; name: string; unit?: string }>;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{title}</p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={pts} margin={{ top: 2, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
          <Tooltip content={<ChartTip />} />
          {lines.map((l) => (
            <Line
              key={l.key as string}
              type="monotone"
              dataKey={l.key as string}
              stroke={l.color}
              strokeWidth={2}
              dot={{ r: 3, fill: l.color, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              name={l.name}
              unit={l.unit}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WorkspaceMeasurementCharts({ workspaceId, patientId }: Props) {
  const [pts, setPts] = useState<Pt[]>([]);

  useEffect(() => {
    fetchWorkspaceMeasurements(workspaceId, patientId)
      .then((ms) => setPts(buildPoints(ms)))
      .catch(() => setPts([]));
  }, [workspaceId, patientId]);

  if (pts.length < 2) return null;

  const showWeight    = hasData(pts, "weight");
  const showBodyFat   = hasData(pts, "body_fat") || hasData(pts, "lean_mass");
  const showCirc      = hasData(pts, "waist") || hasData(pts, "hip");

  if (!showWeight && !showBodyFat && !showCirc) return null;

  return (
    <div className="rounded-xl border border-border bg-card/50 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp size={15} className="text-[#166b50]" />
        <p className="text-sm font-semibold text-foreground">Evolução</p>
        <span className="text-xs text-muted-foreground">— {pts.length} avaliações</span>
      </div>

      <div className={`grid gap-3 ${showWeight && showBodyFat ? "sm:grid-cols-2" : ""}`}>
        {showWeight && (
          <MiniChart
            title="Peso"
            pts={pts}
            lines={[{ key: "weight", color: "#166b50", name: "Peso", unit: " kg" }]}
          />
        )}
        {showBodyFat && (
          <MiniChart
            title="Composição corporal"
            pts={pts}
            lines={[
              ...(hasData(pts, "body_fat")  ? [{ key: "body_fat"  as keyof Pt, color: "#e07b39", name: "% Gordura", unit: "%" }] : []),
              ...(hasData(pts, "lean_mass") ? [{ key: "lean_mass" as keyof Pt, color: "#1a8464", name: "M. Magra",  unit: " kg" }] : []),
            ]}
          />
        )}
      </div>

      {showCirc && (
        <MiniChart
          title="Circunferências"
          pts={pts}
          lines={[
            ...(hasData(pts, "waist") ? [{ key: "waist" as keyof Pt, color: "#7c5cbf", name: "Cintura", unit: " cm" }] : []),
            ...(hasData(pts, "hip")   ? [{ key: "hip"   as keyof Pt, color: "#c45c8a", name: "Quadril", unit: " cm" }] : []),
          ]}
        />
      )}
    </div>
  );
}
