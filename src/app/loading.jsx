import React from "react";
import LoadingSpinner from "@/components/ui/loading-spinner";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] w-full flex-1 items-center justify-center py-12">
      <LoadingSpinner text="กำลังโหลด..." />
    </div>
  );
}
