import { getBmiClass } from "@/lib/patientAnthropometry";

export function BMIBadge({ bmi }: { bmi: string }) {
  const num = parseFloat(bmi);
  const { label, cls } = getBmiClass(num);

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
}
