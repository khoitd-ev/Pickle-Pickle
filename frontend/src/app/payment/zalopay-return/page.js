import { Suspense } from "react";
import ZalopayReturnPage from "./page.client";

export default function ZalopayReturnPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ZalopayReturnPage />
    </Suspense>
  );
}
