import { Suspense } from "react";

import { isGoogleAuthEnabled } from "../auth";
import { RegisterForm } from "./register-form";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <RegisterForm googleEnabled={isGoogleAuthEnabled} />
    </Suspense>
  );
}
