"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-7xl items-center px-4 py-12 sm:px-6 lg:px-8">
      <Card className="mx-auto max-w-2xl space-y-5">
        <h1 className="text-3xl font-semibold text-white">Something interrupted the vault</h1>
        <p className="text-base leading-7 text-slate-300">
          The app hit an unexpected state while loading or updating your notes. Try again, and if it persists, check the runtime logs.
        </p>
        <Button variant="accent" type="button" onClick={reset}>
          Try again
        </Button>
      </Card>
    </div>
  );
}
