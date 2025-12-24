import { Suspense } from "react";
import MomoReturnPage from "./page.client";

export default function MomoReturnPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MomoReturnPage />
    </Suspense>
  );
}
