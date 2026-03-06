import { Suspense } from "react";
import DevicesClient from "./DevicesClient";

export default function DevicesPage() {
  return (
    <Suspense>
      <DevicesClient />
    </Suspense>
  );
}
