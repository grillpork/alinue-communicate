"use client";

import React from "react";
import ErrorState from "@/components/ui/error-state";

export default function Error({ error, reset }) {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center p-6">
      <ErrorState
        error={error}
        onRetry={reset}
      />
    </div>
  );
}
