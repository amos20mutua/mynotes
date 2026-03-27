import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref
}: {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <Card className="flex flex-col items-start gap-4">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="text-sm leading-6 text-slate-400">{description}</p>
      </div>
      <Button asChild variant="accent">
        <a href={actionHref}>{actionLabel}</a>
      </Button>
    </Card>
  );
}
