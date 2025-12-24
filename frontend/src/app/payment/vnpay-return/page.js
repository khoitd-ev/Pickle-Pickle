import { Suspense } from "react";
import VnpayReturnPage from "./page.client";

export default function VnpayReturnPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VnpayReturnPage />
    </Suspense>
  );
}
