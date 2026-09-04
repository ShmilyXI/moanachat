import { Suspense } from "react";

import { isGoogleAuthEnabled } from "../auth";
import { LoginForm } from "./login-form";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginForm googleEnabled={isGoogleAuthEnabled} />
    </Suspense>
  );
}
