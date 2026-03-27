import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="mx-auto max-w-2xl space-y-5 text-center">
        <Badge>Not found</Badge>
        <h1 className="text-4xl font-semibold text-white">That note or view is missing</h1>
        <p className="text-base leading-7 text-slate-300">
          The link may be outdated, the note may not exist yet, or this part of the vault has not been created.
        </p>
        <div className="flex justify-center gap-3">
          <Button asChild variant="accent">
            <Link href="/">Open graph</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/">Return to vault</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
