import { ArrowRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="border-white/60 bg-white/80 shadow-[0_25px_60px_-40px_rgba(18,32,40,0.4)] backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-3xl font-semibold tracking-tight text-foreground">{value}</div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowRight className="size-4" />
          <span>{detail}</span>
        </div>
      </CardContent>
    </Card>
  );
}
