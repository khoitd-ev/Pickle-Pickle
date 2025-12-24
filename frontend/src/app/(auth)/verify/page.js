import { Suspense } from "react";
import VerifyClient from "./page.client";

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyClient />
    </Suspense>
  );
}
