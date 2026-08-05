import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  PATIENT_SEGMENT_LABELS,
  type PatientSegmentKey,
} from "@/lib/patientSegments";

interface PatientSegmentsBadgesProps {
  segments: PatientSegmentKey[];
  limit?: number;
  className?: string;
}

export function PatientSegmentsBadges({
  segments,
  limit = 3,
  className,
}: PatientSegmentsBadgesProps) {
  if (segments.length === 0) return null;

  const visibleSegments = segments.slice(0, Math.max(limit, 0));
  const hiddenCount = Math.max(segments.length - visibleSegments.length, 0);

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {visibleSegments.map((segment) => (
        <Badge
          key={segment}
          variant="outline"
          className="border-border/70 bg-muted/30 text-[11px] font-medium text-muted-foreground"
          title={PATIENT_SEGMENT_LABELS[segment]}
        >
          {PATIENT_SEGMENT_LABELS[segment]}
        </Badge>
      ))}

      {hiddenCount > 0 ? (
        <Badge
          variant="outline"
          className="border-dashed border-border/70 bg-background text-[11px] font-medium text-muted-foreground"
          title={`${hiddenCount} segmento(s) adicional(is)`}
        >
          +{hiddenCount}
        </Badge>
      ) : null}
    </div>
  );
}
