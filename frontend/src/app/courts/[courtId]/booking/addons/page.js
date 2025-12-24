import { Suspense } from "react";
import CourtBookingAddonsPage from "./page.client";

export default function CourtBookingAddonsPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CourtBookingAddonsPage />
    </Suspense>
  );
}
