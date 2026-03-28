import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getSeverityTone, getStatusTone } from "@/lib/workflow";

export function StatusBadge({
  value,
  kind = "status",
}: {
  value: string;
  kind?: "status" | "severity";
}) {
  return (
    <Badge
      className={cn(
        "rounded-full border-0 px-2.5 py-1 text-[11px] font-medium tracking-[0.18em] uppercase",
        kind === "status" ? getStatusTone(value as never) : getSeverityTone(value as never),
      )}
    >
      {value}
    </Badge>
  );
}
