import { Suspense } from "react";

import { RegisterForm } from "./register-form";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
