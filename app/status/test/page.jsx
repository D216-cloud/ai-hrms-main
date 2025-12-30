import { Suspense } from "react";
import TestPageClient from "./TestPageClient";

export default function TestPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center">Loading...</div>}>
      <TestPageClient />
    </Suspense>
  );
}
